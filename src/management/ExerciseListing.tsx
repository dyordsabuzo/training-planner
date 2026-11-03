import React, { ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import SourceDataContext from "../context/SourceDataContext";
import { ExerciseForm } from "../forms/ExerciseForm";
import { ConfirmDeleteButton } from "../forms/ConfirmDeleteButton";
import { sortObject, toStringArray, SourceDbReferences } from "../common/utils";
import { useLoadMore } from "../common/useLoadMore";
import BaseListing from "./BaseListing";
import { ManageListHeader } from "./ManageListHeader";
import { EmptyState } from "./EmptyState";
import { EntityCard, summaryLine, usageText } from "./EntityCard";
import { LoadMore } from "./LoadMore";
import { isListed } from "../common/sharing";
import { EntityActions, ActionsVariant, plural, sharingNotes } from "./EntityActions";
import { SECTION_ICONS } from "./ManageHero";
import { ScrollRow } from "./ScrollRow";
import { chipClassName } from "../pages/others/HeroTile";
import { cloneExercise } from "./cloneEntity";
import {
  buildRelationshipGraph,
  getDirectReferencers,
  nodeId,
} from "./buildRelationshipGraph";

import {
  Badge,
  Button,
  DataTable,
  DataTableColumn,
  Input,
  SingleSelect,
} from "@dyordsabuzo/ui-components";

type Props = {
  viewMode?: "card" | "table";
  headerTrailing?: ReactNode;
};

type ExerciseRow = {
  key: string;
  exercise: any;
  usageCount: number;
};

const PAGE_SIZE = 12;
const SORT_NAME = "Name A–Z";
const SORT_USAGE = "Most used";
const ALL_SUPERSETS = "All supersets";

const tagsOf = (exercise: any) => toStringArray(exercise.tags);
const supersetsOf = (exercise: any) => toStringArray(exercise.supersets);
const alternativesOf = (exercise: any) => toStringArray(exercise.alternatives);

const stop = (e: React.MouseEvent) => e.stopPropagation();

export const ExerciseListing = ({ viewMode = "card", headerTrailing }: Props) => {
  const [formData, setFormData] = useState<any>({});
  const [formType, setFormType] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(SORT_NAME);
  const [tagFilter, setTagFilter] = useState("");
  const [supersetFilter, setSupersetFilter] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  // In the URL so the hero's unused hint can link straight to this filter.
  const unusedOnly = searchParams.get("unused") === "1";
  const setUnusedOnly = (on: boolean) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (on) next.set("unused", "1");
      else next.delete("unused");
      return next;
    });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTag, setBulkTag] = useState("");

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;
  const exercises = sourceData.exercises ?? {};

  const graph = useMemo(() => buildRelationshipGraph(sourceData), [sourceData]);

  const allRows: ExerciseRow[] = useMemo(
    () =>
      Object.entries(sortObject(exercises))
        .filter(([, value]) => isListed(value))
        .map(([key, value]) => ({
        key,
        exercise: value,
        usageCount: getDirectReferencers(nodeId("exercise", key), graph.edges).length,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercises, graph]
  );

  const allTags = useMemo(
    () => Array.from(new Set(allRows.flatMap((r) => tagsOf(r.exercise)))).sort(),
    [allRows]
  );
  const allSupersets = useMemo(
    () => Array.from(new Set(allRows.flatMap((r) => supersetsOf(r.exercise)))).sort(),
    [allRows]
  );

  const query = search.trim().toLowerCase();
  const isFiltered = !!query || !!tagFilter || !!supersetFilter || unusedOnly;

  const filtered = allRows.filter(({ key, exercise, usageCount }) => {
    const searchable = [key, ...tagsOf(exercise), ...supersetsOf(exercise), ...alternativesOf(exercise)];
    return (
      (!query || searchable.some((v) => v.toLowerCase().includes(query))) &&
      (!tagFilter || tagsOf(exercise).includes(tagFilter)) &&
      (!supersetFilter || supersetsOf(exercise).includes(supersetFilter)) &&
      (!unusedOnly || usageCount === 0)
    );
  });

  const rows =
    sortBy === SORT_USAGE
      ? [...filtered].sort((a, b) => b.usageCount - a.usageCount || a.key.localeCompare(b.key))
      : filtered;

  // Going back to page one and clearing selection whenever the view changes,
  // so bulk actions never touch items the user can't currently see.
  const resetKey = [query, tagFilter, supersetFilter, unusedOnly, sortBy].join("|");
  const { limit, loadMore, showAll } = useLoadMore(PAGE_SIZE, resetKey);
  useEffect(() => setSelected(new Set()), [resetKey]);

  const visible = rows.slice(0, limit);
  const selectedRows = allRows.filter((r) => selected.has(r.key));

  const toggleSelect = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Linked items are read-only (their ⋮ menu has Details).
  const openExercise = (exercise: any) => {
    if (exercise.linked) return;
    setFormData({ ...exercise, supersets: supersetsOf(exercise) });
    setFormType("edit");
  };

  const renderActions = ({ exercise, usageCount }: ExerciseRow, variant?: ActionsVariant) => (
    <EntityActions
      variant={variant}
      sharing={{ db: SourceDbReferences.EXERCISES, entity: exercise }}
      onEdit={() => openExercise(exercise)}
      onClone={() => {
        setFormData(cloneExercise(exercise));
        setFormType("add");
      }}
      onDelete={() => sourceDataContext.deleteExercise(exercise)}
      deleteImpactMessage={
        usageCount > 0
          ? `This exercise is used by ${usageCount} superset${usageCount === 1 ? "" : "s"}. Deleting it will leave those references broken. This can't be undone.`
          : undefined
      }
    />
  );

  const bulkImpact = selectedRows.reduce((sum, r) => sum + r.usageCount, 0);

  const addTagToSelected = () => {
    const tag = bulkTag.trim();
    if (!tag) return;
    selectedRows.forEach(({ exercise }) => {
      const tags = tagsOf(exercise);
      if (!tags.includes(tag)) {
        // Full record so linkExerciseWithSupersets keeps its links intact.
        sourceDataContext.updateExercise({ ...exercise, tags: [...tags, tag] });
      }
    });
    setBulkTag("");
  };

  const deleteSelected = () => {
    selectedRows.forEach(({ exercise }) => sourceDataContext.deleteExercise(exercise));
    setSelected(new Set());
  };

  const columns: DataTableColumn<ExerciseRow>[] = [
    {
      key: "select",
      header: "",
      render: (row) => (
        <span onClick={stop} className="flex">
          <input
            type="checkbox"
            checked={selected.has(row.key)}
            onChange={() => toggleSelect(row.key)}
            aria-label={`Select ${row.key}`}
            className="h-4 w-4 accent-primary"
          />
        </span>
      ),
    },
    { key: "name", header: "Name", render: (row) => <span className="font-bold">{row.key}</span> },
    {
      key: "supersets",
      header: "Supersets",
      render: (row) => {
        const supersets = supersetsOf(row.exercise);
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
        const tags = tagsOf(row.exercise);
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
        row.usageCount > 0 ? (
          usageText(row.usageCount, "superset")
        ) : (
          <Badge variant="warning">Unused</Badge>
        ),
    },
    { key: "actions", header: "Actions", render: (row) => renderActions(row, "menu") },
  ];

  const emptyMessage = isFiltered
    ? "No exercises match your search or filters."
    : "No exercises yet. Add your first exercise to get started.";

  const clearFilters = () => {
    setSearch("");
    setTagFilter("");
    setSupersetFilter("");
    setUnusedOnly(false);
  };

  return (
    <BaseListing>
      <ManageListHeader
        title="Exercises"
        count={allRows.length}
        addLabel="Add Exercise"
        searchPlaceholder="Search name, tag, superset..."
        search={search}
        onSearchChange={setSearch}
        trailing={headerTrailing}
        onAdd={() => {
          setFormData({});
          setFormType("add");
        }}
      />

      <ScrollRow ariaLabel="Filter exercises">
        <button
          type="button"
          aria-pressed={unusedOnly}
          onClick={() => setUnusedOnly(!unusedOnly)}
          className={`${chipClassName(unusedOnly)} shrink-0 whitespace-nowrap`}
        >
          Unused
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            aria-pressed={tagFilter === tag}
            onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}
            className={`${chipClassName(tagFilter === tag)} shrink-0 whitespace-nowrap`}
          >
            {tag}
          </button>
        ))}
      </ScrollRow>

      <div className="flex items-center gap-2">
        <SingleSelect
          options={[SORT_NAME, SORT_USAGE]}
          selected={sortBy}
          onChange={setSortBy}
          className="min-w-0 flex-1 sm:flex-none sm:w-40"
        />
        <SingleSelect
          options={[ALL_SUPERSETS, ...allSupersets]}
          selected={supersetFilter || ALL_SUPERSETS}
          onChange={(v) => setSupersetFilter(v === ALL_SUPERSETS ? "" : v)}
          className="min-w-0 flex-1 sm:flex-none sm:w-44"
        />
      </div>

      {selectedRows.length > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 p-3 rounded-2xl border border-primary-200 dark:border-primary-700 bg-white dark:bg-surface-dark shadow-sm">
          <span className="text-sm font-bold">{selectedRows.length} selected</span>
          <div className="w-44">
            <Input value={bulkTag} placeholder="Tag to add" changeValue={setBulkTag} />
          </div>
          <Button
            label="Add tag"
            className="text-xs"
            disabled={!bulkTag.trim()}
            onClick={addTagToSelected}
          />
          <ConfirmDeleteButton
            label="Delete selected"
            onDelete={deleteSelected}
            impactMessage={
              bulkImpact > 0
                ? `The selected exercises are used by ${bulkImpact} superset reference${bulkImpact === 1 ? "" : "s"}. Deleting them will leave those references broken. This can't be undone.`
                : undefined
            }
          />
          <Button label="Clear selection" decoration="cancel" className="text-xs" onClick={() => setSelected(new Set())} />
        </div>
      )}

      {isFiltered && (
        <div className="flex items-center justify-between gap-2 text-xs text-text-muted-light dark:text-text-muted-dark">
          <span>
            {rows.length} of {allRows.length} exercises
          </span>
          <Button label="Clear filters" decoration="cancel" className="text-xs" onClick={clearFilters} />
        </div>
      )}

      {viewMode === "table" ? (
        <DataTable
          columns={columns}
          rows={visible}
          getRowKey={(row) => row.key}
          onRowClick={(row) => openExercise(row.exercise)}
          emptyMessage={emptyMessage}
        />
      ) : (
        <>
          {rows.length === 0 && <EmptyState message={emptyMessage} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {visible.map((row) => (
              <EntityCard
                key={row.key}
                title={row.key}
                icon={SECTION_ICONS.Exercises}
                summary={summaryLine([
                  ...sharingNotes(row.exercise),
                  row.usageCount > 0 && `In ${plural(row.usageCount, "superset")}`,
                  ...tagsOf(row.exercise),
                ])}
                tags={tagsOf(row.exercise)}
                unused={row.usageCount === 0}
                onOpen={() => openExercise(row.exercise)}
                selected={selected.has(row.key)}
                onToggleSelect={() => toggleSelect(row.key)}
                actions={renderActions(row, "row")}
              />
            ))}
          </div>
        </>
      )}

      <LoadMore shown={limit} total={rows.length} onLoadMore={loadMore} onShowAll={showAll} />

      {formType && (
        <ExerciseForm
          key={`${formType}-${formData?.id ?? formData?.name ?? "new"}`}
          data={formData}
          type={formType}
          closeForm={() => setFormType("")}
        />
      )}
    </BaseListing>
  );
};
