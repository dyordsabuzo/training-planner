import { useState } from "react";
import dayjs from "dayjs";
import { faArrowUp, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal } from "@dyordsabuzo/ui-components";
import {
  exerciseOccurrences,
  formatSet,
  isIncomplete,
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

// "60 kg × 8", "400 m" or "8 reps": the set value, short enough for a chip.
const chipLabel = (set: SetStat) => {
  if (set.distance) return `${set.distance} m`;
  return set.weight ? `${set.weight} kg × ${set.reps ?? "—"}` : `${set.reps ?? "—"} reps`;
};

// A summary tile (date, details, totals) over one card per unit. Each set is
// a chip with its value, kept light rather than alarming: green with an arrow
// when it went up on the same set number of the previous run, dashed when the
// planned set wasn't logged (no harsh cross/red). Tapping a set or the
// exercise name expands a short info callout under that row, instead of a
// popup.
export const SessionStats = ({ title, planName, week, session, logged, userdata, order, onClose }: Props) => {
  const { units, totals } = summariseRun(logged, order);
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

  // Every planned set slot per exercise, with the previous run's same set, so
  // the unit cards and the summary tile share one pass.
  const rows = units.map((unit) => {
    const exercises = unit.exercises.map((exercise) => {
      const others = exerciseOccurrences(userdata, exercise.name).filter(
        (o) => !(o.plan === planName && o.week === week && o.session === session)
      );
      const previous = others[0]?.sets ?? [];
      const setCount = Math.max(order?.sets[unit.name] ?? 0, exercise.sets.length);
      const slots = Array.from({ length: setCount }, (_, i) => {
        const set = exercise.sets.find((s) => s.set === i + 1);
        const before = previous.find((s) => s.set === i + 1);
        const improved = !!set && progressVsPrevious([set], before ? [before] : undefined).length > 0;
        return { setNumber: i + 1, set, before, improved };
      });
      return { name: exercise.name, others, slots };
    });
    const slots = exercises.flatMap((e) => e.slots);
    return { name: unit.name, exercises, logged: slots.filter((s) => s.set).length, planned: slots.length };
  });
  const planned = rows.reduce((sum, unit) => sum + unit.planned, 0);
  const improvedCount = rows.flatMap((u) => u.exercises.flatMap((e) => e.slots)).filter((s) => s.improved).length;
  const stats = [
    minutes !== null && minutes >= 0 && {
      label: "Time",
      value: minutes < 1 ? "<1m" : `${minutes}m`,
      hint: "Approximate: from starting the session to finishing it",
    },
    { label: "Sets", value: planned > totals.sets ? `${totals.sets}/${planned}` : `${totals.sets}` },
    totals.volume > 0
      ? { label: "Volume", value: `${totals.volume.toLocaleString()} kg` }
      : totals.distance > 0
        ? { label: "Distance", value: `${totals.distance} m` }
        : { label: "Reps", value: `${totals.reps}` },
    { label: "Sets up", value: `${improvedCount}`, hint: "Sets that improved on the same set last time" },
  ].filter(Boolean) as { label: string; value: string; hint?: string }[];
  const details = [planName, week && week !== "Open" ? week : null].filter(Boolean) as string[];

  return (
    <Modal title={title} isOpen={true} onClose={onClose}>
      <div className="flex max-h-[70dvh] flex-col gap-4 overflow-y-auto pr-1">
        <div
          className="flex flex-col gap-3 rounded-2xl p-4 text-white bg-gradient-to-br from-primary to-primary-400
            shadow-lg shadow-primary/30"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {completedAt && (
              <span className="text-sm font-semibold mr-1">{dayjs(completedAt).format("ddd, MMM D YYYY · HH:mm")}</span>
            )}
            {details.map((detail) => (
              <span key={detail} className="px-3 py-1 rounded-full bg-white/15 text-xs font-semibold break-words">
                {detail}
              </span>
            ))}
            {isIncomplete(logged) && (
              <span
                title="Ended before all units were done"
                className="px-3 py-1 rounded-full bg-amber-400/90 text-amber-950 text-xs font-bold"
              >
                Incomplete
              </span>
            )}
          </div>
          {units.length > 0 && (
            <dl className={`grid gap-2 ${stats.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
              {stats.map(({ label, value, hint }) => (
                <div
                  key={label}
                  title={hint}
                  className="flex flex-col-reverse items-center gap-0.5 rounded-xl bg-white/10 py-2.5"
                >
                  <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-white/70">{label}</dt>
                  <dd className="text-xl font-bold leading-none">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {units.length === 0 && (
          <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
            Nothing was recorded for this session.
          </span>
        )}

        {rows.map((unit) => (
          <div key={unit.name} className="flex flex-col gap-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40 p-3">
            <div className="flex items-center justify-between gap-3 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">
                {displayUnitName(unit.name)}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  unit.logged >= unit.planned
                    ? "bg-success-50 text-success dark:bg-success-500/20 dark:text-success-500"
                    : "bg-gray-100 text-text-muted-light dark:bg-gray-700/60 dark:text-text-muted-dark"
                }`}
              >
                {unit.logged}/{unit.planned} sets
              </span>
            </div>
            {unit.exercises.map((exercise) => {
              const rowKey = `${unit.name}:${exercise.name}`;

              return (
                <div key={exercise.name} className="flex flex-col gap-1.5 px-1">
                  <button
                    type="button"
                    onClick={() => toggleCallout(`${rowKey}:other`, otherSessionsText(exercise.others))}
                    className="self-start min-h-11 flex items-center text-left text-sm font-semibold text-text-light dark:text-text-dark break-words rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {exercise.name}
                  </button>

                  <div className="flex flex-wrap gap-1.5">
                    {exercise.slots.map(({ setNumber, set, before, improved }) => (
                      <button
                        key={setNumber}
                        type="button"
                        aria-label={`${exercise.name} set ${setNumber} ${set ? formatSet(set) : "not logged"}${improved ? ", up on last time" : ""}`}
                        onClick={() => toggleCallout(`${rowKey}:${setNumber}`, setDetailText(set, before))}
                        className={`flex items-center gap-1.5 min-h-11 px-3 rounded-full text-sm font-semibold border transition-colors
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            !set
                              ? "border-dashed border-gray-300 dark:border-gray-600 text-text-muted-light dark:text-text-muted-dark"
                              : improved
                                ? "border-success-500/40 bg-success-50 text-success dark:bg-success-500/20 dark:text-success-500"
                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-text-light dark:text-text-dark"
                          } ${callout?.key === `${rowKey}:${setNumber}` ? "ring-2 ring-primary" : ""}`}
                      >
                        <span className="text-[0.65rem] font-bold opacity-60">{setNumber}</span>
                        {set ? chipLabel(set) : "—"}
                        {improved && <FontAwesomeIcon icon={faArrowUp} className="text-xs" />}
                      </button>
                    ))}
                  </div>

                  {callout?.key.startsWith(`${rowKey}:`) && (
                    <div className="self-start flex items-start gap-1.5 rounded-xl bg-primary-50 dark:bg-primary-800/30 px-3 py-2 text-xs text-text-light dark:text-text-dark">
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
          Tap a set for a quick note (green ↑ means it improved on last time). Tap an exercise name for its last other
          session.
        </span>
      </div>
    </Modal>
  );
};
