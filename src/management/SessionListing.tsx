import React, { useContext, useMemo, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";
import { SessionForm } from "../forms/SessionForm";
import { sortObject, toStringArray } from "../common/utils";
import BaseListing from "./BaseListing";
import { ManageListHeader } from "./ManageListHeader";
import { EmptyState } from "./EmptyState";
import { EntityCard } from "./EntityCard";
import { DataTable, DataTableColumn } from "../components/form/DataTable";
import { Badge } from "../components/others/Badge";
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
    key: "supersets",
    header: "Supersets",
    render: (row) => {
      const supersets = toStringArray(row.session.supersets);
      return supersets.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {supersets.map((s) => (
            <Badge key={s} variant="neutral">{s}</Badge>
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

export const SessionListing = ({ viewMode = "card" }: Props) => {
  const [formData, setFormData] = useState<any>({});
  const [formType, setFormType] = useState("");
  const [search, setSearch] = useState("");

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
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.key}
          onRowClick={(row) => openSession(row.session)}
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
            {rows.map(({ key, session, usageCount }) => (
              <EntityCard
                key={key}
                title={key}
                relatedLabel="Supersets"
                relatedItems={toStringArray(session.supersets)}
                tags={session.tags}
                usageCount={usageCount}
                usageLabel="plan"
                onClick={() => openSession(session)}
              />
            ))}
          </div>
        </>
      )}

      {formType && (
        <SessionForm data={formData} type={formType} closeForm={() => setFormType("")} />
      )}
    </BaseListing>
  );
};
