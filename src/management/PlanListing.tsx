import React, { useContext, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";
import { WeekForm } from "../forms/WeekForm";
import { PlanForm } from "../forms/PlanForm";
import { sortObject } from "../common/utils";
import { toDate, getCurrentWeekNumber } from "../common/planWeek";
import { Loading } from "../pages/helpers/Loading";
import { ManageListHeader } from "./ManageListHeader";
import { EmptyState } from "./EmptyState";
import BaseListing from "./BaseListing";
import { DataTable, DataTableColumn } from "@dyordsabuzo/ui-components";

type SelectedWeekData = {
  weekKey: string;
  weekNumber: number;
  planName: string;
  targetRep: number;
  targetSet: number;
  targetTime: number;
  annotation: string;
};

type Props = {
  viewMode?: "card" | "table";
};

type PlanRow = {
  planName: string;
  plan: any;
  weekCount: number;
  sessionCount: number;
  startDate: ReturnType<typeof toDate>;
};

const columns: DataTableColumn<PlanRow>[] = [
  { key: "name", header: "Plan name", render: (row) => <span className="font-bold">{row.planName}</span> },
  { key: "weeks", header: "Weeks", render: (row) => row.weekCount },
  { key: "sessions", header: "Sessions", render: (row) => row.sessionCount },
  {
    key: "startDate",
    header: "Start date",
    render: (row) => (row.startDate ? row.startDate.format("MMM D, YYYY") : "—"),
  },
];

export const PlanListing = ({ viewMode = "card" }: Props) => {
  const [formData, setFormData] = useState<any>({});
  const [formType, setFormType] = useState("");
  const [search, setSearch] = useState("");

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const [selectedWeekData, setSelectedWeekData] =
    useState<SelectedWeekData | null>(null);

  if (!sourceData.plans) {
    return <Loading />;
  }

  const plans = sourceData.plans ?? {};
  const entries = Object.entries(plans).filter(([planName]) =>
    planName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <BaseListing>
      <ManageListHeader
        title="Plans"
        count={Object.keys(plans).length}
        addLabel="Create plan"
        searchPlaceholder="Search plans..."
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
          rows={entries.map(([planName, value]) => {
            const plan: any = value;
            return {
              planName,
              plan,
              weekCount: Object.keys(plan.weeks ?? {}).length,
              sessionCount: (plan.sessions ?? []).length,
              startDate: toDate(plan.startDate),
            };
          })}
          getRowKey={(row) => row.planName}
          onRowClick={(row) => {
            setFormData(row.plan);
            setFormType("edit");
          }}
          emptyMessage={
            search
              ? "No plans match your search."
              : "No plans yet. Create your first training plan to get started."
          }
        />
      ) : (
        <>
      {entries.length === 0 && (
        <EmptyState
          message={
            search
              ? "No plans match your search."
              : "No plans yet. Create your first training plan to get started."
          }
        />
      )}

      <div className="flex flex-col gap-3">
        {entries.map(([planName, value]) => {
          const plan: any = value;
          const weekEntries = Object.entries(sortObject(plan.weeks ?? {}));
          const startDate = toDate(plan.startDate);
          const currentWeekNumber = getCurrentWeekNumber(plan);
          const sessionCount = (plan.sessions ?? []).length;

          const openPlan = () => {
            setFormData(plan);
            setFormType("edit");
          };

          return (
            <div
              key={planName}
              role="button"
              tabIndex={0}
              onClick={openPlan}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openPlan();
                }
              }}
              className="flex flex-col gap-4 border border-primary-200 dark:border-primary-700
                bg-white dark:bg-surface-dark text-text-light dark:text-text-dark
                p-4 rounded-md text-sm shadow-sm hover:shadow-md hover:border-primary transition-shadow
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-bold text-base break-words">{planName}</span>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted-light dark:text-text-muted-dark">
                  <span>
                    {weekEntries.length}{" "}
                    {weekEntries.length === 1 ? "week" : "weeks"}
                  </span>
                  <span>
                    {sessionCount} {sessionCount === 1 ? "session" : "sessions"}
                  </span>
                  {startDate && (
                    <span>Starts {startDate.format("MMM D, YYYY")}</span>
                  )}
                </div>
              </div>

              {weekEntries.length === 0 ? (
                <span className="text-xs italic text-text-muted-light dark:text-text-muted-dark">
                  No weeks configured yet.
                </span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {weekEntries.map(([weekKey, weekData]) => {
                    const week: any = weekData;
                    const isCurrent = currentWeekNumber === week.weekNumber;
                    const hasNote = !!week.annotation;

                    return (
                      <button
                        key={weekKey}
                        type="button"
                        title={hasNote ? week.annotation : undefined}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWeekData({
                            ...week,
                            weekKey,
                            planName,
                          });
                        }}
                        className={`relative min-h-11 px-3 rounded-lg text-sm font-medium border transition-colors
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                          ${
                            isCurrent
                              ? "border-primary bg-primary-50 text-primary dark:bg-primary-800/30 dark:text-primary-200"
                              : "border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary-50 dark:hover:bg-primary-800/20"
                          }`}
                      >
                        {weekKey}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide">
                            Now
                          </span>
                        )}
                        {hasNote && (
                          <span
                            aria-hidden="true"
                            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent-500"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
        </>
      )}

      {formType && (
        <PlanForm
          data={formData}
          type={formType}
          closeForm={() => setFormType("")}
        />
      )}

      {selectedWeekData && (
        <WeekForm
          weekData={selectedWeekData}
          clear={() => setSelectedWeekData(null)}
        />
      )}
    </BaseListing>
  );
};
