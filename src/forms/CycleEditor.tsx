import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, IncrementDecrement, SingleSelect } from "@dyordsabuzo/ui-components";
import {
  CYCLE_STEP_LABELS,
  CYCLE_STEP_UNITS,
  CycleStep,
  CycleStepType,
  DEFAULT_WEIGHT_INCREASE,
  EXAMPLE_CYCLE,
} from "../common/planCycle";

type Props = {
  value: CycleStep[];
  onChange: (cycle: CycleStep[]) => void;
};

const stepTypes = Object.keys(CYCLE_STEP_LABELS) as CycleStepType[];
const labels = stepTypes.map((type) => CYCLE_STEP_LABELS[type]);

// Amount defaults when a step type is picked.
const defaultStep = (type: CycleStepType): CycleStep =>
  type === "increaseWeight"
    ? { type, amount: DEFAULT_WEIGHT_INCREASE }
    : CYCLE_STEP_UNITS[type]
      ? { type, amount: 1 }
      : { type };

// Edits the ordered list of weekly steps; each step is one week of the plan.
// New/added weeks follow it, existing weeks are kept.
export const CycleEditor = ({ value, onChange }: Props) => {
  const updateStep = (index: number, step: CycleStep) =>
    onChange(value.map((s, i) => (i === index ? step : s)));

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
        Each step defines one week, so the plan's number of weeks is the number
        of weeks added here. Applies to new weeks only; existing weeks aren't
        changed.
      </span>

      {value.map((step, index) => {
        const unit = CYCLE_STEP_UNITS[step.type];
        return (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-md border border-primary-200 dark:border-primary-700 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">Week {index + 1}</span>
              <button
                type="button"
                aria-label={`Remove week ${index + 1}`}
                title="Remove step"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="min-h-11 min-w-11 flex items-center justify-center rounded-full text-danger
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
            <SingleSelect
              options={labels}
              selected={CYCLE_STEP_LABELS[step.type]}
              onChange={(label) => {
                const type = stepTypes[labels.indexOf(label)];
                if (type) updateStep(index, defaultStep(type));
              }}
            />
            {unit && (
              <IncrementDecrement
                label="Amount"
                unit={unit}
                nonZero
                fullWidth
                value={step.amount ?? 0}
                updateValue={(amount) => updateStep(index, { ...step, amount })}
              />
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2">
        <Button
          label="Add week"
          className="text-xs"
          onClick={() => onChange([...value, { type: "baseline" }])}
        />
        <Button
          label="Use example cycle"
          className="text-xs"
          onClick={() => onChange(EXAMPLE_CYCLE)}
        />
        {value.length > 0 && (
          <Button label="Clear" decoration="cancel" onClick={() => onChange([])} />
        )}
      </div>
    </div>
  );
};
