import { Input } from "../components/form/Input";
import React, { useContext, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";
import { TagInput } from "../components/others/TagInput";
import { DateInput } from "../components/date/DateInput";
import dayjs, { Dayjs } from "dayjs";
import { FormButtons } from "./FormButtons";
import { Modal } from "../components/others/Modal";
import { DetailField } from "./DetailField";
import { EditIconButton } from "./EditIconButton";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";

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
  const [isEditing, setIsEditing] = useState(type !== "edit");
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
  const [startDate, setStartDate] = useState<Dayjs>(
    dayjs(planData?.startDate?.toDate()) || dayjs(new Date())
  );

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const resetFields = () => {
    setName(planData?.name ?? "");
    setNumberOfWeeks(planData?.numberOfWeeks ?? "");
    setBaselineSet(planData?.baselineSet ?? "");
    setBaselineRep(planData?.baselineRep ?? "");
    setBaselineTime(planData?.baselineTime ?? "");
    setSessions(planData?.sessions ?? []);
    setStartDate(dayjs(planData?.startDate?.toDate()) || dayjs(new Date()));
  };

  const handleDelete = () => {
    sourceDataContext.deletePlan(data);
    closeForm();
  };

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
      setIsEditing(false);
    }
  };

  return (
    <Modal
      title={type === "add" ? "Create plan" : "Plan"}
      isOpen={true}
      onClose={closeForm}
      headerAction={
        type === "edit" && !isEditing ? (
          <EditIconButton onClick={() => setIsEditing(true)} />
        ) : undefined
      }
    >
      {!isEditing ? (
        <div className="flex flex-col gap-4">
          <DetailField label="Plan name" value={name} />
          <div className="grid grid-cols-2 gap-3">
            <DetailField label="Number of weeks" value={numberOfWeeks} />
            <DetailField
              label="Start date"
              value={startDate?.isValid() ? startDate.format("MMM D, YYYY") : undefined}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <DetailField label="Baseline set" value={baselineSet} />
            <DetailField label="Baseline rep" value={baselineRep} />
            <DetailField label="Baseline time" value={baselineTime} />
          </div>
          <DetailField label="Selected sessions" tags={sessions} />
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <ConfirmDeleteButton onDelete={handleDelete} />
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-2`}
        >
          <Input
            label={"Plan name"}
            required
            value={name}
            placeholder={"Plan name"}
            changeValue={setName}
            className={`sm:col-span-2`}
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

          <div className="sm:col-span-2">
            <FormButtons
              onCancel={() => {
                if (type === "edit") {
                  resetFields();
                  setIsEditing(false);
                } else {
                  closeForm();
                }
              }}
              onDelete={type === "edit" ? handleDelete : undefined}
            />
          </div>
        </form>
      )}
    </Modal>
  );
};
