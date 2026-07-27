import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { ExerciseSuperset } from "../../types/Exercise";

type Props = {
  supersets: any[];
  doneUpToIndex?: number;
  activeIndex?: number;
};

export const SessionProgress = ({
  supersets,
  doneUpToIndex = -1,
  activeIndex,
}: Props) => {
  return (
    <div className="flex flex-col">
      {supersets.map((superset: any, index: number) => {
        const isDone = index <= doneUpToIndex;
        const isActive = activeIndex === index;
        const exercises = superset.exercises.filter(
          (item: ExerciseSuperset) => item.exercise
        );

        return (
          <div key={superset.name} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center
                  ${
                    isDone
                      ? "border-success-500 bg-success-500"
                      : isActive
                        ? "border-primary"
                        : "border-gray-300 dark:border-gray-600"
                  }`}
              >
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
              <span className="text-base font-bold">{superset.name}</span>
              {exercises.map((item: ExerciseSuperset, exIndex: number) => (
                <span
                  key={exIndex}
                  className="text-sm text-text-muted-light dark:text-text-muted-dark"
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
