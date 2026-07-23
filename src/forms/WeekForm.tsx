import { IncrementDecrement } from "../components/others/IncrementDecrement";
import React, { useContext, useState } from "react";
import { Input } from "../components/form/Input";
import SourceDataContext from "../context/SourceDataContext";
import { Button } from "../components/form/Button";

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
    <div
      className="relative z-10"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <form
            onSubmit={handleSubmit}
            className={`
                            relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl 
                            transition-all sm:my-8 sm:w-full sm:max-w-lg
                        `}
          >
            <div className="bg-white px-2 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start w-full">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3
                    className="text-base font-semibold leading-6 text-gray-900"
                    id="modal-title"
                  >
                    {weekData.planName} - Week {weekData.weekNumber + 1}
                  </h3>
                  <div className="mt-2 grid grid-cols-3">
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
                      updateValue={setTargetTime}
                      nonZero={true}
                    />
                    <div className={`col-span-3 py-2`}>
                      <Input
                        label={"Annotation"}
                        value={annotation}
                        placeholder={"Annotation"}
                        changeValue={setAnnotation}
                        className={`pr-4`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
              <Button label="Update" type="submit" decoration="save" />
              <Button
                label={"Cancel"}
                decoration="cancel"
                onClick={() => {
                  clear();
                }}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
