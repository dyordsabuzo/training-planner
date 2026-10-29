import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faChevronDown, faChevronUp, faForward } from "@fortawesome/free-solid-svg-icons";
import { ExerciseSuperset } from "../../types/Exercise";
import { unitId } from "../resolveSessionSupersets";

type Props = {
  supersets: any[];
  doneUpToIndex?: number;
  activeIndex?: number;
  // Unit ids skipped during the run; shown as passed but not done.
  skippedIds?: string[];
  // Fold finished units into one "N done" row (SummaryPage between units).
  collapseDone?: boolean;
  // Unit names only, exercises on tap: SummaryPage's Up next card already
  // lists the next unit's exercises, so this stays an outline.
  compact?: boolean;
};

export const SessionProgress = ({
  supersets,
  doneUpToIndex = -1,
  activeIndex,
  skippedIds = [],
  collapseDone = false,
  compact = false,
}: Props) => {
  const [showDone, setShowDone] = useState(false);
  const doneCount = Math.min(doneUpToIndex + 1, supersets.length);
  const hideDone = collapseDone && !showDone && doneCount > 0;
  const skippedCount = supersets
    .slice(0, doneCount)
    .filter((superset: any) => skippedIds.includes(unitId(superset))).length;
  // Completed groups hide their exercises; ids here are expanded by the user.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  return (
    <div className="flex flex-col">
      {hideDone && (
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 shrink-0 rounded-full border-2 border-success-500 bg-success-500 flex items-center justify-center">
              <FontAwesomeIcon icon={faCheckCircle} className="text-white text-sm" />
            </div>
            <div className="w-0.5 flex-1 min-h-[2rem] bg-gray-200 dark:bg-gray-700 my-1" />
          </div>
          <button
            type="button"
            onClick={() => setShowDone(true)}
            aria-expanded={false}
            className="flex-1 -mt-1 mb-2 p-3 rounded-md flex items-center justify-between gap-2 text-left
              bg-success-100 dark:bg-success-700/30
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="text-base font-bold">
              {doneCount - skippedCount} done
              {skippedCount > 0 && ` · ${skippedCount} skipped`}
            </span>
            <span className="flex items-center gap-1.5 shrink-0 text-xs text-text-muted-light dark:text-text-muted-dark">
              Show
              <FontAwesomeIcon icon={faChevronDown} />
            </span>
          </button>
        </div>
      )}
      {supersets.map((superset: any, index: number) => {
        if (hideDone && index <= doneUpToIndex) return null;
        const id = unitId(superset);
        const isSkipped = index <= doneUpToIndex && skippedIds.includes(id);
        const isDone = index <= doneUpToIndex && !isSkipped;
        const isActive = activeIndex === index;
        const exercises = superset.exercises.filter(
          (item: ExerciseSuperset) => item.exercise
        );
        const collapsible = isDone || isSkipped || compact;
        const showExercises = !collapsible || expanded.has(id);

        return (
          <div key={id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center
                  ${
                    isDone
                      ? "border-success-500 bg-success-500"
                      : isSkipped
                        ? "border-gray-400 bg-gray-400 dark:border-gray-500 dark:bg-gray-500"
                        : isActive
                          ? "border-primary"
                          : "border-gray-300 dark:border-gray-600"
                  }`}
              >
                {isSkipped && (
                  <FontAwesomeIcon icon={faForward} className="text-white text-xs" aria-label="Skipped" />
                )}
                {isDone && (
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    className="text-white text-sm"
                  />
                )}
                {isActive && !isDone && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <div className="w-0.5 flex-1 min-h-[2rem] bg-gray-200 dark:bg-gray-700 my-1" />
            </div>
            <div
              className={`flex-1 -mt-1 mb-2 p-3 rounded-md flex flex-col gap-1
                ${
                  isDone
                    ? "bg-success-100 dark:bg-success-700/30"
                    : isActive
                      ? "bg-primary-50 dark:bg-primary-800/20"
                      : ""
                }`}
            >
              {collapsible ? (
                <button
                  type="button"
                  onClick={() => toggleExpanded(id)}
                  aria-expanded={showExercises}
                  className="flex items-center justify-between gap-2 text-left -m-1 p-1 rounded
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="text-base font-bold">{superset.name}</span>
                  <span className="flex items-center gap-1.5 shrink-0 text-xs text-text-muted-light dark:text-text-muted-dark">
                    {isSkipped && "Skipped · "}
                    {compact && isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-primary text-white font-semibold">Up next</span>
                    )}
                    {!showExercises &&
                      `${exercises.length} exercise${exercises.length === 1 ? "" : "s"}`}
                    <FontAwesomeIcon icon={showExercises ? faChevronUp : faChevronDown} />
                  </span>
                </button>
              ) : (
                <span className="text-base font-bold">{superset.name}</span>
              )}
              {showExercises && exercises.map((item: ExerciseSuperset, exIndex: number) => (
                <span
                  key={exIndex}
                  className={`text-sm leading-snug break-words ${
                    isDone || isSkipped
                      ? "text-text-muted-light dark:text-text-muted-dark"
                      : "text-text-light dark:text-text-dark"
                  }`}
                >
                  {item.exercise.name}
                </span>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex gap-3 items-center">
        <div
          className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center
            ${
              supersets.length - 1 <= doneUpToIndex
                ? "border-success-500 bg-success-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
        >
          {supersets.length - 1 <= doneUpToIndex && (
            <FontAwesomeIcon icon={faCheckCircle} className="text-white text-sm" />
          )}
        </div>
        <span className="text-base font-bold">Finish</span>
      </div>
    </div>
  );
};
