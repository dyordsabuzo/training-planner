import { useEffect, useState } from "react";
import WrapperPage from "../WrapperPage";
import { Button } from "../../components/form/Button";
import { Timer } from "../../components/others/Timer";

type Props = {
  length: number;
  stateLabel?: string;
  toggleRest: (flag: boolean) => void;
};

export const RestTimer: React.FC<Props> = ({
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
    <WrapperPage>
      <div className={`w-full pt-12 flex flex-col gap-2 place-content-center`}>
        {!countdownComplete && (
          <div className={`flex place-content-center w-full`}>
            <Timer
              length={length}
              label="RESTING"
              setCountdownComplete={setCountdownComplete}
            />
          </div>
        )}
        {stateLabel && (
          <span className={`flex place-content-center pt-4`}>{stateLabel}</span>
        )}
        <Button
          label={"Resume exercise"}
          className={`my-3 py-3 text-lg bg-blue-400 hover:bg-blue-500`}
          onClick={() => toggleRest(false)}
        />
      </div>
    </WrapperPage>
  );
};
