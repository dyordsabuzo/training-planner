import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDumbbell } from "@fortawesome/free-solid-svg-icons";
import { Modal } from "@dyordsabuzo/ui-components";
import { displayUnitName, sideLabel } from "../resolveSessionSupersets";

const CHIP = "px-2.5 py-1 rounded-full text-xs font-semibold";

// "3 × 10 reps", "4 × 400 m", "3 × 45 s"; sets alone when there's no target.
export const unitTarget = (unit: any) => {
  const sets = Number(unit.targetSet) || 0;
  const amount = unit.targetTime
    ? `${unit.targetTime} s`
    : unit.targetDistance
      ? `${unit.targetDistance} m`
      : unit.targetRep
        ? `${unit.targetRep} reps`
        : null;
  if (sets && amount) return `${sets} × ${amount}`;
  if (sets) return `${sets} ${sets === 1 ? "set" : "sets"}`;
  return amount;
};

// What a session contains before it's run: each superset or exercise group
// with its targets and exercises. `units` is the resolved session (as
// resolveSession returns it), so targets match this plan and week.
export const SessionPreview = ({
  title,
  details,
  units,
  onClose,
}: {
  title: string;
  details: (string | null | undefined)[];
  units: Record<string, any>;
  onClose: () => void;
}) => {
  const rows = Object.entries(units ?? {}).map(([key, unit]) => ({
    key,
    unit,
    // Supersets are padded to two slots; drop the empty one.
    exercises: (unit.exercises ?? []).filter((e: any) => e?.exercise?.name),
  }));
  const exerciseCount = rows.reduce((sum, row) => sum + row.exercises.length, 0);
  const setCount = rows.reduce((sum, row) => sum + (Number(row.unit.targetSet) || 0), 0);
  const stats = [
    { label: rows.length === 1 ? "Unit" : "Units", value: rows.length },
    { label: exerciseCount === 1 ? "Exercise" : "Exercises", value: exerciseCount },
    { label: "Sets", value: setCount },
  ];

  return (
    <Modal title={title} isOpen={true} onClose={onClose}>
      <div className="flex max-h-[70dvh] flex-col gap-4 overflow-y-auto pr-1">
        <div
          className="flex flex-col gap-3 rounded-2xl p-4 text-white bg-gradient-to-br from-primary to-primary-400
            shadow-lg shadow-primary/30"
        >
          <ul aria-label="Session details" className="flex flex-wrap gap-1.5">
            {details.filter(Boolean).map((detail) => (
              <li key={detail} className="px-3 py-1 rounded-full bg-white/15 text-xs font-semibold break-words">
                {detail}
              </li>
            ))}
          </ul>
          <dl className="grid grid-cols-3 gap-2">
            {stats.map(({ label, value }) => (
              <div key={label} className="flex flex-col-reverse items-center gap-0.5 rounded-xl bg-white/10 py-2.5">
                <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-white/70">{label}</dt>
                <dd className="text-xl font-bold leading-none">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {rows.length === 0 && (
          <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
            This session has no exercises yet.
          </span>
        )}

        {rows.map(({ key, unit, exercises }, index) => {
          const chips = [
            unit.rest ? `Rest ${unit.rest} s` : null,
            unit.annotation,
            sideLabel(unit.leftRight),
            unit.tempo ? `Tempo ${unit.tempo}` : null,
          ].filter(Boolean) as string[];
          const target = unitTarget(unit);
          return (
            <section
              key={key}
              aria-label={displayUnitName(key)}
              className="flex flex-col gap-2 rounded-2xl bg-gray-50 dark:bg-gray-800/40 p-3"
            >
              <div className="flex items-center justify-between gap-3 px-1">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-primary text-white text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark break-words">
                    {displayUnitName(key)}
                  </span>
                </span>
                {target && (
                  <span className={`${CHIP} shrink-0 bg-primary-50 text-primary dark:bg-primary-800/30 dark:text-primary-200`}>
                    {target}
                  </span>
                )}
              </div>

              {chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-1">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className={`${CHIP} bg-gray-100 text-text-muted-light dark:bg-gray-700/60 dark:text-text-muted-dark`}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}

              <ul className="flex flex-col gap-1.5">
                {exercises.map(({ exercise, targetWeight }: any) => (
                  <li
                    key={exercise.name}
                    className="flex items-center gap-3 min-h-14 rounded-xl px-2 py-1.5 bg-white dark:bg-surface-dark"
                  >
                    <span className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-primary-50 text-primary dark:bg-primary-800/30 dark:text-primary-300">
                      <FontAwesomeIcon icon={faDumbbell} />
                    </span>
                    <span className="grow min-w-0 font-semibold break-words text-text-light dark:text-text-dark">
                      {exercise.name}
                    </span>
                    {unit.measured !== false && targetWeight > 0 && (
                      <span className={`${CHIP} shrink-0 bg-gray-100 text-text-light dark:bg-gray-700/60 dark:text-text-dark`}>
                        {targetWeight} kg
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Modal>
  );
};
