import { useContext, useMemo, useState } from "react";
import dayjs from "dayjs";
import SourceDataContext from "../context/SourceDataContext";
import SessionContext from "../context/SessionContext";
import { ConfirmDeleteButton } from "../forms/ConfirmDeleteButton";
import { Button } from "@dyordsabuzo/ui-components";
import WrapperPage from "./WrapperPage";
import { SessionStats } from "./others/SessionStats";
import { EmptyState } from "../management/EmptyState";
import { HistoryRun, historyRuns, summariseRun } from "../common/sessionStats";
import { sessionOrder } from "./resolveSessionSupersets";

// Every completed session across your plans, most recent first. Opening a run
// shows what was used for each exercise.
export const HistoryPage = () => {
  const sourceData: any = useContext(SourceDataContext).sourceData;
  const userdata: any = Object.values(sourceData?.userdata ?? {})[0];
  const { deleteRuns } = useContext(SessionContext) as any;
  const [viewing, setViewing] = useState<HistoryRun | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const runs = useMemo(() => historyRuns(userdata), [userdata]);
  const keyOf = (run: HistoryRun) => `${run.plan}|${run.week}|${run.session}`;
  const pickedRuns = runs.filter((run) => picked.has(keyOf(run)));

  const togglePick = (run: HistoryRun) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(keyOf(run))) next.delete(keyOf(run));
      else next.add(keyOf(run));
      return next;
    });

  const removeRuns = (toRemove: HistoryRun[]) => {
    deleteRuns(toRemove.map(({ plan, week, session }) => ({ plan, week, session })));
    setPicked(new Set());
    setViewing(null);
  };

  const deleteMessage = (count: number) =>
    `This permanently removes ${count} completed session${count === 1 ? "" : "s"} and the sets recorded for ${count === 1 ? "it" : "them"}. This can't be undone.`;

  const byPlan = runs.reduce<Record<string, HistoryRun[]>>((groups, run) => {
    (groups[run.plan] ??= []).push(run);
    return groups;
  }, {});

  return (
    <WrapperPage className="max-w-[25rem] sm:max-w-2xl">
      <div className="flex flex-col gap-6 pt-8">
        <div>
          <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">History</h1>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
            Completed sessions and what was used for each exercise.
          </p>
        </div>

        {runs.length === 0 && (
          <EmptyState message="No completed sessions yet. Finish a workout to see it here." />
        )}

        {runs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              label={picked.size === runs.length ? "Clear selection" : "Select all"}
              decoration="cancel"
              className="text-xs"
              onClick={() =>
                setPicked(picked.size === runs.length ? new Set() : new Set(runs.map(keyOf)))
              }
            />
            {pickedRuns.length > 0 && (
              <>
                <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                  {pickedRuns.length} selected
                </span>
                <ConfirmDeleteButton
                  label="Delete selected"
                  onDelete={() => removeRuns(pickedRuns)}
                  impactMessage={deleteMessage(pickedRuns.length)}
                />
              </>
            )}
            <span className="grow" />
            <ConfirmDeleteButton
              label="Delete all"
              onDelete={() => removeRuns(runs)}
              impactMessage={deleteMessage(runs.length)}
            />
          </div>
        )}

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
                  key={keyOf(run)}
                  className="flex items-start gap-3 rounded-lg border border-primary-200 dark:border-primary-700 bg-white dark:bg-surface-dark px-3 py-2.5"
                >
                  <input
                    type="checkbox"
                    checked={picked.has(keyOf(run))}
                    onChange={() => togglePick(run)}
                    aria-label={`Select ${run.session}`}
                    className="mt-1 h-4 w-4 accent-primary shrink-0"
                  />
                  <button
                    type="button"
                    onClick={() => setViewing(run)}
                    className="flex grow min-w-0 items-start justify-between gap-3 text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="font-semibold line-clamp-2 break-words" title={run.session}>
                        {run.session}
                      </span>
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
      </div>

      {viewing && (
        <SessionStats
          title={viewing.session}
          planName={viewing.plan}
          week={viewing.week}
          session={viewing.session}
          logged={viewing.logged}
          userdata={userdata}
          order={sessionOrder(sourceData?.sessions?.[viewing.session], sourceData)}
          onClose={() => setViewing(null)}
        />
      )}
    </WrapperPage>
  );
};
