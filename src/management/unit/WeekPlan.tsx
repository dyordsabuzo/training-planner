import { useState } from "react";
import { IncrementDecrement } from "../../components/others/IncrementDecrement";

type Props = {
  data: any;
};

export const WeekPlan = ({ data }: Props) => {
  const [targetSet, setTargetSet] = useState<number>(
    Number(data.targetSet) || 0
  );
  const [targetRep, setTargetRep] = useState<number>(
    Number(data.targetRep) || 0
  );
  const [targetTime, setTargetTime] = useState<number>(
    Number(data.targetTime) || 0
  );

  return (
    <div
      className={`
        mt-2 flex flex-col
        border border-1 rounded-sm
        px-2 py-1
        `}
    >
      <div
        className={`
            flex gap-2
            `}
      >
        <IncrementDecrement
          value={targetSet}
          label={"Set"}
          updateValue={setTargetSet}
          nonZero={true}
        />
        <IncrementDecrement
          value={targetRep}
          label={"Rep"}
          updateValue={setTargetRep}
          nonZero={true}
        />
        <IncrementDecrement
          value={targetTime}
          label={"Time"}
          unit={"s"}
          updateValue={setTargetTime}
          nonZero={true}
        />
      </div>
    </div>
  );
};
