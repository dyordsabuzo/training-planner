import { useEffect, useState } from "react";
import WrapperPage from "../WrapperPage";
import { Button } from "../../components/form/Button";
import { Timer } from "../../components/others/Timer";

type Props = {
  label: string;
  length: number;
  toggleRest: (flag: boolean) => void;
  children?: React.ReactNode;
};

export const WorkTimer = ({ label, length, toggleRest, children }: Props) => {
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
              label={label}
              setCountdownComplete={setCountdownComplete}
            />
          </div>
        )}
        {/* <Button
          label={"Resume exercise"}
          className={`my-5 py-3 bg-gray-400 hover:bg-gray-500`}
          onClick={() => toggleRest(false)}
        /> */}
        {children}
      </div>
    </WrapperPage>
  );
};
