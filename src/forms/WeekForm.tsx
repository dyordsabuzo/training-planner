import { IncrementDecrement } from "../components/others/IncrementDecrement";
import React, { useContext, useState } from "react";
import { Input } from "../components/form/Input";
import SourceDataContext from "../context/SourceDataContext";
import { Modal } from "../components/others/Modal";
import { FormButtons } from "./FormButtons";

type Props = {
  weekData: any;
  clear: () => void;
};

export const WeekForm = ({ weekData, clear }: Props) => {
  const sourceDataContext = useContext(SourceDataContext);

  const [annotation, setAnnotation] = useState<string>(
    weekData.annotation || ""
  );
  const [targetSet, setTargetSet] = useState<number>(
    Number(weekData.targetSet) || 0
  );
  const [targetRep, setTargetRep] = useState<number>(
    Number(weekData.targetRep) || 0
  );
  const [targetTime, setTargetTime] = useState<number>(
    Number(weekData.targetTime) || 0
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let { weekKey, planName, ...minWeekData } = weekData;
    sourceDataContext.updateWeekPlan(planName, {
      ...minWeekData,
      annotation,
      targetSet,
      targetRep,
      targetTime,
    });
    clear();
  };

  return (
    <Modal
      title={`${weekData.planName} - Week ${weekData.weekNumber + 1}`}
      isOpen={true}
      onClose={clear}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Week goal"
          value={annotation}
          placeholder="Describe the focus for this week"
          changeValue={setAnnotation}
        />

        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark mb-2">
            Weekly targets
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <IncrementDecrement
              value={targetSet}
              label={"Set"}
              labelDirection="col"
              updateValue={setTargetSet}
              nonZero={true}
            />
            <IncrementDecrement
              value={targetRep}
              label={"Rep"}
              labelDirection="col"
              updateValue={setTargetRep}
              nonZero={true}
            />
            <IncrementDecrement
              value={targetTime}
              label={"Time"}
              labelDirection="col"
              unit={"s"}
              updateValue={setTargetTime}
              nonZero={true}
            />
          </div>
        </div>

        <FormButtons onCancel={clear} />
      </form>
    </Modal>
  );
};
