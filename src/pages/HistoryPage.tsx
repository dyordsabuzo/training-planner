import { useContext, useMemo, useState } from "react";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft } from "@fortawesome/free-solid-svg-icons";
import SourceDataContext from "../context/SourceDataContext";
import SessionContext from "../context/SessionContext";
import { ConfirmDeleteButton } from "../forms/ConfirmDeleteButton";
import { Button } from "@dyordsabuzo/ui-components";
import WrapperPage from "./WrapperPage";
import { SessionStats } from "./others/SessionStats";
import { EmptyState } from "../management/EmptyState";
import { HistoryRun, historyRuns } from "../common/sessionStats";
import { HistoryRunList, runKey, runMinutes } from "./HistoryRunList";
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
  const pickedRuns = runs.filter((run) => picked.has(runKey(run)));
  const totalMinutes = runs.reduce((sum, run) => sum + (runMinutes(run) ?? 0), 0);
  const stats = [
    { label: "Sessions", value: runs.length },
    {
      label: "Last 7 days",
      value: runs.filter((run) => run.completedAt && dayjs(run.completedAt).isAfter(dayjs().subtract(7, "day"))).length,
    },
    { label: "Time", value: totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m` },
  ];

  const togglePick = (run: HistoryRun) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(runKey(run))) next.delete(runKey(run));
      else next.add(runKey(run));
      return next;
    });

  const removeRuns = (toRemove: HistoryRun[]) => {
    deleteRuns(toRemove.map(({ plan, week, session }) => ({ plan, week, session })));
    setPicked(new Set());
    setViewing(null);
  };

  const deleteMessage = (count: number) =>
    `This permanently removes ${count} completed session${count === 1 ? "" : "s"} and the sets recorded for ${count === 1 ? "it" : "them"}. This can't be undone.`;

  return (
    <WrapperPage className="max-w-[25rem] sm:max-w-2xl">
      <div className="flex flex-col gap-6 pt-8">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-text-light dark:text-text-dark">
            <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-800/40 text-primary dark:text-primary-300">
              <FontAwesomeIcon icon={faClockRotateLeft} className="text-base" />
            </span>
            History
          </h1>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
            Completed sessions and what was used for each exercise.
          </p>
        </div>

        {runs.length === 0 && (
          <EmptyState message="No completed sessions yet. Finish a workout to see it here." />
        )}

        {runs.length > 0 && (
          <dl
            className="grid grid-cols-3 gap-2 rounded-2xl p-4 text-white bg-gradient-to-br from-primary to-primary-400
              shadow-lg shadow-primary/30"
          >
            {stats.map(({ label, value }) => (
              <div key={label} className="flex flex-col-reverse items-center gap-0.5 rounded-xl bg-white/10 py-3">
                <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-white/70">{label}</dt>
                <dd className="text-2xl font-bold leading-none">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {runs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              label={picked.size === runs.length ? "Clear selection" : "Select all"}
              decoration="cancel"
              className="text-xs"
              onClick={() =>
                setPicked(picked.size === runs.length ? new Set() : new Set(runs.map(runKey)))
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

        <HistoryRunList
          runs={runs}
          sourceData={sourceData}
          onView={setViewing}
          picked={picked}
          onTogglePick={togglePick}
        />
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
