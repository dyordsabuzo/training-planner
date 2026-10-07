import React, { useContext, useMemo, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";
import { SupersetForm } from "../forms/SupersetForm";
import { sortObject, toStringArray } from "../common/utils";
import BaseListing from "./BaseListing";
import { ManageListHeader } from "./ManageListHeader";
import { EmptyState } from "./EmptyState";
import { EntityCard } from "./EntityCard";
import { LoadMore } from "./LoadMore";
import { useLoadMore } from "../common/useLoadMore";
import { EntityActions, ActionsVariant } from "./EntityActions";
import { cloneSuperset } from "./cloneEntity";

import { DataTable, DataTableColumn, Badge } from "@dyordsabuzo/ui-components";
import {
  buildRelationshipGraph,
  getDirectReferencers,
  nodeId,
} from "./buildRelationshipGraph";

type Props = {
  viewMode?: "card" | "table";
};

type SupersetRow = {
  key: string;
  superset: any;
  sessions: string[];
  usageCount: number;
};

const columns: DataTableColumn<SupersetRow>[] = [
  {
    key: "name",
    header: "Name",
    render: (row) => <span className="font-bold">{row.superset.name ?? row.key}</span>,
  },
  {
    key: "exercises",
    header: "Exercises",
    render: (row) => {
      const exercises = toStringArray(row.superset.exercises);
      return exercises.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {exercises.map((e) => (
            <Badge key={e} variant="neutral">{e}</Badge>
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
      const tags = toStringArray(row.superset.tags);
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
      row.usageCount > 0
        ? `${row.usageCount} session${row.usageCount === 1 ? "" : "s"}`
        : "—",
  },
];

const PAGE_SIZE = 12;

export const SupersetListing = ({ viewMode = "card" }: Props) => {
  const [formData, setFormData] = useState<any>({});
  const [formType, setFormType] = useState("");
  const [search, setSearch] = useState("");
  const { limit, loadMore, showAll } = useLoadMore(PAGE_SIZE, search);
  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const supersets = sortObject(sourceData.supersets ?? {});
  const entries = useMemo(
    () =>
      Object.entries(supersets).filter(([key]) =>
        key.toLowerCase().includes(search.toLowerCase())
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supersets, search]
  );

  const graph = useMemo(() => buildRelationshipGraph(sourceData), [sourceData]);

  const rows: SupersetRow[] = entries.map(([key, value]) => {
    const superset: any = value;
    return {
      key,
      superset,
      sessions: toStringArray(superset.sessions ?? superset.session),
      usageCount: getDirectReferencers(nodeId("superset", key), graph.edges).length,
    };
  });

  const openSuperset = (superset: any, sessions: string[]) => {
    setFormData({ ...superset, sessions });
    setFormType("edit");
  };

  const renderActions = ({ superset, sessions, usageCount }: SupersetRow, variant?: ActionsVariant) => (
    <EntityActions
      variant={variant}
      onEdit={() => openSuperset(superset, sessions)}
      onClone={() => {
        setFormData(cloneSuperset(superset, sessions));
        setFormType("add");
      }}
      onDelete={() => sourceDataContext.deleteSuperset(superset)}
      deleteImpactMessage={
        usageCount > 0
          ? `This superset is used by ${usageCount} session${usageCount === 1 ? "" : "s"}. Deleting it will leave those references broken. This can't be undone.`
          : undefined
      }
    />
  );

  return (
    <BaseListing>
      <ManageListHeader
        title="Supersets"
        count={Object.keys(supersets).length}
        addLabel="Add Superset"
        searchPlaceholder="Search supersets..."
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
              ? "No supersets match your search."
              : "No supersets yet. Add your first superset to get started."
          }
        />
      ) : (
        <>
          {entries.length === 0 && (
            <EmptyState
              message={
                search
                  ? "No supersets match your search."
                  : "No supersets yet. Add your first superset to get started."
              }
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.slice(0, limit).map((row) => {
              const { key, superset, sessions, usageCount } = row;
              return (
              <EntityCard
                key={key}
                title={superset.name ?? key}
                relatedLabel="Exercises"
                relatedItems={toStringArray(superset.exercises)}
                tags={superset.tags}
                usageCount={usageCount}
                usageLabel="session"
                onOpen={() => openSuperset(superset, sessions)}
                actions={renderActions(row)}
              />
              );
            })}
          </div>
        </>
      )}

      <LoadMore shown={limit} total={rows.length} onLoadMore={loadMore} onShowAll={showAll} />

      {formType && (
        <SupersetForm
          key={`${formType}-${formData?.id ?? formData?.name ?? "new"}`}
          data={formData}
          entryType={formType}
          closeForm={() => setFormType("")}
        />
      )}
    </BaseListing>
  );
};
