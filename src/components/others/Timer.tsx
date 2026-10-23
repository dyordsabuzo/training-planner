import { useEffect, useRef, useState } from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { playVoiceClip } from "../../common/utils";

// Shorter timers skip the halfway cue — it'd land on top of the start/end ones.
const HALFWAY_MIN_LENGTH = 10;
const HALFWAY_FLASH_MS = 2000;

type RenderProps = {
  label?: string;
  halfway?: boolean;
  remainingTime: number;
  onTick?: (remainingTime: number) => void;
};

const RenderTime = ({
  label = "RESTING",
  halfway = false,
  remainingTime = 60,
  onTick,
}: RenderProps) => {
  useEffect(() => {
    onTick?.(remainingTime);
  }, [remainingTime]);

  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = remainingTime % 60;

  if (remainingTime === 0) {
    return <div className={`flex flex-col items-center`} />;
  }

  return (
    <div
      className="flex flex-col items-center text-text-light dark:text-text-dark"
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      {halfway ? (
        <div className="text-2xl font-extrabold tracking-wider text-amber-500 animate-pulse">HALFWAY</div>
      ) : (
        <div className="text-2xl font-extrabold tracking-wider text-primary dark:text-primary-300">{label}</div>
      )}
      <div className="text-6xl">
        {("0" + minutes).slice(-2)}:{("0" + seconds).slice(-2)}
      </div>
    </div>
  );
};

type MainProps = {
  length: number;
  label?: string;
  size?: number;
  strokeWidth?: number;
  setCountdownComplete: (flag: boolean) => void;
  onTick?: (remainingTime: number) => void;
  // Off for short utility countdowns (e.g. switching sides).
  halfwayCue?: boolean;
  isPaused?: boolean;
};

export const Timer = ({
  length,
  setCountdownComplete,
  label,
  size = 300,
  strokeWidth = 16,
  onTick,
  halfwayCue = true,
  isPaused = false,
}: MainProps) => {
  const [showHalfway, setShowHalfway] = useState(false);
  const halfwayAnnounced = useRef(false);

  useEffect(() => {
    if (!showHalfway) {
      return;
    }
    const timeout = setTimeout(() => setShowHalfway(false), HALFWAY_FLASH_MS);
    return () => clearTimeout(timeout);
  }, [showHalfway]);

  // Voice + flashing label + vibration (Android; iOS has no web vibration).
  const handleTick = (remainingTime: number) => {
    onTick?.(remainingTime);
    if (
      halfwayCue &&
      length >= HALFWAY_MIN_LENGTH &&
      !halfwayAnnounced.current &&
      remainingTime > 0 &&
      remainingTime <= Math.floor(length / 2)
    ) {
      halfwayAnnounced.current = true;
      setShowHalfway(true);
      playVoiceClip("halfway");
      try {
        navigator.vibrate?.(200);
      } catch {}
    }
  };

  return (
    <CountdownCircleTimer
      isPlaying={!isPaused}
      duration={length}
      colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
      colorsTime={[length * (3 / 4), length * (1 / 2), length * (1 / 4), 0]}
      strokeWidth={strokeWidth}
      size={size}
      onComplete={() => {
        setCountdownComplete(true);
        return { shouldRepeat: false, delay: 1 };
      }}
    >
      {({ remainingTime }) => (
        <RenderTime
          remainingTime={remainingTime}
          label={label}
          halfway={showHalfway}
          onTick={handleTick}
        />
      )}
    </CountdownCircleTimer>
  );
};
