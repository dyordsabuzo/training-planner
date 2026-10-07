import { useState } from "react";
import dayjs from "dayjs";
import { faCircleCheck, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal } from "@dyordsabuzo/ui-components";
import {
  exerciseOccurrences,
  formatSet,
  progressVsPrevious,
  SetStat,
  summariseRun,
} from "../../common/sessionStats";
import { displayUnitName, SessionOrder } from "../resolveSessionSupersets";

type Props = {
  title: string;
  planName: string;
  week: string;
  session: string;
  logged: any;
  userdata: any;
  order?: SessionOrder;
  onClose: () => void;
};

type Info = { title: string; lines: string[] };

// One row per exercise. Each set shows a check (logged) or cross (planned but
// not logged); a "+" beside a check means that set went up on the same set
// number of the previous run. Tapping an icon opens that set's details, and
// tapping the exercise name lists its other sessions.
export const SessionStats = ({ title, planName, week, session, logged, userdata, order, onClose }: Props) => {
  const { units } = summariseRun(logged, order);
  const [info, setInfo] = useState<Info | null>(null);

  // Runs saved before dates were recorded have no meta, so nothing is shown.
  const { completedAt, startedAt } = logged?.meta ?? {};
  const minutes =
    completedAt && startedAt
      ? Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000)
      : null;

  const setInfoFor = (exercise: string, setNumber: number, set: SetStat | undefined, before: SetStat | undefined) => {
    if (!set) {
      setInfo({ title: `${exercise} · set ${setNumber}`, lines: ["Not done: this planned set wasn't logged."] });
      return;
    }
    const changes = progressVsPrevious([set], before ? [before] : undefined);
    setInfo({
      title: `${exercise} · set ${setNumber}`,
      lines: [
        `Logged: ${formatSet(set)}`,
        before ? `Previous run: ${formatSet(before)}` : "No previous run of this set to compare with.",
        ...changes,
      ],
    });
  };

  return (
    <Modal title={title} isOpen={true} onClose={onClose}>
      <div className="flex max-h-[70dvh] flex-col gap-5 overflow-y-auto pr-1">
        {(completedAt || (week && week !== "Open")) && (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 break-words text-sm text-text-muted-light dark:text-text-muted-dark">
            {week && week !== "Open" && <span>{week}</span>}
            {completedAt && <span>{dayjs(completedAt).format("ddd, MMM D YYYY · HH:mm")}</span>}
            {completedAt && minutes !== null && minutes >= 0 && (
              <span title="Approximate: from starting the session to finishing it">
                ≈ {minutes < 1 ? "under 1 min" : `${minutes} min`}
              </span>
            )}
          </div>
        )}

        {units.length === 0 && (
          <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
            Nothing was recorded for this session.
          </span>
        )}

        {units.map((unit) => (
          <div key={unit.name} className="flex flex-col gap-1 rounded-lg bg-gray-50 dark:bg-gray-800/40 p-3">
            <span className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
              {displayUnitName(unit.name)}
            </span>
            {unit.exercises.map((exercise) => {
              const others = exerciseOccurrences(userdata, exercise.name).filter(
                (o) => !(o.plan === planName && o.week === week && o.session === session)
              );
              const previous = others[0]?.sets ?? [];
              const planned = order?.sets[unit.name] ?? 0;
              const setCount = Math.max(planned, exercise.sets.length);
              const slots = Array.from({ length: setCount }, (_, i) => i + 1);

              return (
                <div
                  key={exercise.name}
                  className="flex items-center gap-3 px-1 py-1.5 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setInfo({
                        title: exercise.name,
                        lines: others.length
                          ? others.map(
                              (o) =>
                                `${o.plan} · ${o.week} · ${o.session}: ${o.sets.map(formatSet).join(", ")}`
                            )
                          : ["No other sessions with this exercise yet."],
                      })
                    }
                    className="grow min-w-0 min-h-11 flex items-center text-left text-sm font-bold break-words rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {exercise.name}
                  </button>

                  <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-x-1 gap-y-1">
                    {slots.map((setNumber) => {
                      const set = exercise.sets.find((s) => s.set === setNumber);
                      const before = previous.find((s) => s.set === setNumber);
                      const improved = set && progressVsPrevious([set], before ? [before] : undefined).length > 0;

                      return (
                        <div key={setNumber} className="flex items-center gap-1 text-sm">
                          <button
                            type="button"
                            aria-label={`${exercise.name} set ${setNumber} ${set ? "completed" : "not completed"}`}
                            title={set ? "Completed" : "Not completed"}
                            onClick={() => setInfoFor(exercise.name, setNumber, set, before)}
                            className={`min-h-11 min-w-11 flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                              set
                                ? "bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-700/20 dark:text-success-500"
                                : "bg-danger-50 text-danger hover:bg-danger-100 dark:bg-danger-700/20"
                            }`}
                          >
                            <FontAwesomeIcon icon={set ? faCircleCheck : faCircleXmark} />
                          </button>
                          {improved && (
                            <button
                              type="button"
                              aria-label={`${exercise.name} set ${setNumber} progressed`}
                              onClick={() => setInfoFor(exercise.name, setNumber, set, before)}
                              className="-ml-2 self-start rounded-full bg-success-500 px-1.5 text-xs font-bold leading-5 text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              +
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
          Tap a check, cross or + for set details. Tap an exercise name for its other sessions.
        </span>
      </div>

      {info && (
        <Modal title={info.title} isOpen={true} onClose={() => setInfo(null)}>
          <ul className="flex flex-col gap-2 text-sm list-disc pl-5">
            {info.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Modal>
      )}
    </Modal>
  );
};
