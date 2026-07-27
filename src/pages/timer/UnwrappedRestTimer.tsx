import { useEffect, useState } from "react";
import { Button } from "../../components/form/Button";
import { Timer } from "../../components/others/Timer";

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

  useEffect(() => {
    if (countdownComplete) {
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
        />
        {stateLabel && (
          <span className="text-sm text-text-muted-light dark:text-text-muted-dark text-center px-4">
            {stateLabel}
          </span>
        )}
      </div>
      <Button
        label={"Resume"}
        className="min-h-11 text-lg mx-4 mb-2 sm:mx-6"
        onClick={() => toggleRest(false)}
      />
    </div>
  );
};
