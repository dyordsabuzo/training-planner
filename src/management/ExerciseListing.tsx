import React, { useContext, useMemo, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";
import { ExerciseForm } from "../forms/ExerciseForm";
import { sortObject, toStringArray } from "../common/utils";
import BaseListing from "./BaseListing";
import { ManageListHeader } from "./ManageListHeader";
import { EmptyState } from "./EmptyState";
import { EntityCard } from "./EntityCard";

import { DataTable, DataTableColumn, Badge } from "@dyordsabuzo/ui-components";
import {
  buildRelationshipGraph,
  getDirectReferencers,
  nodeId,
} from "./buildRelationshipGraph";

type Props = {
  viewMode?: "card" | "table";
};

type ExerciseRow = {
  key: string;
  exercise: any;
  usageCount: number;
};

const columns: DataTableColumn<ExerciseRow>[] = [
  { key: "name", header: "Name", render: (row) => <span className="font-bold">{row.key}</span> },
  {
    key: "supersets",
    header: "Supersets",
    render: (row) => {
      const supersets = toStringArray(row.exercise.supersets);
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
      const tags = toStringArray(row.exercise.tags);
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
        ? `${row.usageCount} superset${row.usageCount === 1 ? "" : "s"}`
        : "—",
  },
];

export const ExerciseListing = ({ viewMode = "card" }: Props) => {
  const [formData, setFormData] = useState<any>({});
  const [formType, setFormType] = useState("");
  const [search, setSearch] = useState("");

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const exercises = sortObject(sourceData.exercises ?? {});
  const entries = useMemo(
    () =>
      Object.entries(exercises).filter(([key]) =>
        key.toLowerCase().includes(search.toLowerCase())
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercises, search]
  );

  const graph = useMemo(() => buildRelationshipGraph(sourceData), [sourceData]);

  const rows: ExerciseRow[] = entries.map(([key, value]) => ({
    key,
    exercise: value,
    usageCount: getDirectReferencers(nodeId("exercise", key), graph.edges).length,
  }));

  const openExercise = (exercise: any) => {
    setFormData({ ...exercise, supersets: toStringArray(exercise.supersets) });
    setFormType("edit");
  };

  return (
    <BaseListing>
      <ManageListHeader
        title="Exercises"
        count={Object.keys(exercises).length}
        addLabel="Add Exercise"
        searchPlaceholder="Search exercises..."
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
          onRowClick={(row) => openExercise(row.exercise)}
          emptyMessage={
            search
              ? "No exercises match your search."
              : "No exercises yet. Add your first exercise to get started."
          }
        />
      ) : (
        <>
          {entries.length === 0 && (
            <EmptyState
              message={
                search
                  ? "No exercises match your search."
                  : "No exercises yet. Add your first exercise to get started."
              }
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.map(({ key, exercise, usageCount }) => (
              <EntityCard
                key={key}
                title={key}
                relatedLabel="Supersets"
                relatedItems={toStringArray(exercise.supersets)}
                tags={exercise.tags}
                usageCount={usageCount}
                usageLabel="superset"
                onClick={() => openExercise(exercise)}
              />
            ))}
          </div>
        </>
      )}

      {formType && (
        <ExerciseForm
          data={formData}
          type={formType}
          closeForm={() => setFormType("")}
        />
      )}
    </BaseListing>
  );
};
