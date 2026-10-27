import dayjs from "dayjs";
import { Badge } from "@dyordsabuzo/ui-components";
import { HistoryRun, isIncomplete, summariseRun } from "../common/sessionStats";
import { sessionOrder } from "./resolveSessionSupersets";

export const runKey = (run: HistoryRun) => `${run.plan}|${run.week}|${run.session}`;

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
          <h2 className="text-xs font-medium uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
            {plan}
          </h2>
          {planRuns.map((run) => {
            const order = sessionOrder(sourceData?.sessions?.[run.session], sourceData);
            const { totals } = summariseRun(run.logged, order);
            const { completedAt, startedAt } = run.logged?.meta ?? {};
            const minutes =
              completedAt && startedAt
                ? Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000)
                : null;
            const details = [
              run.week !== "Open" ? run.week : null,
              minutes !== null && minutes >= 0 ? `≈ ${minutes < 1 ? "under 1 min" : `${minutes} min`}` : null,
              totals.sets > 0 ? `${totals.sets} sets` : null,
            ].filter(Boolean);

            return (
              <div
                key={runKey(run)}
                className="flex items-start gap-3 rounded-lg border border-primary-200 dark:border-primary-700 bg-white dark:bg-surface-dark px-3 py-2.5"
              >
                {picked && onTogglePick && (
                  <input
                    type="checkbox"
                    checked={picked.has(runKey(run))}
                    onChange={() => onTogglePick(run)}
                    aria-label={`Select ${run.session}`}
                    className="mt-1 h-4 w-4 accent-primary shrink-0"
                  />
                )}
                <button
                  type="button"
                  onClick={() => onView(run)}
                  className="flex grow min-w-0 items-start justify-between gap-3 text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="font-semibold line-clamp-2 break-words" title={run.session}>
                      {run.session}
                    </span>
                    {isIncomplete(run.logged) && (
                      <Badge variant="neutral" className="self-start">Incomplete</Badge>
                    )}
                    {details.length > 0 && (
                      <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                        {details.join(" · ")}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 pt-0.5 text-xs text-text-muted-light dark:text-text-muted-dark">
                    {completedAt ? dayjs(completedAt).format("MMM D, HH:mm") : "No date"}
                  </span>
                </button>
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
};
