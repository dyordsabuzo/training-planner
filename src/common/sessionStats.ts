// Keys stored beside the exercise units of a run. They aren't units.
const RESERVED = ["mood", "meta"];

// Turns logged run data into a readable summary. Logged shape, per run:
// { [unitName]: { [exerciseName]: { [setNumber]: { targetRep, targetWeight, targetDistance } } } }
// Values are the targets recorded for each set, not separate actual results.

const num = (value: any): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
};

export type SetStat = { set: number; reps?: number; weight?: number; distance?: number };
export type ExerciseStat = { name: string; sets: SetStat[] };
export type UnitStat = { name: string; exercises: ExerciseStat[] };

const toSets = (sets: any): SetStat[] =>
  Object.entries(sets ?? {})
    .map(([set, value]: [string, any]) => ({
      set: Number(set),
      reps: num(value?.targetRep),
      weight: num(value?.targetWeight),
      distance: num(value?.targetDistance),
    }))
    .sort((a, b) => a.set - b.set);

// "100 kg × 5 reps", "400 m", or "5 reps" for bodyweight sets.
export const formatSet = (set: SetStat) => {
  if (set.distance) return `${set.distance} m`;
  const weight = set.weight ? `${set.weight} kg × ` : "";
  return `${weight}${set.reps ?? "—"} reps`;
};

// Position of a name in a configured list; unknown names go last.
const rank = (list: string[] | undefined, name: string) => {
  const index = list ? list.indexOf(name) : -1;
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

// Units and exercises follow the session's configured order when given.
export const summariseRun = (
  logged: any,
  order?: { units: string[]; exercises: Record<string, string[]> }
) => {
  const units: UnitStat[] = Object.entries(logged ?? {})
    .filter(([unit]) => !RESERVED.includes(unit))
    .map(([unit, exercises]: [string, any]) => ({
    name: unit,
    exercises: Object.entries(exercises ?? {})
      .filter(([exercise]) => !!exercise)
      .map(([exercise, sets]: [string, any]) => ({
        name: exercise,
        sets: toSets(sets),
      }))
      .sort((a, b) => rank(order?.exercises[unit], a.name) - rank(order?.exercises[unit], b.name)),
  }))
    .sort((a, b) => rank(order?.units, a.name) - rank(order?.units, b.name));

  const totals = { sets: 0, reps: 0, volume: 0, distance: 0 };
  units.forEach((unit) =>
    unit.exercises.forEach((exercise) =>
      exercise.sets.forEach((set) => {
        totals.sets += 1;
        totals.reps += set.reps ?? 0;
        totals.volume += (set.weight ?? 0) * (set.reps ?? 0);
        totals.distance += set.distance ?? 0;
      })
    )
  );
  totals.volume = Math.round(totals.volume);

  return { units, totals };
};

export type CompletedRun = { week: string; session: string; logged: any };

// Every finished session of a plan, newest week first.
export const completedRuns = (userdata: any, planName: string): CompletedRun[] =>
  Object.entries(userdata?.[planName] ?? {})
    .flatMap(([week, sessions]: [string, any]) =>
      Object.entries(sessions ?? {}).map(([session, logged]) => ({ week, session, logged }))
    )
    .sort((a, b) => b.week.localeCompare(a.week));

export type ExerciseOccurrence = {
  plan: string;
  week: string;
  session: string;
  unit: string;
  sets: SetStat[];
};

// Every logged session, across all plans, where an exercise was used.
export const exerciseOccurrences = (userdata: any, exerciseName: string): ExerciseOccurrence[] => {
  const occurrences: ExerciseOccurrence[] = [];
  Object.entries(userdata ?? {}).forEach(([plan, weeks]: [string, any]) => {
    // Skip the user's id and the in-progress slot; neither is plan data.
    if (!weeks || typeof weeks !== "object" || plan === "inProgress") return;
    Object.entries(weeks).forEach(([week, sessions]: [string, any]) =>
      Object.entries(sessions ?? {}).forEach(([session, units]: [string, any]) =>
        Object.entries(units ?? {})
          .filter(([unit]) => !RESERVED.includes(unit))
          .forEach(([unit, exercises]: [string, any]) => {
          const sets = exercises?.[exerciseName];
          if (sets) {
            occurrences.push({ plan, week, session, unit, sets: toSets(sets) });
          }
        })
      )
    );
  });
  return occurrences.sort((a, b) => b.week.localeCompare(a.week));
};

export type HistoryRun = CompletedRun & { plan: string; completedAt?: string };

const weekNumber = (key: string) => Number(key.split(" ")[1]) || 0;

// Every completed run across all plans, most recent first. Runs saved before
// dates were recorded have no completedAt and sort last.
export const historyRuns = (userdata: any): HistoryRun[] =>
  Object.entries(userdata ?? {})
    .filter(([plan, weeks]: [string, any]) => weeks && typeof weeks === "object" && plan !== "inProgress")
    .flatMap(([plan, weeks]: [string, any]) =>
      Object.entries(weeks).flatMap(([week, sessions]: [string, any]) =>
        Object.entries(sessions ?? {}).map(([session, logged]: [string, any]) => ({
          plan,
          week,
          session,
          logged,
          completedAt: logged?.meta?.completedAt,
        }))
      )
    )
    .sort(
      (a, b) =>
        (b.completedAt ?? "").localeCompare(a.completedAt ?? "") ||
        a.plan.localeCompare(b.plan) ||
        weekNumber(b.week) - weekNumber(a.week)
    );

// Differences between a run's top values and an earlier run of the same
// exercise, as readable lines. Empty when there's nothing to compare against.
export const progressVsPrevious = (current: SetStat[], previous?: SetStat[]) => {
  if (!previous || previous.length === 0) return [];
  const top = (sets: SetStat[], key: "weight" | "reps" | "distance") =>
    Math.max(0, ...sets.map((s) => s[key] ?? 0));

  const changes: string[] = [];
  const weight = [top(previous, "weight"), top(current, "weight")];
  if (weight[1] > weight[0]) {
    changes.push(`Weight increased from ${weight[0]} kg to ${weight[1]} kg`);
  }
  const reps = [top(previous, "reps"), top(current, "reps")];
  if (reps[1] > reps[0]) {
    changes.push(`Reps increased from ${reps[0]} to ${reps[1]}`);
  }
  const distance = [top(previous, "distance"), top(current, "distance")];
  if (distance[1] > distance[0]) {
    changes.push(`Distance increased from ${distance[0]} m to ${distance[1]} m`);
  }
  return changes;
};
