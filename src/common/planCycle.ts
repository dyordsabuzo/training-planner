// A plan's "cycle" is an ordered list of steps describing how each week's
// targets change relative to the previous week, e.g. baseline -> heavier ->
// more reps -> more sets -> deload. It repeats to fill the plan's weeks.
export type CycleStepType =
  | "baseline"
  | "increaseWeight"
  | "addRep"
  | "addSet"
  | "deload";

export type CycleStep = { type: CycleStepType; amount?: number };

// How a week's training weight is derived; resolved against the last weight
// logged for each exercise when a session is started (see getWeightForRule).
export type WeightRule = {
  mode: "define" | "increase" | "hold";
  amount?: number;
};

export const CYCLE_STEP_LABELS: Record<CycleStepType, string> = {
  baseline: "Baseline (define weight & capacity)",
  increaseWeight: "Increase weight",
  addRep: "Add reps",
  addSet: "Add sets",
  deload: "Deload (baseline set & rep, same weight)",
};

export const CYCLE_STEP_UNITS: Partial<Record<CycleStepType, string>> = {
  increaseWeight: "kg",
  addRep: "reps",
  addSet: "sets",
};

export const DEFAULT_WEIGHT_INCREASE = 5;

export const EXAMPLE_CYCLE: CycleStep[] = [
  { type: "baseline" },
  { type: "increaseWeight", amount: DEFAULT_WEIGHT_INCREASE },
  { type: "addRep", amount: 1 },
  { type: "addSet", amount: 1 },
  { type: "deload" },
];

export const describeCycleStep = ({ type, amount }: CycleStep): string => {
  switch (type) {
    case "baseline":
      return "Baseline: define weight and capacity";
    case "increaseWeight":
      return `Increase weight by ${amount ?? 0} kg`;
    case "addRep":
      return `Add ${amount ?? 0} rep${amount === 1 ? "" : "s"}`;
    case "addSet":
      return `Add ${amount ?? 0} set${amount === 1 ? "" : "s"}`;
    case "deload":
      return "Deload: baseline set and rep, same weight as last week";
  }
};

const toNumber = (value: any) => Number(value) || 0;

// Computes the targets for week `weekIndex` (0-based). Steps build on the
// previous week (reps/sets accumulate) until a baseline or deload step
// resets set/rep/time to the plan's baseline. Returns null without a cycle.
export const computeCycleWeek = (plan: any, weekIndex: number) => {
  const cycle: CycleStep[] = plan?.cycle ?? [];
  if (cycle.length === 0) {
    return null;
  }

  const baseline = {
    targetSet: toNumber(plan.baselineSet),
    targetRep: toNumber(plan.baselineRep),
    targetTime: toNumber(plan.baselineTime),
  };

  let current = { ...baseline };
  let step = cycle[0];
  for (let i = 0; i <= weekIndex; i++) {
    step = cycle[i % cycle.length];
    if (step.type === "baseline" || step.type === "deload") {
      current = { ...baseline };
    } else if (step.type === "addRep") {
      current = { ...current, targetRep: current.targetRep + toNumber(step.amount) };
    } else if (step.type === "addSet") {
      current = { ...current, targetSet: current.targetSet + toNumber(step.amount) };
    }
  }

  const weightRule: WeightRule =
    step.type === "baseline"
      ? { mode: "define" }
      : step.type === "increaseWeight"
        ? { mode: "increase", amount: toNumber(step.amount) }
        : { mode: "hold" };

  return {
    weekNumber: weekIndex,
    ...current,
    annotation: describeCycleStep(step),
    cycleStep: step,
    weightRule,
  };
};

// Week entry for a new week: cycle-driven when the plan has a cycle,
// otherwise the plan's baseline targets (the original behaviour).
export const buildWeek = (plan: any, weekIndex: number) =>
  computeCycleWeek(plan, weekIndex) ?? {
    weekNumber: weekIndex,
    targetRep: plan.baselineRep,
    targetSet: plan.baselineSet,
    targetTime: plan.baselineTime,
    annotation: "",
  };

// Week key used by open plans (no weeks); its runs are logged under it.
export const OPEN_WEEK = "Open";

const weekNumberOf = (key: string) => Number(key.split(" ")[1]) || 0;

// Latest positive weight logged for an exercise in weeks before `weekKey`.
// userdata shape: plan -> week -> session -> superset -> exercise -> set -> log.
export const getLastLoggedWeight = (
  userdata: any,
  planName: string,
  weekKey: string,
  exerciseName: string
): number | null => {
  const planLogs = userdata?.[planName];
  if (!planLogs) return null;

  const priorWeeks = Object.keys(planLogs)
    .filter((key) => weekKey === OPEN_WEEK || weekNumberOf(key) < weekNumberOf(weekKey))
    .sort((a, b) => weekNumberOf(b) - weekNumberOf(a));

  for (const week of priorWeeks) {
    let found: number | null = null;
    Object.values<any>(planLogs[week] ?? {}).forEach((session) => {
      Object.values<any>(session ?? {}).forEach((superset) => {
        const sets = superset?.[exerciseName];
        if (!sets) return;
        Object.keys(sets)
          .sort((a, b) => Number(a) - Number(b))
          .forEach((setKey) => {
            const weight = Number(sets[setKey]?.targetWeight);
            if (weight > 0) found = weight;
          });
      });
    });
    if (found !== null) return found;
  }
  return null;
};

export const getWeightForRule = (
  rule: WeightRule | undefined,
  lastWeight: number | null,
  currentWeight: number
): number => {
  const base = lastWeight ?? currentWeight;
  switch (rule?.mode) {
    case "increase":
      return Math.round((base + toNumber(rule.amount)) * 100) / 100;
    case "hold":
      return base;
    default:
      return currentWeight;
  }
};
