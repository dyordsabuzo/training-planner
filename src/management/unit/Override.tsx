import { useState } from "react";
import { IncrementDecrement } from "../../components/others/IncrementDecrement";

type Props = {
  initialSet?: number;
  initialRep?: number;
  initialTime?: number;
  label?: string;
  handleOverride: (data: any) => void;
};

export const Override = ({
  initialSet = 0,
  initialRep = 0,
  initialTime = 0,
  handleOverride,
  label = "Override",
}: Props) => {
  const [targetSet, setTargetSet] = useState<number>(initialSet || 0);
  const [targetRep, setTargetRep] = useState<number>(initialRep || 0);
  const [targetTime, setTargetTime] = useState<number>(initialTime || 0);

  return (
    <div className={`flex items-center gap-2 py-1`}>
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
      <div
        className={`text-white rounded-md px-2 py-1 cursor-pointer
            ${targetSet || targetRep || targetTime ? "bg-orange-500" : "bg-gray-500"}
        `}
        onClick={() => handleOverride({ targetSet, targetRep, targetTime })}
      >
        {label}
      </div>
    </div>
  );
};
