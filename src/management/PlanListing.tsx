import React, { useContext, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";
import { WeekForm } from "../forms/WeekForm";
import { PlanForm } from "../forms/PlanForm";
import { sortObject } from "../common/utils";
import { Button } from "../components/form/Button";
import { WeekListing } from "./WeekListing";

type SelectedWeekData = {
  weekKey: string;
  weekNumber: number;
  planName: string;
  targetRep: number;
  targetSet: number;
  targetTime: number;
  annotation: string;
};

export const PlanListing = () => {
  const [formData, setFormData] = useState<any>({});
  const [formType, setFormType] = useState("");

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const [selectedWeekData, setSelectedWeekData] =
    useState<SelectedWeekData | null>(null);

  if (selectedWeekData) {
    console.log(selectedWeekData);
    return (
      <WeekForm
        weekData={selectedWeekData}
        clear={() => setSelectedWeekData(null)}
      />
    );
  }

  if (formType) {
    return (
      <PlanForm
        data={formData}
        type={formType}
        closeForm={() => setFormType("")}
      />
    );
  }

  if (!sourceData.plans) {
    return <div>Loading</div>;
  }

  return (
    <div className={`flex flex-col gap-2`}>
      <div className={`flex place-content-end`}>
        <Button
          decoration="text-only"
          label="+ Create plan"
          onClick={() => {
            setFormData({
              sessions: Object.keys(sourceData.sessions),
            });
            setFormType("add");
          }}
        />
      </div>
      <>
        {Object.entries((sourceDataContext.sourceData as any).plans ?? {}).map(
          ([planName, value]) => (
            <div
              key={planName}
              className={`flex flex-col gap-4 border border-1 border-blue-200 p-4 rounded-md text-sm`}
            >
              <div
                className={`cursor-pointer`}
                onClick={() => {
                  setFormData(value as any);
                  setFormType("edit");
                }}
              >
                <span className={`font-bold`}>{planName}</span>
              </div>
              <div className={`flex flex-col gap-2`}>
                {Object.entries(sortObject((value as any).weeks ?? {})).map(
                  ([weekKey, weekData]) => (
                    <div
                      key={weekKey}
                      className={`border border-1 p-2 rounded-lg`}
                      // onClick={(e) => {
                      //   setSelectedWeekData({
                      //     ...(weekData as any),
                      //     planName,
                      //     weekKey,
                      //   });
                      // }}
                    >
                      <WeekListing
                        weekLabel={weekKey}
                        data={weekData}
                        plan={value}
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          )
        )}
      </>
    </div>
  );
};
