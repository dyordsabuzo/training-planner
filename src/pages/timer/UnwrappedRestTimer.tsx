import { useEffect, useState } from "react";
import WrapperPage from "../WrapperPage";
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
    <div className="w-full h-full flex flex-col gap-2 items-center place-content-center">
      <div className="flex place-content-center w-full pt-3">
        <Timer
          length={length}
          label="RESTING"
          setCountdownComplete={setCountdownComplete}
          size={240}
        />
      </div>
      {stateLabel && (
        <span className="text-sm text-text-muted-light dark:text-text-muted-dark text-center px-4">
          {stateLabel}
        </span>
      )}
      <Button
        label={"Resume"}
        className="m-2 min-h-11 text-lg"
        onClick={() => toggleRest(false)}
      />
    </div>
  );
};
