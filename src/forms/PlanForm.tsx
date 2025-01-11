import { Input } from "../components/form/Input";
import React, { useContext, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";
import { TagInput } from "../components/others/TagInput";

import "react-datepicker/dist/react-datepicker.css";
import { DateInput } from "../components/date/DateInput";
import dayjs, { Dayjs } from "dayjs";
import { FormButtons } from "./FormButtons";

type FormData = {
  id?: string;
  name?: string;
  numberOfWeeks?: string;
  baselineRep?: string;
  baselineSet?: string;
  baselineTime?: string;
  sessions?: string[];
  startDate: Dayjs;
};

type Props = {
  data: FormData | null;
  type: string;
  closeForm: () => void;
};

export const PlanForm = ({ data, type, closeForm }: Props) => {
  const planData = data;

  const id = planData?.id;
  const [name, setName] = useState(planData?.name ?? "");
  const [numberOfWeeks, setNumberOfWeeks] = useState(
    planData?.numberOfWeeks ?? ""
  );
  const [baselineSet, setBaselineSet] = useState(planData?.baselineSet ?? "");
  const [baselineRep, setBaselineRep] = useState(planData?.baselineRep ?? "");
  const [baselineTime, setBaselineTime] = useState(
    planData?.baselineTime ?? ""
  );
  const [sessions, setSessions] = useState<string[]>(planData?.sessions ?? []);
  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs(planData?.startDate?.toDate()) ?? dayjs(new Date())
  );

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (type === "add") {
      sourceDataContext.addPlan({
        name,
        numberOfWeeks,
        startDate: startDate?.toDate(),
        baselineSet,
        baselineRep,
        baselineTime,
        sessions,
      });
      closeForm();
    }

    if (type === "edit") {
      sourceDataContext.editPlan({
        id,
        originalName: planData?.name,
        name,
        numberOfWeeks,
        startDate: startDate?.toDate(),
        baselineSet,
        baselineRep,
        baselineTime,
        sessions,
      });
      closeForm();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`grid place-content-center grid-cols-2 gap-4 sm:gap-2`}
    >
      <Input
        label={"Plan name"}
        required
        value={name}
        placeholder={"Plan name"}
        changeValue={setName}
        className={`col-span-2`}
      />

      <Input
        label={"Number of weeks"}
        required
        value={numberOfWeeks}
        placeholder={"Number of weeks"}
        changeValue={setNumberOfWeeks}
      />

      <DateInput
        label={"Start date"}
        value={startDate}
        placeholder={"Start date"}
        changeValue={setStartDate}
      />

      <Input
        label={"Baseline set"}
        value={baselineSet}
        placeholder={"Baseline set"}
        changeValue={setBaselineSet}
      />

      <Input
        label={"Baseline Rep"}
        value={baselineRep}
        placeholder={"Target Rep"}
        changeValue={setBaselineRep}
      />

      <Input
        label={"Baseline Time"}
        value={baselineTime}
        placeholder={"Target Time"}
        changeValue={setBaselineTime}
      />

      <TagInput
        label={"Selected sessions"}
        list={sessions}
        options={Object.keys(sourceData.sessions ?? {})}
        updateList={setSessions}
      />

      <div className="col-span-2">
        <FormButtons
          onCancel={() => {
            closeForm();
          }}
          onDelete={() => {
            sourceDataContext.deletePlan(data);
            closeForm();
          }}
        />
      </div>
    </form>
  );
};
