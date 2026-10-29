import { useEffect, useRef, useState } from "react";
import { PRIMARY_PILL } from "../others/HeroTile";
import { Timer } from "../../components/others/Timer";
import { playCountdownWarningSound, playVoiceClip } from "../../common/utils";

const WARNING_SECONDS_REMAINING = 5;

type Props = {
  length: number;
  stateLabel?: string;
  toggleRest: (flag: boolean) => void;
};

export const UnwrappedRestTimer: React.FC<Props> = ({
  length,
  stateLabel,
  toggleRest,
}) => {
  const [countdownComplete, setCountdownComplete] = useState(false);
  const hasAnnouncedRestStart = useRef(false);

  useEffect(() => {
    // Guards against React StrictMode's dev-only double-invoke of mount
    // effects, which would otherwise speak "RESTING" twice.
    if (!hasAnnouncedRestStart.current) {
      hasAnnouncedRestStart.current = true;
      playVoiceClip("resting");
    }
    return () => {};
  }, []);

  useEffect(() => {
    if (countdownComplete) {
      playVoiceClip("workout");
      toggleRest(false);
    }
    return () => {};
  }, [countdownComplete, toggleRest]);

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="flex-1 flex flex-col items-center justify-center gap-2 pt-3">
        <Timer
          length={length}
          label="RESTING"
          setCountdownComplete={setCountdownComplete}
          // As big as fits: the card is the screen width minus its padding.
          size={Math.min(320, window.innerWidth - 72)}
          onTick={(remainingTime) => {
            if (remainingTime === WARNING_SECONDS_REMAINING) {
              playCountdownWarningSound();
            }
          }}
        />
        {stateLabel && (
          <span className="text-sm text-text-muted-light dark:text-text-muted-dark text-center px-4">
            {stateLabel}
          </span>
        )}
      </div>
      <button
        type="button"
        className={`${PRIMARY_PILL} min-h-14 mx-4 mb-2 sm:mx-6 text-xl uppercase`}
        onClick={() => toggleRest(false)}
      >
        Resume
      </button>
    </div>
  );
};
