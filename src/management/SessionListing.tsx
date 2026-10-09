import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { faPlay, faShareNodes } from "@fortawesome/free-solid-svg-icons";
import SourceDataContext from "../context/SourceDataContext";
import { SessionForm } from "../forms/SessionForm";
import { sortObject, toStringArray } from "../common/utils";
import BaseListing from "./BaseListing";
import { ManageListHeader } from "./ManageListHeader";
import { EmptyState } from "./EmptyState";
import { EntityCard } from "./EntityCard";
import { LoadMore } from "./LoadMore";
import { useLoadMore } from "../common/useLoadMore";
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
      Object.entries(sessions).filter(([key]) =>
        key.toLowerCase().includes(search.toLowerCase())
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions, search]
  );

  const graph = useMemo(() => buildRelationshipGraph(sourceData), [sourceData]);

  const rows: SessionRow[] = entries.map(([key, value]) => ({
    key,
    session: value,
    usageCount: getDirectReferencers(nodeId("session", key), graph.edges).length,
  }));

  const openSession = (session: any) => {
    setFormData({ ...session, supersets: toStringArray(session.supersets) });
    setFormType("edit");
  };

  const shareUrl = (session: any) =>
    `${window.location.origin}/training-planner/share/${session.id}`;

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

      {viewMode === "table" ? (
        <DataTable
          columns={[
            ...columns,
            { key: "actions", header: "Actions", render: (row) => renderActions(row, "menu") },
          ]}
          rows={rows.slice(0, limit)}
          getRowKey={(row) => row.key}
          emptyMessage={
            search
              ? "No sessions match your search."
              : "No sessions yet. Add your first session to get started."
          }
        />
      ) : (
        <>
          {entries.length === 0 && (
            <EmptyState
              message={
                search
                  ? "No sessions match your search."
                  : "No sessions yet. Add your first session to get started."
              }
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.slice(0, limit).map((row) => {
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
        </>
      )}

      <LoadMore shown={limit} total={rows.length} onLoadMore={loadMore} onShowAll={showAll} />

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
            <div className="flex justify-end gap-2">
              {shareDialog.step === "confirm" ? (
                <>
                  <Button
                    label="Cancel"
                    decoration="cancel"
                    onClick={() => setShareDialog(null)}
                  />
                  <Button
                    label="Share and copy link"
                    onClick={() => enableSharing(shareDialog.session)}
                  />
                </>
              ) : (
                <Button label="Close" onClick={() => setShareDialog(null)} />
              )}
            </div>
          </div>
        </Modal>
      )}
    </BaseListing>
  );
};
