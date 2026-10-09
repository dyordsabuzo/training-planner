import React, { useContext, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import SourceDataContext from "../context/SourceDataContext";

import { FormButtons } from "./FormButtons";

import { findDuplicateName } from "../common/nameValidation";
import { toDate } from "../common/planWeek";
import { toStringArray } from "../common/utils";
import { CycleStep } from "../common/planCycle";
import { CycleEditor } from "./CycleEditor";
import { ButtonSelection } from "@dyordsabuzo/ui-components";

export const PLAN_STATUSES = ["Planned", "Active", "Completed", "Archived"];
import { IncrementDecrement, Input, ReorderableSelect, DateInput, Modal, Toggle } from "@dyordsabuzo/ui-components";

type Props = {
  data: any;
  type: string;
  closeForm: () => void;
};

export const PlanForm = ({ data, type, closeForm }: Props) => {
  const planData = data;

  const id = planData?.id;
  const [name, setName] = useState(planData?.name ?? "");
  const [nameError, setNameError] = useState<string>();
  // Open plans have no weeks, baselines, start date or cycle; sessions are
  // added and removed freely and ordered by their own dates.
  const [isOpen, setIsOpen] = useState<boolean>(!!planData?.open);
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

  const [cycle, setCycle] = useState<CycleStep[]>(planData?.cycle ?? []);
  const [isCycleBased, setIsCycleBased] = useState((planData?.cycle?.length ?? 0) > 0);
  const [cycleError, setCycleError] = useState<string>();
  // Shown and sorted by: creation date is editable; status is a label for the plan.
  // Older plans have no creation date. Leave it empty so saving doesn't stamp
  // today's date, which would wrongly move the plan to the top of the list.
  const [createdOn, setCreatedOn] = useState<Dayjs | null>(
    toDate(planData?.createdAt) ?? (type === "add" ? dayjs() : null)
  );
  const [status, setStatus] = useState<string>(planData?.status ?? "Active");

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const handleDelete = () => {
    sourceDataContext.deletePlan(data);
    closeForm();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (findDuplicateName(sourceData.plans, name, id)) {
      setNameError("A plan with this name already exists.");
      return;
    }
    setNameError(undefined);

    if (!isOpen && isCycleBased && cycle.length === 0) {
      setCycleError("Add at least one week to the cycle, or turn off cycle.");
      return;
    }
    setCycleError(undefined);

    const timing = isOpen
      ? {
          open: true,
          numberOfWeeks: "0",
          startDate: null,
          baselineSet: "",
          baselineRep: "",
          baselineTime: "",
          cycle: [],
        }
      : {
          open: false,
          numberOfWeeks: isCycleBased ? String(cycle.length) : numberOfWeeks,
          startDate: startDate?.toDate(),
          baselineSet,
          baselineRep,
          baselineTime,
          cycle: isCycleBased ? cycle : [],
        };
    const plan = {
      name,
      ...timing,
      sessions,
      status,
      ...(createdOn && { createdAt: createdOn.toDate().toISOString() }),
    };

    if (type === "add") {
      sourceDataContext.addPlan(plan);
      closeForm();
    }

    if (type === "edit") {
      sourceDataContext.editPlan({ id, ...plan });
      closeForm();
    }
  };

  return (
    <Modal
      title={type === "add" ? "Create plan" : "Plan"}
      isOpen={true}
      onClose={closeForm}
    >
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
            label={"Created on"}
            value={createdOn}
            placeholder={"Creation date"}
            changeValue={setCreatedOn}
          />

          <ButtonSelection
            label="Status"
            options={PLAN_STATUSES}
            selection={status}
            onSelect={setStatus}
          />

          <div className="flex flex-col gap-1">
            <Toggle
              label="Open plan?"
              labelDirection="row"
              value={isOpen}
              toggle={setIsOpen}
            />
            <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
              No fixed weeks. Add or remove sessions any time; each session's date sets its order.
            </span>
          </div>

          <ReorderableSelect
            label={"Selected sessions"}
            selected={sessions}
            options={Object.keys(sourceData.sessions ?? {})}
            onChange={setSessions}
            placeholder="Select a session to add"
            emptyMessage="No sessions added yet"
          />

          {!isOpen && (
            <>
              <DateInput
                label={"Start date"}
                value={startDate}
                placeholder={"Start date"}
                changeValue={setStartDate}
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

              <Toggle
                label="Cycle-based?"
                labelDirection="row"
                value={isCycleBased}
                toggle={setIsCycleBased}
              />

              {!isCycleBased && (
                <IncrementDecrement
                  label={"Number of weeks"}
                  value={Number(numberOfWeeks) || 0}
                  nonZero
                  fullWidth
                  updateValue={(v) => setNumberOfWeeks(String(v))}
                />
              )}

              {isCycleBased && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
                    Cycle
                  </span>
                  <CycleEditor value={cycle} onChange={setCycle} />
                  {cycleError && <span className="text-sm text-danger">{cycleError}</span>}
                </div>
              )}
            </>
          )}

          <FormButtons onCancel={closeForm} onDelete={type === "edit" ? handleDelete : undefined} />
        </form>
    </Modal>
  );
};
