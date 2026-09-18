import { useContext, useEffect, useRef, useState } from "react";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IncrementDecrement, Button } from "@dyordsabuzo/ui-components";
import { WatchVideo } from "../../components/others/WatchVideo";
import { Widget } from "../../components/others/Widget";
import { Timer } from "../../components/others/Timer";
import { playCountdownWarningSound, toStringArray } from "../../common/utils";
import SourceDataContext from "../../context/SourceDataContext";

const WARNING_SECONDS_REMAINING = 5;
const SWIPE_THRESHOLD = 40;

type Props = {
  name: string;
  videoLink?: string;
  type: string;
  targetWeight: string;
  targetRep: string;
  targetTime?: string;
  exerciseLabel?: string;
  transitionKey?: string | number;
  alternatives?: string[];
  updateSupersetData: (value: any) => void;
  completeExercise: () => void;
  onSelectAlternative: (exercise: any) => void;
};

export const ExerciseDetails = ({
  name,
  videoLink,
  type,
  targetWeight,
  targetRep,
  targetTime = "0",
  exerciseLabel,
  transitionKey,
  alternatives,
  updateSupersetData,
  completeExercise,
  onSelectAlternative,
}: Props) => {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerComplete, setTimerComplete] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const dragStartX = useRef<number | null>(null);

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;
  const alternativeNames = toStringArray(alternatives);
  const alternativeExercises = alternativeNames
    .map((n) => sourceData.exercises?.[n])
    .filter(Boolean);

  // Swiping only ever browses a preview of the name/video for an alternative
  // — the actual weight/reps/timer controls below stay tied to the real
  // (default) exercise until "Select this exercise" is tapped.
  const slides = [
    { key: "default", isDefault: true, name, videoLink, exercise: null },
    ...alternativeExercises.map((alt: any) => ({
      key: alt.name,
      isDefault: false,
      name: alt.name,
      videoLink: alt.videoLink,
      exercise: alt,
    })),
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartX.current === null) {
      return;
    }
    const deltaX = e.changedTouches[0].clientX - dragStartX.current;
    dragStartX.current = null;

    if (deltaX < -SWIPE_THRESHOLD) {
      setCarouselIndex((i) => Math.min(i + 1, slides.length - 1));
    } else if (deltaX > SWIPE_THRESHOLD) {
      setCarouselIndex((i) => Math.max(i - 1, 0));
    }
  };

  const handleSelectAlternative = (altExercise: any) => {
    onSelectAlternative(altExercise);
    setCarouselIndex(0);
  };

  // The component isn't remounted between exercises (only the inner div's
  // CSS animation key changes), so the timer must be reset explicitly.
  useEffect(() => {
    setIsTimerRunning(false);
    setTimerComplete(false);
    setCarouselIndex(0);
  }, [transitionKey, name]);

  useEffect(() => {
    if (timerComplete) {
      completeExercise();
    }
  }, [timerComplete]);

  return (
    <div className="flex-1 flex flex-col justify-between gap-4">
      <div
        key={transitionKey ?? name}
        className="flex-1 flex flex-col gap-4 animate-exercise-enter"
      >
        <div className="flex flex-col gap-2 pt-4">
          {exerciseLabel && (
            <span className="text-center text-xs font-medium uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
              {exerciseLabel}
            </span>
          )}

          {slides.length > 1 && (
            <span className="text-center text-xs font-semibold text-primary dark:text-primary-300">
              {`${alternativeNames.length} alternative${alternativeNames.length === 1 ? "" : "s"} available — swipe or tap the arrows`}
            </span>
          )}

          <div className="flex items-center gap-1">
            {slides.length > 1 && (
              <button
                type="button"
                aria-label="Previous exercise"
                disabled={carouselIndex === 0}
                onClick={() => setCarouselIndex((i) => Math.max(i - 1, 0))}
                className="shrink-0 min-h-11 min-w-11 flex items-center justify-center rounded-full
                  text-primary dark:text-primary-300 disabled:opacity-30 disabled:cursor-not-allowed
                  hover:bg-primary-50 dark:hover:bg-primary-800/30
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
            )}

            <div
              className="flex-1 overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
              >
                {slides.map((slide) => (
                  <div
                    key={slide.key}
                    className="w-full shrink-0 flex flex-col items-center gap-3 leading-none px-4"
                  >
                    <span className="text-center font-semibold text-3xl w-full break-words text-wrap text-text-light dark:text-text-dark uppercase">
                      {slide.name}
                    </span>
                    {slide.videoLink && <WatchVideo videoLink={slide.videoLink} />}
                    {!slide.isDefault && (
                      <Button
                        label="Select this exercise"
                        className="text-sm"
                        onClick={() => handleSelectAlternative(slide.exercise)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {slides.length > 1 && (
              <button
                type="button"
                aria-label="Next exercise"
                disabled={carouselIndex === slides.length - 1}
                onClick={() =>
                  setCarouselIndex((i) => Math.min(i + 1, slides.length - 1))
                }
                className="shrink-0 min-h-11 min-w-11 flex items-center justify-center rounded-full
                  text-primary dark:text-primary-300 disabled:opacity-30 disabled:cursor-not-allowed
                  hover:bg-primary-50 dark:hover:bg-primary-800/30
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            )}
          </div>

          {slides.length > 1 && (
            <div className="flex justify-center gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.key}
                  type="button"
                  aria-label={`Show ${slide.name}`}
                  aria-current={i === carouselIndex}
                  onClick={() => setCarouselIndex(i)}
                  className="p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                >
                  <span
                    className={`block w-2.5 h-2.5 rounded-full transition-colors ${
                      i === carouselIndex
                        ? "bg-primary dark:bg-primary-300"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {type !== "Time-based" && (
          <div className="grid grid-cols-2 gap-2 px-3 sm:gap-6 sm:px-6">
            <IncrementDecrement
              label="Weight"
              labelDirection="col"
              unit="kg"
              nonZero
              fullWidth
              value={Number(targetWeight) || 0}
              updateValue={(v: number) => {
                updateSupersetData({ targetWeight: v });
              }}
            />
            <IncrementDecrement
              label="Reps"
              labelDirection="col"
              unit="reps"
              nonZero
              fullWidth
              value={Number(targetRep) || 0}
              updateValue={(v: number) => {
                updateSupersetData({ targetRep: v });
              }}
            />
          </div>
        )}
        {type === "Time-based" && (
          <div className="grid grid-cols-1 gap-2 px-4 sm:px-6">
            {isTimerRunning ? (
              <div className="flex flex-col items-center justify-center py-2">
                <Timer
                  length={parseInt(targetTime) || 0}
                  label="IN PROGRESS"
                  size={220}
                  setCountdownComplete={setTimerComplete}
                  onTick={(remainingTime) => {
                    if (
                      remainingTime > 0 &&
                      remainingTime <= WARNING_SECONDS_REMAINING
                    ) {
                      playCountdownWarningSound();
                    }
                  }}
                />
              </div>
            ) : (
              <Widget
                label={"Target Time"}
                value={targetTime}
                unit={"secs"}
                editable={false}
              />
            )}
          </div>
        )}
      </div>
      {type === "Time-based" && !isTimerRunning ? (
        <Button
          className="col-span-2 min-h-11 mx-4 mb-2 sm:mx-6 py-6 text-xl dark:bg-primary-400"
          onClick={() => setIsTimerRunning(true)}
          label="START"
        />
      ) : (
        <Button
          className="col-span-2 min-h-11 mx-4 mb-2 sm:mx-6 py-6 text-xl dark:bg-primary-400"
          onClick={completeExercise}
          label="DONE"
        />
      )}
    </div>
  );
};
