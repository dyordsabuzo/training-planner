import { useState } from "react";
import { Input } from "../components/form/Input";
import { WeekPlan } from "./unit/WeekPlan";

type Props = {
  weekLabel: string;
  data: any;
  plan: any;
};
export const WeekListing = ({ weekLabel, data, plan }: Props) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [annotation, setAnnotation] = useState<string>(data.annotation || "");

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
        {plan.sessions.map((session: string) => (
          <WeekPlan data={data} />
        ))}
      </div>
    </div>
  );
};
