import React, { useContext, useMemo, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";
import { ExerciseForm } from "../forms/ExerciseForm";
import { sortObject } from "../common/utils";
import BaseListing from "./BaseListing";
import { ManageListHeader } from "./ManageListHeader";
import { EmptyState } from "./EmptyState";

export const ExerciseListing = () => {
  const [formData, setFormData] = useState<any>({});
  const [formType, setFormType] = useState("");
  const [search, setSearch] = useState("");

  const sourceDataContext = useContext(SourceDataContext);

  const exercises = sortObject(
    (sourceDataContext.sourceData as any).exercises ?? {}
  );
  const entries = useMemo(
    () =>
      Object.entries(exercises).filter(([key]) =>
        key.toLowerCase().includes(search.toLowerCase())
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercises, search]
  );

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
        {entries.map(([key, value]) => (
          <button
            type="button"
            key={key}
            className="grow min-h-11 text-left border border-primary-200 dark:border-primary-700
              bg-white dark:bg-surface-dark text-text-light dark:text-text-dark
              p-4 rounded-md text-sm shadow-sm hover:shadow-md hover:border-primary transition-shadow
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => {
              let _value: any = value;
              if (typeof _value.supersets === "string") {
                _value.supersets = _value.supersets.split(",");
              }
              setFormData(_value);
              setFormType("edit");
            }}
          >
            {key}
          </button>
        ))}
      </div>

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
