import { useContext, useMemo, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";
import SessionContext from "../context/SessionContext";
import { ConfirmDeleteButton } from "../forms/ConfirmDeleteButton";
import { Button } from "@dyordsabuzo/ui-components";
import WrapperPage from "./WrapperPage";
import { SessionStats } from "./others/SessionStats";
import { EmptyState } from "../management/EmptyState";
import { HistoryRun, historyRuns } from "../common/sessionStats";
import { HistoryRunList, runKey } from "./HistoryRunList";
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
