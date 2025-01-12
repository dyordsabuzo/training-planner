import { useEffect, useState } from "react";
import WrapperPage from "../WrapperPage";
import { Button } from "../../components/form/Button";
import { Timer } from "../../components/others/Timer";

type Props = {
  length: number;
  toggleRest: (flag: boolean) => void;
};

export const RestTimer: React.FC<Props> = ({ length, toggleRest }) => {
  const [countdownComplete, setCountdownComplete] = useState(false);

  useEffect(() => {
    if (countdownComplete) {
      toggleRest(false);
    }
    return () => {};
  }, [countdownComplete, toggleRest]);

  return (
    <WrapperPage>
      <div className={`w-full pt-12 grid place-content-center`}>
        {!countdownComplete && (
          <div className={`w-full`}>
            <Timer
              length={length}
              label="RESTING"
              setCountdownComplete={setCountdownComplete}
            />
          </div>
        )}
        <Button
          label={"Resume exercise"}
          className={`my-5 py-3 bg-gray-400 hover:bg-gray-500`}
          onClick={() => toggleRest(false)}
        />
      </div>
    </WrapperPage>
  );
};
