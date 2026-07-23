import { useContext, useState } from "react";
import { Input } from "../../components/form/Input";
import { WeekSession } from "./WeekSession";
import SourceDataContext from "../../context/SourceDataContext";
import { Override } from "./Override";

type Props = {
  weekLabel: string;
  data: any;
  plan: any;
};

type SourceData = {
  sessions?: {
    [key: string]: any;
  };
};

export const WeekItem = ({ weekLabel, data, plan }: Props) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [annotation, setAnnotation] = useState<string>(data.annotation || "");

  const sourceDataContext = useContext(SourceDataContext);
  const { sourceData, updateWeekPlan } = sourceDataContext as {
    sourceData: SourceData;
    updateWeekPlan: (plan: string, week: any) => void;
  };
  const sessions = Object.values(sourceData?.sessions || {}).filter((s) =>
    plan.sessions.includes(s.name)
  );

  const handleDefaults = (defaultValues: any) => {
    updateWeekPlan(plan.name, {
      ...data,
      ...defaultValues,
      annotation,
    });
  };

  return (
    <div>
      <div
        className={`flex gap-4 cursor-pointer`}
        onClick={() => {
          setShowDetails(!showDetails);
        }}
      >
        <span>{weekLabel}</span>
        {!showDetails && (
          <span>
            Set: {(data as any).targetSet} / Rep: {(data as any).targetRep}
          </span>
        )}
        <span className={`truncate`}>{(data as any).annotation}</span>
      </div>
      <div
        className={`
        ${showDetails ? "block" : "hidden"}
        mt-2 flex flex-col
        `}
      >
        <Input
          label={"Week goal"}
          value={annotation}
          placeholder={"Describe the week goal"}
          changeValue={setAnnotation}
          className={`py-2`}
        />
        <Override
          handleOverride={handleDefaults}
          initialSet={parseInt(data.targetSet)}
          initialRep={parseInt(data.targetRep)}
          initialTime={parseInt(data.targetTime)}
          rest={parseInt(data.targetRest)}
          label={`Update default values`}
        />
        {sessions
          .filter((s) => plan.sessions.includes(s.name))
          .map((session: any) => (
            <WeekSession
              key={session.name}
              data={session}
              plan={plan}
              weekData={data}
            />
          ))}

        {/* {plan.sessions.map((session: string) => (
          <WeekPlan key={session} name={session} data={data} />
        ))} */}
      </div>
    </div>
  );
};
