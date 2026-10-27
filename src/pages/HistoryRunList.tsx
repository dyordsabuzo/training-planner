import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarWeek, faChevronRight, faClock, faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@dyordsabuzo/ui-components";
import { HistoryRun, isIncomplete, summariseRun } from "../common/sessionStats";
import { sessionOrder } from "./resolveSessionSupersets";

export const runKey = (run: HistoryRun) => `${run.plan}|${run.week}|${run.session}`;

// Workout length in whole minutes, or null without both timestamps.
export const runMinutes = (run: HistoryRun) => {
  const { completedAt, startedAt } = run.logged?.meta ?? {};
  if (!completedAt || !startedAt) return null;
  const minutes = Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000);
  return minutes >= 0 ? minutes : null;
};

type Props = {
  runs: HistoryRun[];
  sourceData: any;
  onView: (run: HistoryRun) => void;
  // Selection for deleting; left out for a read-only list (a client's history).
  picked?: Set<string>;
  onTogglePick?: (run: HistoryRun) => void;
};

// Completed runs grouped by plan, most recent first (as given).
export const HistoryRunList = ({ runs, sourceData, onView, picked, onTogglePick }: Props) => {
  const byPlan = runs.reduce<Record<string, HistoryRun[]>>((groups, run) => {
    (groups[run.plan] ??= []).push(run);
    return groups;
  }, {});

  return (
    <>
      {Object.entries(byPlan).map(([plan, planRuns]) => (
        <section key={plan} className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">
            {plan}
            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700/60 normal-case tracking-normal">
              {planRuns.length}
            </span>
          </h2>
          {planRuns.map((run) => {
            const order = sessionOrder(sourceData?.sessions?.[run.session], sourceData);
            const { totals } = summariseRun(run.logged, order);
            const { completedAt } = run.logged?.meta ?? {};
            const minutes = runMinutes(run);
            const details = [
              run.week !== "Open" && { icon: faCalendarWeek, label: run.week },
              minutes !== null && { icon: faClock, label: minutes < 1 ? "under 1 min" : `${minutes} min` },
              totals.sets > 0 && { icon: faLayerGroup, label: `${totals.sets} sets` },
            ].filter(Boolean) as { icon: typeof faClock; label: string }[];
            const isPicked = !!picked?.has(runKey(run));

            return (
              <div
                key={runKey(run)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
                  isPicked
                    ? "bg-primary-50 dark:bg-primary-800/30 ring-1 ring-primary-200 dark:ring-primary-700"
                    : "bg-gray-50 dark:bg-gray-800/40"
                }`}
              >
                {picked && onTogglePick && (
                  <input
                    type="checkbox"
                    checked={isPicked}
                    onChange={() => onTogglePick(run)}
                    aria-label={`Select ${run.session}`}
                    className="h-5 w-5 accent-primary shrink-0"
                  />
                )}
                <button
                  type="button"
                  onClick={() => onView(run)}
                  className="flex grow min-w-0 items-center gap-3 min-h-11 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span
                    aria-hidden
                    className="flex flex-col items-center justify-center w-12 h-12 shrink-0 rounded-xl bg-primary-50 dark:bg-primary-800/30 text-primary dark:text-primary-300"
                  >
                    {completedAt ? (
                      <>
                        <span className="text-[0.65rem] font-bold uppercase leading-none">
                          {dayjs(completedAt).format("MMM")}
                        </span>
                        <span className="text-lg font-bold leading-tight">{dayjs(completedAt).format("D")}</span>
                      </>
                    ) : (
                      <span className="text-xs font-bold">—</span>
                    )}
                  </span>
                  <div className="flex grow min-w-0 flex-col gap-1">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold line-clamp-2 break-words" title={run.session}>
                        {run.session}
                      </span>
                      {isIncomplete(run.logged) && <Badge variant="neutral">Incomplete</Badge>}
                    </span>
                    <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted-light dark:text-text-muted-dark">
                      <span>{completedAt ? dayjs(completedAt).format("ddd, HH:mm") : "No date"}</span>
                      {details.map(({ icon, label }) => (
                        <span key={label} className="flex items-center gap-1">
                          <FontAwesomeIcon icon={icon} className="text-[0.65rem]" />
                          {label}
                        </span>
                      ))}
                    </span>
                  </div>
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className="shrink-0 text-xs text-text-muted-light dark:text-text-muted-dark"
                  />
                </button>
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
};
