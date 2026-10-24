import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { faArrowRight, faCheck, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Modal } from "@dyordsabuzo/ui-components";
import { AdjustableValue } from "../../components/others/AdjustableValue";
import { TempoBadge } from "../../components/others/TempoBadge";
import { WatchVideo } from "../../components/others/WatchVideo";
import { Timer } from "../../components/others/Timer";
import { playCountdownWarningSound, playVoiceClip, toStringArray } from "../../common/utils";
import SourceDataContext from "../../context/SourceDataContext";
import { useScrollToTopOnClose } from "../../common/useScrollToTopOnClose";

const WARNING_SECONDS_REMAINING = 5;
const SWITCH_WARNING_SECONDS_REMAINING = 3;
const SWIPE_THRESHOLD = 40;
const ANNOUNCE_SETTLE_MS = 150;

// Each-side exercises go left → (switch countdown) → right; others stay "left".
type Side = "left" | "switch" | "right";

const SidePill = ({ label, active, done }: { label: string; active: boolean; done: boolean }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full border-2 px-5 py-2 text-base font-bold uppercase tracking-wide
      transition-all duration-300 ${
        active
          ? "border-primary bg-primary text-white scale-110 shadow-md dark:bg-primary-400 dark:border-primary-400"
          : done
            ? "border-primary bg-primary-50 text-primary dark:bg-primary-800/40 dark:text-primary-200"
            : "border-gray-300 text-text-muted-light dark:border-gray-600 dark:text-text-muted-dark"
      }`}
  >
    {done && <FontAwesomeIcon icon={faCheck} />}
    {label}
  </span>
);

type Props = {
  name: string;
  videoLink?: string;
  type: string;
  targetWeight: string;
  targetRep: string;
  // Off: weight/reps (and target time) are hidden — just DONE per set.
  measured?: boolean;
  // Free-text target tempo/rate; shown under the exercise name when set.
  tempo?: string;
  // False while a modal (e.g. the Targets prompt) covers the page; the
  // "Starting workout" and "Left side" cues wait until it's closed.
  canAnnounce?: boolean;
  // First exercise of a new superset/exercise group: "Starting workout".
  isUnitStart?: boolean;
  // Done on each side: adds a left/right tracker and splits DONE (or the
  // timer, for time-based) into one per side.
  leftRight?: boolean;
  // Seconds of switch-sides countdown between left and right (0 skips it).
  sideRest?: number;
  // Set for distance groups; replaces the reps box with a metres box.
  targetDistance?: string;
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
  targetDistance,
  measured = true,
  tempo,
  canAnnounce = true,
  isUnitStart = false,
  leftRight,
  sideRest,
  targetTime = "0",
  exerciseLabel,
  transitionKey,
  alternatives,
  updateSupersetData,
  completeExercise,
  onSelectAlternative,
}: Props) => {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  // Stable so Modal doesn't re-run its focus effect on every timer tick.
  const closeTimerMenu = useCallback(() => setShowTimerMenu(false), []);
  useScrollToTopOnClose(showTimerMenu);
  const [timerComplete, setTimerComplete] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [side, setSide] = useState<Side>("left");
  const dragStartX = useRef<number | null>(null);
  const announcedFor = useRef<string | null>(null);

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
    setIsTimerPaused(false);
    setShowTimerMenu(false);
    setTimerComplete(false);
    setCarouselIndex(0);
    setSide("left");
  }, [transitionKey, name]);

  // Once per exercise, and only when nothing covers the page. Deferred and
  // cancelled on change because transitionKey and name don't update in the
  // same render (name is briefly undefined, or the previous exercise's), which
  // would otherwise look like two exercises and announce twice. The ref also
  // guards against StrictMode's dev-only double-invoke.
  useEffect(() => {
    const announceKey = `${transitionKey}-${name}`;
    if (
      !(leftRight || isUnitStart) ||
      !name ||
      !canAnnounce ||
      announcedFor.current === announceKey
    ) {
      return;
    }
    const timeout = setTimeout(() => {
      announcedFor.current = announceKey;
      // Queued, so "Starting workout" always plays before "Left side".
      if (isUnitStart) {
        playVoiceClip("starting-workout");
      }
      if (leftRight) {
        playVoiceClip("left-side");
      }
    }, ANNOUNCE_SETTLE_MS);
    return () => clearTimeout(timeout);
  }, [transitionKey, name, canAnnounce]);

  const startRightSide = (autoStartTimer: boolean) => {
    setSide("right");
    setIsTimerRunning(type === "Time-based" && autoStartTimer);
    setIsTimerPaused(false);
    playVoiceClip("right-side");
  };

  // DONE / timer end: the left side hands over to the right (via the
  // switch countdown when sideRest is set); otherwise the set is complete.
  const finishSide = () => {
    if (leftRight && side === "left") {
      setIsTimerRunning(false);
      setIsTimerPaused(false);
      if (sideRest && sideRest > 0) {
        setSide("switch");
        playVoiceClip("switch-sides");
      } else {
        startRightSide(false);
      }
      return;
    }
    completeExercise();
  };

  useEffect(() => {
    if (timerComplete) {
      setTimerComplete(false);
      setShowTimerMenu(false);
      finishSide();
    }
  }, [timerComplete]);

  const sideName = side === "right" ? "RIGHT" : "LEFT";

  // Stops the running exercise timer without completing the side/set, back
  // to the START button.
  const cancelTimer = () => {
    setIsTimerRunning(false);
    setIsTimerPaused(false);
    setShowTimerMenu(false);
  };

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
                    {slide.videoLink && !isTimerRunning && <WatchVideo videoLink={slide.videoLink} />}
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

        {tempo && (
          <div className="flex justify-center px-3">
            <TempoBadge tempo={tempo} />
          </div>
        )}
        {leftRight && !isTimerRunning && (
          <div className="flex flex-col items-center gap-1.5 px-3 mx-3 sm:mx-6">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
              Each side{sideRest ? ` · ${sideRest}s to switch` : ""}
            </span>
            <div className="flex items-center gap-3" role="status" aria-live="polite">
              <SidePill label="Left" active={side === "left"} done={side !== "left"} />
              <FontAwesomeIcon
                icon={faArrowRight}
                className={`text-primary dark:text-primary-300 ${side === "switch" ? "animate-pulse" : ""}`}
              />
              <SidePill label="Right" active={side === "right"} done={false} />
            </div>
          </div>
        )}
        {side === "switch" && (
          <div className="flex flex-col items-center justify-center py-2">
            <Timer
              length={sideRest || 0}
              label="SWITCH SIDES"
              size={200}
              halfwayCue={false}
              setCountdownComplete={(done) => done && startRightSide(true)}
              onTick={(remainingTime) => {
                if (remainingTime > 0 && remainingTime <= SWITCH_WARNING_SECONDS_REMAINING) {
                  playCountdownWarningSound();
                }
              }}
            />
          </div>
        )}
        {measured && type !== "Time-based" && side !== "switch" && (
          <div className="grid grid-cols-2 gap-2 px-3 sm:gap-6 sm:px-6">
            <AdjustableValue
              label="Weight"
              unit="kg"
              nonZero
              fullWidth
              value={Number(targetWeight) || 0}
              updateValue={(v: number) => {
                updateSupersetData({ targetWeight: v });
              }}
            />
            {targetDistance !== undefined ? (
              <AdjustableValue
                label="Distance"
                unit="m"
                step={1}
                min={1}
                fullWidth
                value={Number(targetDistance) || 1}
                updateValue={(v: number) => {
                  updateSupersetData({ targetDistance: v });
                }}
              />
            ) : (
              <AdjustableValue
                label="Reps"
                unit="reps"
                step={1}
                min={1}
                fullWidth
                value={Number(targetRep) || 1}
                updateValue={(v: number) => {
                  updateSupersetData({ targetRep: v });
                }}
              />
            )}
          </div>
        )}
        {type === "Time-based" && side !== "switch" && (
          <div className="grid grid-cols-1 gap-2 px-4 sm:px-6">
            {isTimerRunning ? (
              <button
                type="button"
                onClick={() => setShowTimerMenu(true)}
                aria-label="Timer options: pause or cancel"
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-full
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Timer
                  // Fresh countdown per side.
                  key={side}
                  length={parseInt(targetTime) || 0}
                  isPaused={isTimerPaused}
                  label={isTimerPaused ? "PAUSED" : leftRight ? `${sideName} SIDE` : "IN PROGRESS"}
                  // As big as fits: the card is the screen width minus its padding.
                  size={Math.min(320, window.innerWidth - 72)}
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
                <span className="text-xs text-primary dark:text-primary-300">
                  Tap timer to {isTimerPaused ? "resume" : "pause"} or cancel
                </span>
              </button>
            ) : (
              <AdjustableValue
                label="Target time"
                unit="secs"
                step={5}
                min={1}
                fullWidth
                value={Number(targetTime) || 1}
                updateValue={(v: number) => {
                  updateSupersetData({ targetTime: v });
                }}
              />
            )}
          </div>
        )}
      </div>
      {side === "switch" ? (
        <Button
          className="col-span-2 min-h-11 mx-4 mb-2 sm:mx-6 py-6 text-xl dark:bg-primary-400"
          onClick={() => startRightSide(true)}
          label="SKIP · START RIGHT"
        />
      ) : type === "Time-based" ? (
        // Hidden while the timer runs — controls move to the timer's menu.
        !isTimerRunning && (
          <Button
            className="col-span-2 min-h-11 mx-4 mb-2 sm:mx-6 py-6 text-xl dark:bg-primary-400"
            onClick={() => setIsTimerRunning(true)}
            label={leftRight ? `START ${sideName}` : "START"}
          />
        )
      ) : (
        <Button
          className="col-span-2 min-h-11 mx-4 mb-2 sm:mx-6 py-6 text-xl dark:bg-primary-400"
          onClick={finishSide}
          label={leftRight ? `${sideName} DONE` : "DONE"}
        />
      )}
      <Modal
        title="Timer"
        titleClassName="text-2xl font-bold"
        isOpen={showTimerMenu}
        onClose={closeTimerMenu}
      >
        <div className="flex gap-2">
          <Button
            label="Cancel timer"
            decoration="delete"
            className="flex-1"
            onClick={cancelTimer}
          />
          <Button
            label={isTimerPaused ? "Resume" : "Pause"}
            decoration="cancel"
            className="flex-1"
            onClick={() => {
              setIsTimerPaused(!isTimerPaused);
              closeTimerMenu();
            }}
          />
          {/* Ends this side/set early, as if the timer had run out. */}
          <Button
            label="Finish now"
            className="flex-1"
            onClick={() => {
              closeTimerMenu();
              finishSide();
            }}
          />
        </div>
      </Modal>
    </div>
  );
};
