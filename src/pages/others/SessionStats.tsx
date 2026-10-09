import { useState } from "react";
import dayjs from "dayjs";
import { faCircle, faCircleCheck, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
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

type Callout = { key: string; text: string };

// One row per exercise, kept light rather than alarming: a filled dot means
// the set was logged, a faint outline means it wasn't (no harsh cross/red). A
// small corner dot means that set went up on the same set number of the
// previous run. Tapping a set or the exercise name expands a short info
// callout under that row, instead of a popup.
export const SessionStats = ({ title, planName, week, session, logged, userdata, order, onClose }: Props) => {
  const { units } = summariseRun(logged, order);
  const [callout, setCallout] = useState<Callout | null>(null);

  // Runs saved before dates were recorded have no meta, so nothing is shown.
  const { completedAt, startedAt } = logged?.meta ?? {};
  const minutes =
    completedAt && startedAt
      ? Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000)
      : null;

  // Tapping the same control again collapses its callout.
  const toggleCallout = (key: string, text: string) =>
    setCallout((current) => (current?.key === key ? null : { key, text }));

  // One short line: the set itself, plus how it compares with the same set
  // last time.
  const setDetailText = (set: SetStat | undefined, before: SetStat | undefined) => {
    if (!set) return "Not logged — this planned set wasn't recorded.";
    if (!before) return `${formatSet(set)} — first time logging this set.`;
    const improved = progressVsPrevious([set], [before]).length > 0;
    return improved
      ? `${formatSet(set)} — up from ${formatSet(before)} last time.`
      : `${formatSet(set)} — same as last time (${formatSet(before)}).`;
  };

  // One short line: the most recent other session, plus a count of the rest.
  const otherSessionsText = (others: ReturnType<typeof exerciseOccurrences>) => {
    if (others.length === 0) return "No other sessions with this exercise yet.";
    const [latest, ...rest] = others;
    const sets = latest.sets.map(formatSet).join(", ");
    return `Last: ${latest.plan} · ${latest.week} · ${latest.session} — ${sets}${
      rest.length > 0 ? ` (+${rest.length} more)` : ""
    }`;
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
          <div key={unit.name} className="flex flex-col gap-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 p-3">
            <span className="px-1 text-xs font-medium uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
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

              const rowKey = `${unit.name}:${exercise.name}`;

              return (
                <div key={exercise.name} className="flex flex-col gap-1.5 px-1">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleCallout(`${rowKey}:other`, otherSessionsText(others))}
                      className="grow min-w-0 min-h-11 flex items-center text-left text-sm font-medium text-text-light dark:text-text-dark break-words rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {exercise.name}
                    </button>

                    <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-1">
                      {slots.map((setNumber) => {
                        const set = exercise.sets.find((s) => s.set === setNumber);
                        const before = previous.find((s) => s.set === setNumber);
                        const improved = set && progressVsPrevious([set], before ? [before] : undefined).length > 0;
                        const openThisSet = () =>
                          toggleCallout(`${rowKey}:${setNumber}`, setDetailText(set, before));

                        return (
                          <button
                            key={setNumber}
                            type="button"
                            aria-label={`${exercise.name} set ${setNumber} ${set ? "completed" : "not completed"}${improved ? ", up on last time" : ""}`}
                            title={set ? "Completed" : "Not logged"}
                            onClick={openThisSet}
                            className="relative min-h-11 min-w-11 flex items-center justify-center rounded-full text-base transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <FontAwesomeIcon
                              icon={set ? faCircleCheck : faCircle}
                              className={set ? "text-success-500" : "text-gray-300 dark:text-gray-600"}
                            />
                            {improved && (
                              <span
                                aria-hidden="true"
                                className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-success-500 ring-2 ring-gray-50 dark:ring-gray-800"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {callout?.key.startsWith(`${rowKey}:`) && (
                    <div className="self-start flex items-start gap-1.5 rounded-md bg-gray-100 dark:bg-gray-800/70 px-2.5 py-1.5 text-xs text-text-muted-light dark:text-text-muted-dark">
                      <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 shrink-0 text-primary" />
                      <span className="break-words">{callout.text}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
          Tap a set for a quick note (a dot means it improved on last time). Tap an exercise name for its last other session.
        </span>
      </div>
    </Modal>
  );
};
