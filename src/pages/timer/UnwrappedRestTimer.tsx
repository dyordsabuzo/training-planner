import { useEffect, useRef, useState } from "react";
import { Button } from "@dyordsabuzo/ui-components";
import { Timer } from "../../components/others/Timer";
import { playCountdownWarningSound, speak } from "../../common/utils";

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
      speak("RESTING");
    }
    return () => {};
  }, []);

  useEffect(() => {
    if (countdownComplete) {
      speak("WORKOUT!");
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
          size={260}
          onTick={(remainingTime) => {
            if (remainingTime > 0 && remainingTime <= WARNING_SECONDS_REMAINING) {
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
      <Button
        label={"RESUME"}
        className="min-h-11 py-4 text-lg mx-4 mb-2 sm:mx-6"
        onClick={() => toggleRest(false)}
      />
    </div>
  );
};
