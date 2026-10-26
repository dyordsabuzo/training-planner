import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { faChevronDown, faChevronRight, faPlay, faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SourceDataContext from "../context/SourceDataContext";
import AuthContext from "../context/AuthContext";
import { SessionForm } from "../forms/SessionForm";
import { sortObject, toStringArray, SourceDbReferences } from "../common/utils";
import BaseListing from "./BaseListing";
import { ManageListHeader } from "./ManageListHeader";
import { EmptyState } from "./EmptyState";
import { EntityCard } from "./EntityCard";
import { LoadMore } from "./LoadMore";
import { useLoadMore } from "../common/useLoadMore";
import { isListed } from "../common/sharing";
import { EntityActions, ActionsVariant } from "./EntityActions";
import { cloneSession } from "./cloneEntity";
import { resolveSession, sessionUnitKeys, sessionUnitNames } from "../pages/resolveSessionSupersets";
import dayjs from "dayjs";

import { DataTable, DataTableColumn, Badge, Button, Modal } from "@dyordsabuzo/ui-components";
import {
  buildRelationshipGraph,
  getDirectReferencers,
  nodeId,
} from "./buildRelationshipGraph";

type Props = {
  viewMode?: "card" | "table";
};

type SessionRow = {
  key: string;
  session: any;
  usageCount: number;
};

const columns: DataTableColumn<SessionRow>[] = [
  { key: "name", header: "Name", render: (row) => <span className="font-bold">{row.key}</span> },
  {
    key: "groups",
    header: "Groups",
    render: (row) => {
      const supersets = sessionUnitNames(row.session);
      return supersets.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {supersets.map((s, i) => (
            <Badge key={`${s}-${i}`} variant="neutral">{s}</Badge>
          ))}
        </div>
      ) : (
        <span className="text-text-muted-light dark:text-text-muted-dark italic">None</span>
      );
    },
  },
  {
    key: "tags",
    header: "Tags",
    render: (row) => {
      const tags = toStringArray(row.session.tags);
      return tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <Badge key={t} variant="primary">{t}</Badge>
          ))}
        </div>
      ) : (
        <span className="text-text-muted-light dark:text-text-muted-dark italic">None</span>
      );
    },
  },
  {
    key: "usage",
    header: "Used by",
    render: (row) =>
      row.usageCount > 0 ? `${row.usageCount} plan${row.usageCount === 1 ? "" : "s"}` : "—",
  },
];

const PAGE_SIZE = 12;

export const SessionListing = ({ viewMode = "card" }: Props) => {
  const [formData, setFormData] = useState<any>({});
  const [formType, setFormType] = useState("");
  const [search, setSearch] = useState("");
  const { limit, loadMore, showAll } = useLoadMore(PAGE_SIZE, search);
  // Sections start collapsed; the user opens the kind they want to see.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleSection = (title: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  const [shareDialog, setShareDialog] = useState<{
    session: any;
    step: "confirm" | "copied" | "failed";
  } | null>(null);

  const navigate = useNavigate();
  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const sessions = sortObject(sourceData.sessions ?? {});
  const entries = useMemo(
    () =>
      Object.entries(sessions).filter(
        ([key, value]) => isListed(value) && key.toLowerCase().includes(search.toLowerCase())
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions, search]
  );

  const graph = useMemo(() => buildRelationshipGraph(sourceData), [sourceData]);

  const allRows: SessionRow[] = entries.map(([key, value]) => ({
    key,
    session: value,
    usageCount: getDirectReferencers(nodeId("session", key), graph.edges).length,
  }));

  // Sessions are grouped by what they're built from. Paging runs over the
  // open sections only, so earlier ones fill before later ones.
  const unitKind = ({ session }: SessionRow) => {
    const hasSupersets = toStringArray(session.supersets).length > 0;
    const hasGroups = (session.groups?.length ?? 0) > 0;
    if (hasSupersets && hasGroups) return "Supersets & exercise groups";
    return hasGroups ? "Exercise groups" : "Supersets";
  };
  const sectionTitles = ["Supersets", "Exercise groups", "Supersets & exercise groups"];
  // Exercise-group sessions run newest date first; undated ones keep name
  // order at the end (dates are YYYY-MM-DD, so string compare works).
  const byDateDesc = (a: SessionRow, b: SessionRow) =>
    (b.session.date ?? "").localeCompare(a.session.date ?? "");
  const grouped = sectionTitles.map((title) => {
    const rows = allRows.filter((row) => unitKind(row) === title);
    return { title, rows: title === "Exercise groups" ? rows.sort(byDateDesc) : rows };
  });
  const rows = grouped.flatMap((section) => section.rows);
  const openTotal = grouped
    .filter((section) => expanded.has(section.title))
    .reduce((sum, section) => sum + section.rows.length, 0);
  let offset = 0;
  const sections = grouped
    .filter((section) => section.rows.length > 0)
    .map((section) => {
      const isOpen = expanded.has(section.title);
      const shown = isOpen ? section.rows.slice(0, Math.max(0, limit - offset)) : [];
      if (isOpen) offset += section.rows.length;
      return { title: section.title, count: section.rows.length, isOpen, rows: shown };
    });

  // Linked items are read-only (their ⋮ menu has Details).
  const openSession = (session: any) => {
    if (session.linked) return;
    setFormData({ ...session, supersets: toStringArray(session.supersets) });
    setFormType("edit");
  };

  const { activeOrgId } = useContext(AuthContext);
  const shareUrl = (session: any) =>
    `${window.location.origin}/training-planner/share/${activeOrgId}/${session.id}`;

  const copyLink = async (session: any) => {
    try {
      await navigator.clipboard.writeText(shareUrl(session));
      setShareDialog({ session, step: "copied" });
    } catch {
      setShareDialog({ session, step: "failed" });
    }
  };

  const handleShare = (session: any) => {
    if (!session.id) return;
    if (session.isShareable) {
      copyLink(session);
    } else {
      setShareDialog({ session, step: "confirm" });
    }
  };

  const enableSharing = (session: any) => {
    // The shared link reads this snapshot directly (see SessionForm).
    sourceDataContext.editSession({
      ...session,
      isShareable: true,
      sharedSnapshot: resolveSession(sourceData, session),
      sharedOrder: sessionUnitKeys(session),
    });
    copyLink(session);
  };

  const renderActions = ({ session, usageCount }: SessionRow, variant?: ActionsVariant) => (
    <EntityActions
      variant={variant}
      sharing={{ db: SourceDbReferences.SESSIONS, entity: session }}
      onEdit={() => openSession(session)}
      onClone={() => {
        setFormData(cloneSession(session));
        setFormType("add");
      }}
      onDelete={() => sourceDataContext.deleteSession(session)}
      deleteImpactMessage={
        usageCount > 0
          ? `This session is used by ${usageCount} plan${usageCount === 1 ? "" : "s"}. Deleting it will leave those references broken. This can't be undone.`
          : undefined
      }
      extraActions={[
        {
          label: "Simulate",
          icon: faPlay,
          onClick: () =>
            navigate(`/training-planner/manage/simulate/${encodeURIComponent(session.name)}`),
        },
        {
          label: session.isShareable ? "Copy share link" : "Share",
          icon: faShareNodes,
          onClick: () => handleShare(session),
        },
      ]}
    />
  );

  return (
    <BaseListing>
      <ManageListHeader
        title="Sessions"
        count={Object.keys(sessions).length}
        addLabel="Add Session"
        searchPlaceholder="Search sessions..."
        search={search}
        onSearchChange={setSearch}
        onAdd={() => {
          setFormData({});
          setFormType("add");
        }}
      />

      {rows.length === 0 && (
        <EmptyState
          message={
            search
              ? "No sessions match your search."
              : "No sessions yet. Add your first session to get started."
          }
        />
      )}

      {sections.map((section, index) => (
        <section
          key={section.title}
          className={`flex flex-col gap-3 ${
            index > 0 ? "mt-6 pt-6 border-t border-gray-200 dark:border-gray-700" : ""
          }`}
        >
          <h2>
            <button
              type="button"
              aria-expanded={section.isOpen}
              onClick={() => toggleSection(section.title)}
              className="flex items-center gap-2 min-h-11 text-xs font-medium uppercase tracking-wide
                text-text-muted-light dark:text-text-muted-dark hover:text-primary dark:hover:text-primary-300
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              <FontAwesomeIcon icon={section.isOpen ? faChevronDown : faChevronRight} className="w-3" />
              {section.title} ({section.count})
            </button>
          </h2>
          {!section.isOpen ? null : viewMode === "table" ? (
            <DataTable
              columns={[
                ...columns,
                { key: "actions", header: "Actions", render: (row) => renderActions(row, "menu") },
              ]}
              rows={section.rows}
              getRowKey={(row) => row.key}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {section.rows.map((row) => {
                const { key, session, usageCount } = row;
                return (
                <EntityCard
                  key={key}
                  title={key}
                  relatedLabel="Groups"
                  relatedItems={sessionUnitNames(session)}
                  meta={session.date ? dayjs(session.date).format("ddd, MMM D, YYYY") : undefined}
                  tags={session.tags}
                  usageCount={usageCount}
                  usageLabel="plan"
                  onOpen={() => openSession(session)}
                  actions={renderActions(row)}
                />
                );
              })}
            </div>
          )}
        </section>
      ))}

      <LoadMore shown={limit} total={openTotal} onLoadMore={loadMore} onShowAll={showAll} />

      {formType && (
        <SessionForm
          key={`${formType}-${formData?.id ?? formData?.name ?? "new"}`}
          data={formData}
          type={formType}
          closeForm={() => setFormType("")}
        />
      )}

      {shareDialog && (
        <Modal
          title="Share session"
          isOpen={true}
          onClose={() => setShareDialog(null)}
        >
          <div className="flex flex-col gap-4">
            <span className="text-sm text-text-light dark:text-text-dark">
              {shareDialog.step === "confirm" &&
                `Make "${shareDialog.session.name}" shareable? Anyone with the link can simulate it without signing in.`}
              {shareDialog.step === "copied" && "Shareable link copied to clipboard."}
              {shareDialog.step === "failed" &&
                "Couldn't copy automatically. Copy the link below."}
            </span>
            {shareDialog.step !== "confirm" && (
              <span className="text-sm break-all text-text-muted-light dark:text-text-muted-dark">
                {shareUrl(shareDialog.session)}
              </span>
            )}
            <div className="flex gap-2">
              {shareDialog.step === "confirm" ? (
                <>
                  <Button
                    label="Cancel"
                    decoration="cancel"
                    className="flex-1"
                    onClick={() => setShareDialog(null)}
                  />
                  <Button
                    label="Share and copy link"
                    className="flex-1"
                    onClick={() => enableSharing(shareDialog.session)}
                  />
                </>
              ) : (
                <Button label="Close" className="flex-1" onClick={() => setShareDialog(null)} />
              )}
            </div>
          </div>
        </Modal>
      )}
    </BaseListing>
  );
};
