import React, { useContext, useMemo, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";
import { SupersetForm } from "../forms/SupersetForm";
import { sortObject } from "../common/utils";
import BaseListing from "./BaseListing";
import { ManageListHeader } from "./ManageListHeader";
import { EmptyState } from "./EmptyState";

export const SupersetListing = () => {
  const [formData, setFormData] = useState<any>({});
  const [formType, setFormType] = useState("");
  const [search, setSearch] = useState("");
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
        {entries.map(([key, value]) => (
          <button
            type="button"
            key={key}
            className="flex flex-col min-h-11 text-left border border-primary-200 dark:border-primary-700
              bg-white dark:bg-surface-dark text-text-light dark:text-text-dark
              p-4 rounded-md text-sm shadow-sm hover:shadow-md hover:border-primary transition-shadow
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => {
              let _value: any = value;
              if (!_value.sessions && _value.session) {
                _value.sessions = _value.session.split(",");
              }
              setFormData(_value);
              setFormType("edit");
            }}
          >
            <span className="font-bold">{(value as any).name}</span>
            <>
              {((value as any).exercises ?? []).map((e: any) => (
                <div className="text-xs text-text-muted-light dark:text-text-muted-dark" key={e}>
                  {e}
                </div>
              ))}
            </>
          </button>
        ))}
      </div>

      {formType && (
        <SupersetForm
          data={formData}
          entryType={formType}
          closeForm={() => setFormType("")}
        />
      )}
    </BaseListing>
  );
};
