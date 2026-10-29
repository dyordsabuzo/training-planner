import { type CSSProperties, useEffect, useRef, useState } from "react";
import { playVoiceClip, playWhistleSound } from "../../common/utils";

// Shorter timers skip the halfway cue — it'd land on top of the start/end ones.
const HALFWAY_MIN_LENGTH = 10;
const HALFWAY_FLASH_MS = 2000;

// Ring colour by time left: blue, then amber at half, then red at a quarter
// (blended in between).
const COLORS = ["#004777", "#F7B801", "#A30000"];

const mixHex = (from: string, to: string, t: number) => {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `rgb(${[0, 1, 2].map((i) => Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * t)).join(",")})`;
};

export const ringColor = (remaining: number, length: number) => {
  const stops = [length * (3 / 4), length / 2, length / 4];
  if (remaining >= stops[0]) return COLORS[0];
  if (remaining >= stops[1]) return mixHex(COLORS[0], COLORS[1], (stops[0] - remaining) / (stops[0] - stops[1]));
  if (remaining >= stops[2]) return mixHex(COLORS[1], COLORS[2], (stops[1] - remaining) / (stops[1] - stops[2]));
  return COLORS[2];
};

// Whole seconds left, from the clock rather than counted ticks, so it stays
// right after the tab was in the background. Battery: wakes once per second
// (just after each boundary) instead of every animation frame.
const useCountdown = (length: number, isPaused: boolean, onDone: () => void) => {
  const [remaining, setRemaining] = useState(length);
  const elapsedMs = useRef(0);
  const finished = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (isPaused || finished.current) return;
    const startedAt = performance.now();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      const elapsed = elapsedMs.current + performance.now() - startedAt;
      const left = Math.max(0, Math.ceil(length - elapsed / 1000));
      setRemaining(left);
      if (left === 0) {
        if (!finished.current) {
          finished.current = true;
          onDoneRef.current();
        }
        return;
      }
      const msToNextSecond = (length * 1000 - elapsed) % 1000 || 1000;
      timeout = setTimeout(tick, msToNextSecond + 5);
    };

    // Background tabs throttle timers; catch up as soon as it's visible.
    const onVisibility = () => {
      if (!document.hidden) {
        clearTimeout(timeout);
        tick();
      }
    };

    tick();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", onVisibility);
      elapsedMs.current += performance.now() - startedAt;
    };
  }, [isPaused, length]);

  return remaining;
};

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
  const remaining = useCountdown(length, isPaused, () => {
    playWhistleSound();
    setCountdownComplete(true);
  });

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

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = length > 0 ? remaining / length : 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Starts at the top and empties clockwise. A CSS animation drains it
          smoothly without waking JS each frame; with reduced motion it falls
          back to the per-second dashoffset/colour attributes below. */}
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-gray-200 dark:stroke-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke={ringColor(remaining, length)}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className="motion-safe:animate-ring-drain"
          style={
            {
              "--ring-length": `${circumference}px`,
              animationDuration: `${length}s`,
              animationPlayState: isPaused ? "paused" : "running",
              opacity: remaining > 0 ? 1 : 0,
            } as CSSProperties
          }
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <RenderTime remainingTime={remaining} label={label} halfway={showHalfway} onTick={handleTick} />
      </div>
    </div>
  );
};
