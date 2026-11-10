import dayjs from "dayjs";
import React, { ReactNode, useContext, useState } from "react";
import { faCalendarDays, faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SourceDataContext from "../context/SourceDataContext";
import { WeekForm } from "../forms/WeekForm";
import { PlanForm } from "../forms/PlanForm";
import { SessionForm } from "../forms/SessionForm";
import { sortObject, toStringArray, SourceDbReferences } from "../common/utils";
import { toDate, getCurrentWeekNumber } from "../common/planWeek";
import { Loading } from "../pages/helpers/Loading";
import { ManageListHeader } from "./ManageListHeader";
import { EmptyState } from "./EmptyState";
import { LoadMore } from "./LoadMore";
import { useLoadMore } from "../common/useLoadMore";
import { EntityActions, ActionsVariant, plural } from "./EntityActions";
import { summaryLine } from "./EntityCard";
import { SECTION_ICONS } from "./ManageHero";
import { countListed } from "./setupSummary";
import { isListed } from "../common/sharing";
import { AgendaRow, DateTile, FOCUS, StatusChip, Tone } from "../pages/others/AgendaRow";
import { chipClassName } from "../pages/others/HeroTile";
import { sessionUnitNames } from "../pages/resolveSessionSupersets";
import { clonePlan } from "./cloneEntity";
import { usePublicPlanActions } from "./PublicPlanActions";
import BaseListing from "./BaseListing";
import { DataTable, DataTableColumn } from "@dyordsabuzo/ui-components";
import {
  sortPlansByCreated,
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
  headerTrailing?: ReactNode;
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

const STATUS_TONE: Record<string, Tone> = {
  Completed: "success",
  Active: "primary",
  Archived: "warning",
};

// Session rows shown per plan before "Show all".
const SESSIONS_SHOWN = 3;

// Newest first; undated sessions (by name) after the dated ones.
const sessionsNewestFirst = (names: string[], sessions: any) => {
  const sorted = sortSessionsByDate(names, sessions);
  const dated = sorted.filter((name) => sessions?.[name]?.date).reverse();
  return [...dated, ...sorted.filter((name) => !sessions?.[name]?.date)];
};

const PILL_GROUP_LABEL = "text-xs font-bold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark";

export const PlanListing = ({ viewMode = "card", headerTrailing }: Props) => {
  const [formData, setFormData] = useState<any>({});
  const [formType, setFormType] = useState("");
  const [search, setSearch] = useState("");
  const { limit, loadMore, showAll } = useLoadMore(PAGE_SIZE, search);

  const sourceDataContext = useContext(SourceDataContext);
  const { actionsFor: publicActionsFor, dialog: publicPlanDialog } = usePublicPlanActions();
  const sourceData: any = sourceDataContext.sourceData;

  const [selectedWeekData, setSelectedWeekData] =
    useState<SelectedWeekData | null>(null);
  // Session opened from a plan's session pill, edited in place.
  const [sessionFormData, setSessionFormData] = useState<any>(null);
  // Plans whose full session list is showing.
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const toggleExpandedPlan = (planName: string) =>
    setExpandedPlans((prev) => {
      const next = new Set(prev);
      if (next.has(planName)) {
        next.delete(planName);
      } else {
        next.add(planName);
      }
      return next;
    });

  if (!sourceData.plans) {
    return <Loading />;
  }

  const plans = sourceData.plans ?? {};

  const renderActions = (plan: any, variant?: ActionsVariant) => (
    <EntityActions
      variant={variant}
      sharing={{ db: SourceDbReferences.PLANS, entity: plan }}
      extraActions={publicActionsFor(plan)}
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
  const openSession = (session: any) =>
    setSessionFormData({ ...session, supersets: toStringArray(session.supersets) });

  const entries = sortPlansByCreated(plans).filter(
    ([planName, plan]) => isListed(plan) && planName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <BaseListing>
      <ManageListHeader
        title="Plans"
        count={countListed(plans)}
        addLabel="Create plan"
        searchPlaceholder="Search plans..."
        search={search}
        onSearchChange={setSearch}
        trailing={headerTrailing}
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
          const sessionNames = sessionsNewestFirst(toStringArray(plan.sessions), sourceData.sessions);
          const showAllSessions = expandedPlans.has(planName);

          const openPlan = () => {
            setFormData(plan);
            setFormType("edit");
          };

          return (
            <div
              key={planName}
              onClick={openPlan}
              className="flex flex-col gap-4 border border-gray-200 dark:border-gray-700 cursor-pointer
                bg-white dark:bg-transparent text-text-light dark:text-text-dark
                p-4 rounded-2xl text-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 bg-primary-50 text-primary dark:bg-primary-800/30 dark:text-primary-300">
                  <FontAwesomeIcon icon={plan.open ? faCalendarDays : faLayerGroup} />
                </span>
                <div className="flex flex-col items-start gap-1 min-w-0 grow sm:flex-row sm:justify-between sm:gap-3">
                  <div className="flex flex-col min-w-0">
                    <button
                      type="button"
                      onClick={openPlan}
                      className={`font-bold text-base text-left break-words rounded ${FOCUS}`}
                    >
                      {planName}
                    </button>
                    <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                      {summaryLine([
                        plan.open ? "Open plan" : plural(weekEntries.length, "week"),
                        plural(sessionCount, "session"),
                        startDate && `Starts ${startDate.format("MMM D, YYYY")}`,
                      ])}
                    </span>
                  </div>
                  {plan.status && <StatusChip tone={STATUS_TONE[plan.status] ?? "neutral"}>{plan.status}</StatusChip>}
                </div>
                {renderActions(plan)}
              </div>

              {!plan.open &&
                (weekEntries.length === 0 ? (
                  <span className="text-xs italic text-text-muted-light dark:text-text-muted-dark">
                    No weeks configured yet.
                  </span>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <span className={PILL_GROUP_LABEL}>Weeks</span>
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
                            className={`relative ${chipClassName(isCurrent)}`}
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
                  </div>
                ))}

              {sessionCount === 0 ? (
                <span className="text-xs italic text-text-muted-light dark:text-text-muted-dark">
                  No sessions added yet.
                </span>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {!plan.open && <span className={PILL_GROUP_LABEL}>Sessions</span>}
                  {/* Rows open the session, not the plan card around them. */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                    {(showAllSessions ? sessionNames : sessionNames.slice(0, SESSIONS_SHOWN)).map(
                      (sessionName) => {
                        // Setup view only: done/skipped/overdue are per-client
                        // progress and belong on the client's own pages.
                        const session = sourceData.sessions?.[sessionName];
                        const date: string | undefined = session?.date;
                        return (
                          <AgendaRow
                            key={sessionName}
                            icon={SECTION_ICONS.Sessions}
                            tone="primary"
                            tile={<DateTile date={date} icon={SECTION_ICONS.Sessions} />}
                            title={<span title={sessionName}>{sessionName}</span>}
                            subtitle={
                              session &&
                              summaryLine([
                                date && dayjs(date).format("dddd"),
                                plural(sessionUnitNames(session).length, "group"),
                              ])
                            }
                            onClick={session ? () => openSession(session) : undefined}
                            dimmed={!session}
                            trailing={session?.optional === true && <StatusChip tone="warning">Optional</StatusChip>}
                          />
                        );
                      }
                    )}
                  </div>
                  {sessionNames.length > SESSIONS_SHOWN && (
                    <button
                      type="button"
                      aria-expanded={showAllSessions}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpandedPlan(planName);
                      }}
                      className="self-start min-h-11 px-1 text-sm font-semibold text-primary dark:text-primary-300 rounded
                        hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {showAllSessions ? "Show less" : `Show all ${sessionNames.length}`}
                    </button>
                  )}
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

      {sessionFormData && (
        <SessionForm
          key={sessionFormData.id ?? sessionFormData.name}
          data={sessionFormData}
          type="edit"
          closeForm={() => setSessionFormData(null)}
        />
      )}

      {selectedWeekData && (
        <WeekForm
          weekData={selectedWeekData}
          clear={() => setSelectedWeekData(null)}
        />
      )}
      {publicPlanDialog}
    </BaseListing>
  );
};
