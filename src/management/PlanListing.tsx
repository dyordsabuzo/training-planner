import dayjs from "dayjs";
import React, { useContext, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";
import { WeekForm } from "../forms/WeekForm";
import { PlanForm } from "../forms/PlanForm";
import { sortObject, toStringArray } from "../common/utils";
import { toDate, getCurrentWeekNumber } from "../common/planWeek";
import { Loading } from "../pages/helpers/Loading";
import { ManageListHeader } from "./ManageListHeader";
import { EmptyState } from "./EmptyState";
import { SessionStatusIcon } from "../components/others/SessionStatusIcon";
import { LoadMore } from "./LoadMore";
import { useLoadMore } from "../common/useLoadMore";
import { EntityActions, ActionsVariant } from "./EntityActions";
import { clonePlan } from "./cloneEntity";
import BaseListing from "./BaseListing";
import { Badge, DataTable, DataTableColumn } from "@dyordsabuzo/ui-components";
import {
  formatSessionDate,
  sortPlansByCreated,
  openPlanDoneSessions,
  sessionDueStatus,
  sortSessionsByDate,
} from "../common/planSessions";

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
  { key: "weeks", header: "Weeks", render: (row) => (row.plan.open ? "—" : row.weekCount) },
  { key: "sessions", header: "Sessions", render: (row) => row.sessionCount },
  {
    key: "startDate",
    header: "Start date",
    render: (row) => (row.startDate ? row.startDate.format("MMM D, YYYY") : "—"),
  },
];

const PAGE_SIZE = 6;

export const PlanListing = ({ viewMode = "card" }: Props) => {
  const [formData, setFormData] = useState<any>({});
  const [formType, setFormType] = useState("");
  const [search, setSearch] = useState("");
  const { limit, loadMore, showAll } = useLoadMore(PAGE_SIZE, search);

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const [selectedWeekData, setSelectedWeekData] =
    useState<SelectedWeekData | null>(null);

  if (!sourceData.plans) {
    return <Loading />;
  }

  const plans = sourceData.plans ?? {};

  const renderActions = (plan: any, variant?: ActionsVariant) => (
    <EntityActions
      variant={variant}
      onEdit={() => {
        setFormData(plan);
        setFormType("edit");
      }}
      onClone={() => {
        setFormData(clonePlan(plan));
        setFormType("add");
      }}
      onDelete={() => sourceDataContext.deletePlan(plan)}
    />
  );
  const entries = sortPlansByCreated(plans).filter(([planName]) =>
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
          columns={[
            ...columns,
            { key: "actions", header: "Actions", render: (row) => renderActions(row.plan, "menu") },
          ]}
          rows={entries.slice(0, limit).map(([planName, value]) => {
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
        {entries.slice(0, limit).map(([planName, value]) => {
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
              onClick={openPlan}
              className="flex flex-col gap-4 border border-primary-200 dark:border-primary-700
                bg-white dark:bg-surface-dark text-text-light dark:text-text-dark
                p-4 rounded-md text-sm shadow-sm hover:shadow-md hover:border-primary transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1 min-w-0">
                <button
                  type="button"
                  onClick={openPlan}
                  className="font-bold text-base text-left break-words rounded
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {planName}
                </button>
                {plan.status && (
                  <Badge
                    variant={
                      plan.status === "Completed"
                        ? "success"
                        : plan.status === "Active"
                          ? "primary"
                          : plan.status === "Archived"
                            ? "warning"
                            : "neutral"
                    }
                    className="w-fit"
                  >
                    {plan.status}
                  </Badge>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted-light dark:text-text-muted-dark">
                  {plan.createdAt && (
                    <span>Created {dayjs(plan.createdAt).format("ddd, MMM D YYYY")}</span>
                  )}
                  {!plan.open && (
                    <span>
                      {weekEntries.length}{" "}
                      {weekEntries.length === 1 ? "week" : "weeks"}
                    </span>
                  )}
                  <span>
                    {sessionCount} {sessionCount === 1 ? "session" : "sessions"}
                  </span>
                  {startDate && (
                    <span>Starts {startDate.format("MMM D, YYYY")}</span>
                  )}
                </div>
              </div>
              {renderActions(plan)}
              </div>

              {plan.open ? (
                <div className="flex flex-col gap-1">
                  {sortSessionsByDate(toStringArray(plan.sessions), sourceData.sessions).map(
                    (sessionName) => {
                      const date: string | undefined = sourceData.sessions?.[sessionName]?.date;
                      const done = openPlanDoneSessions(
                        Object.values(sourceData.userdata ?? {})[0],
                        planName
                      ).includes(sessionName);
                      const status = sessionDueStatus(date, done);
                      return (
                        <div key={sessionName} className="flex items-center justify-between gap-2 text-sm">
                          <span className="flex items-center gap-2 min-w-0">
                            <SessionStatusIcon date={date} done={done} />
                            <span className="font-medium break-words min-w-0">{sessionName}</span>
                          </span>
                          <span className="flex items-center gap-2 shrink-0 text-xs text-text-muted-light dark:text-text-muted-dark">
                            {date && formatSessionDate(date)}
                            {status === "done" && <Badge variant="success">Done</Badge>}
                            {status === "overdue" && <Badge variant="danger">Overdue</Badge>}
                          </span>
                        </div>
                      );
                    }
                  )}
                  {(plan.sessions ?? []).length === 0 && (
                    <span className="text-xs italic text-text-muted-light dark:text-text-muted-dark">
                      No sessions added yet.
                    </span>
                  )}
                </div>
              ) : weekEntries.length === 0 ? (
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

      <LoadMore shown={limit} total={entries.length} onLoadMore={loadMore} onShowAll={showAll} />

      {formType && (
        <PlanForm
          key={`${formType}-${formData?.id ?? formData?.name ?? "new"}`}
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
