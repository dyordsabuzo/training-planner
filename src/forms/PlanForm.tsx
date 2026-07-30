import { Input } from "../components/form/Input";
import { ReorderableSelect } from "../components/form/ReorderableSelect";
import { IncrementDecrement } from "../components/others/IncrementDecrement";
import React, { useContext, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";
import { DateInput } from "../components/date/DateInput";
import dayjs, { Dayjs } from "dayjs";
import { FormButtons } from "./FormButtons";
import { Modal } from "../components/others/Modal";
import { DetailField } from "./DetailField";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { useEntityForm } from "./useEntityForm";
import { findDuplicateName } from "../common/nameValidation";
import { toDate } from "../common/planWeek";
import { toStringArray } from "../common/utils";

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
  const [nameError, setNameError] = useState<string>();
  const [numberOfWeeks, setNumberOfWeeks] = useState(
    planData?.numberOfWeeks ?? "1"
  );
  const [baselineSet, setBaselineSet] = useState(planData?.baselineSet ?? "");
  const [baselineRep, setBaselineRep] = useState(planData?.baselineRep ?? "");
  const [baselineTime, setBaselineTime] = useState(
    planData?.baselineTime ?? ""
  );
  const [sessions, setSessions] = useState<string[]>(toStringArray(planData?.sessions));
  const [startDate, setStartDate] = useState<Dayjs>(
    toDate(planData?.startDate) ?? dayjs()
  );

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const resetFields = () => {
    setName(planData?.name ?? "");
    setNameError(undefined);
    setNumberOfWeeks(planData?.numberOfWeeks ?? "1");
    setBaselineSet(planData?.baselineSet ?? "");
    setBaselineRep(planData?.baselineRep ?? "");
    setBaselineTime(planData?.baselineTime ?? "");
    setSessions(toStringArray(planData?.sessions));
    setStartDate(toDate(planData?.startDate) ?? dayjs());
  };

  const { isEditing, setIsEditing, headerAction, handleCancel, handleDelete } =
    useEntityForm({
      type,
      resetFields,
      onDelete: () => sourceDataContext.deletePlan(data),
      closeForm,
    });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (findDuplicateName(sourceData.plans, name, id)) {
      setNameError("A plan with this name already exists.");
      return;
    }
    setNameError(undefined);

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
      headerAction={headerAction}
    >
      {!isEditing ? (
        <div className="flex flex-col gap-4">
          <DetailField label="Plan name" value={name} />
          <DetailField
            label="Start date"
            value={startDate?.isValid() ? startDate.format("MMM D, YYYY") : undefined}
          />
          <DetailField label="Number of weeks" value={numberOfWeeks} />
          <DetailField label="Baseline set" value={baselineSet} />
          <DetailField label="Baseline rep" value={baselineRep} />
          <DetailField label="Baseline time" value={baselineTime} />
          <DetailField label="Selected sessions" tags={sessions} />
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <ConfirmDeleteButton onDelete={handleDelete} />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={`flex flex-col gap-4`}>
          <Input
            label={"Plan name"}
            required
            value={name}
            placeholder={"Plan name"}
            error={nameError}
            changeValue={setName}
          />

          <DateInput
            label={"Start date"}
            value={startDate}
            placeholder={"Start date"}
            changeValue={setStartDate}
          />

          <IncrementDecrement
            label={"Number of weeks"}
            value={Number(numberOfWeeks) || 0}
            nonZero
            fullWidth
            updateValue={(v) => setNumberOfWeeks(String(v))}
          />

          <IncrementDecrement
            label={"Baseline set"}
            value={Number(baselineSet) || 0}
            nonZero
            fullWidth
            updateValue={(v) => setBaselineSet(String(v))}
          />

          <IncrementDecrement
            label={"Baseline Rep"}
            value={Number(baselineRep) || 0}
            nonZero
            fullWidth
            updateValue={(v) => setBaselineRep(String(v))}
          />

          <IncrementDecrement
            label={"Baseline Time"}
            value={Number(baselineTime) || 0}
            unit={"s"}
            nonZero
            fullWidth
            updateValue={(v) => setBaselineTime(String(v))}
          />

          <ReorderableSelect
            label={"Selected sessions"}
            selected={sessions}
            options={Object.keys(sourceData.sessions ?? {})}
            onChange={setSessions}
            placeholder="Select a session to add"
            emptyMessage="No sessions added yet"
          />

          <FormButtons onCancel={handleCancel} onDelete={type === "edit" ? handleDelete : undefined} />
        </form>
      )}
    </Modal>
  );
};
