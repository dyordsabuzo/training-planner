import { toStringArray } from "../common/utils";

// Resolves a session's superset names (and each superset's exercise names)
// against sourceData into the enriched, runnable shape ExercisePage expects.
// Shared by the real training flow (SessionPage.selectSession), the
// Manage > Sessions "simulate" flow (SimulateSessionPage, no plan/week seed
// values to carry over), and shareable-link snapshot generation (SessionForm,
// where the session being saved may not exist in sourceData yet/as-is).
// Takes the superset name list directly rather than looking it up via
// sourceData.sessions[session], since the caller may be resolving against
// in-progress form state that hasn't been persisted yet.

// A session's exercise group: exercises performed together, with its own
// targets. measure picks reps or a distance in metres (older groups without
// it count as reps). percent is % of each exercise's reference weight
// (0 = unset); rpe is informational (0 = unset).
export type SessionGroup = {
  // Stable identity for rendering; not used for saved data.
  id?: string;
  name: string;
  exercises: string[];
  sets: number;
  reps: number;
  measure?: "reps" | "distance" | "time";
  distance?: number;
  // Seconds held/performed for, when measure is "time" (e.g. a plank).
  time?: number;
  percent: number;
  rpe: number;
  // Rest between sets, in seconds (0 = not set).
  rest?: number;
  // Done on left and right separately (e.g. single-arm rows); off for
  // exercises done together, such as lunges or deadlifts.
  leftRight?: boolean;
  // Rest between the left and right sides, in seconds. Informational only —
  // shown as a note during training, not a running timer (see leftRight).
  sideRest?: number;
};

export const sideLabel = (leftRight?: boolean) => (leftRight ? "Left & right" : null);

// What a runnable unit came from, so screens can name it correctly.
export type UnitKind = "superset" | "group";

// Lower-case noun for a unit, e.g. "superset" or "exercise group".
export const unitName = (kind?: UnitKind) => (kind === "group" ? "exercise group" : "superset");

// Capitalised label for spoken and on-screen announcements.
export const unitTitle = (kind?: UnitKind) => (kind === "group" ? "Exercise group" : "Superset");

export const pluralUnit = (kind: UnitKind | undefined, count: number) =>
  `${count} ${unitName(kind)}${count === 1 ? "" : "s"}`;

export type ResolveSeed = {
  targetRep?: any;
  targetSet?: any;
  annotation?: any;
  // Plan cycle hook: maps an exercise's stored weight to this week's weight.
  weightFor?: (exerciseName: string, currentWeight: number) => number;
  // Weight that % targets are taken from (e.g. last logged weight).
  referenceWeight?: (exerciseName: string) => number | undefined;
};

export const resolveSessionSupersets = (
  sourceData: any,
  supersetNames: string[],
  seed: ResolveSeed = {}
) => {
  let supersets: Record<string, any> = {};

  supersetNames.forEach((s: string) => {
    let { targetRep, targetSet, annotation } = seed;
    let { sessions, rest, tags, ...superset } = sourceData.supersets[s];
    let exercises = superset.exercises
      .filter((e: string) => sourceData.exercises[e])
      .map((e: string) => {
        const exercise = sourceData.exercises[e];
        const currentWeight = exercise.targetWeight || 0;
        return {
          exercise,
          targetWeight: seed.weightFor ? seed.weightFor(e, currentWeight) : currentWeight,
        };
      });

    if (exercises.length < 2) {
      exercises.push({});
    }

    if (superset.targetRep) {
      targetRep = superset.targetRep;
    }
    if (superset.targetSet) {
      targetSet = superset.targetSet;
    }

    supersets = {
      ...supersets,
      [superset.name]: {
        ...superset,
        kind: "superset",
        exercises,
        ...(targetRep !== undefined && { targetRep }),
        ...(targetSet !== undefined && { targetSet }),
        ...(annotation !== undefined && { annotation }),
        ...(rest !== undefined && { rest }),
      },
    };
  });

  return supersets;
};

// Turns each group into a runnable unit keyed by group name. Exercises that no
// longer exist are skipped, so a deleted exercise doesn't break the session.
// Unique identity per group within a session: its name, or "name #2", "name #3"
// for repeats. Supersets keep their names, so groups avoid those too. Display
// always uses the plain name; keys are only for identity.
export const groupKeys = (supersets: string[], groups: SessionGroup[]) => {
  const used = new Set(supersets);
  const counts: Record<string, number> = {};
  return groups.map((group) => {
    let key = group.name;
    while (used.has(key)) {
      counts[group.name] = (counts[group.name] ?? 1) + 1;
      key = `${group.name} #${counts[group.name]}`;
    }
    used.add(key);
    return key;
  });
};

// Plain name shown to the user for a unit key.
export const displayUnitName = (key: string) => key.replace(/ #\d+$/, "");

// Identity of a runnable unit, as used for saved data and lookups.
export const unitId = (unit: any) => unit?.key ?? unit?.name;

export const resolveSessionGroups = (
  sourceData: any,
  groups: SessionGroup[],
  seed: ResolveSeed = {},
  keys: string[] = groups.map((group) => group.name)
) => {
  let units: Record<string, any> = {};

  groups.forEach((group, index) => {
    const exercises = group.exercises
      .filter((e) => sourceData.exercises?.[e])
      .map((e) => {
        const exercise = sourceData.exercises[e];
        const stored = exercise.targetWeight || 0;
        let targetWeight = seed.weightFor ? seed.weightFor(e, stored) : stored;
        if (group.percent) {
          const reference = seed.referenceWeight?.(e) || stored;
          targetWeight = Math.round(reference * group.percent) / 100;
        }
        return { exercise, targetWeight };
      });

    units = {
      ...units,
      [keys[index]]: {
        name: group.name,
        key: keys[index],
        kind: "group",
        exercises,
        type: group.measure === "time" ? "Time-based" : "Rep-based",
        ...(group.measure === "time"
          ? { targetTime: group.time || 0 }
          : group.measure === "distance"
            ? { targetDistance: group.distance || 0 }
            : { targetRep: group.reps || seed.targetRep }),
        targetSet: group.sets || seed.targetSet,
        leftRight: !!group.leftRight,
        sideRest: group.sideRest || 0,
        annotation: group.rpe ? `RPE ${group.rpe}` : seed.annotation,
        ...(group.rest ? { rest: group.rest } : {}),
      },
    };
  });

  return units;
};

// Entry point for any session. Supersets run first, then exercise groups.
export const resolveSession = (sourceData: any, session: any, seed: ResolveSeed = {}) => {
  const supersets = toStringArray(session?.supersets);
  const groups: SessionGroup[] = session?.groups ?? [];
  return {
    ...resolveSessionSupersets(sourceData, supersets, seed),
    ...resolveSessionGroups(sourceData, groups, seed, groupKeys(supersets, groups)),
  };
};

// Plain names of the units a session runs, in order (supersets, then groups).
export const sessionUnitNames = (session: any): string[] => [
  ...toStringArray(session?.supersets),
  ...(session?.groups ?? []).map((g: SessionGroup) => g.name),
];

// Identity keys of the units, in the same order (used for saved data and sharing).
export const sessionUnitKeys = (session: any): string[] => {
  const supersets = toStringArray(session?.supersets);
  const groups: SessionGroup[] = session?.groups ?? [];
  return [...supersets, ...groupKeys(supersets, groups)];
};

export type SessionOrder = {
  units: string[];
  exercises: Record<string, string[]>;
  // Planned sets per unit (0 = not set).
  sets: Record<string, number>;
};

// The session's current unit and exercise order. Saved runs don't keep a
// reliable order, so history is arranged with this instead.
export const sessionOrder = (session: any, sourceData: any): SessionOrder => {
  const exercises: Record<string, string[]> = {};
  const sets: Record<string, number> = {};
  toStringArray(session?.supersets).forEach((name) => {
    exercises[name] = toStringArray(sourceData?.supersets?.[name]?.exercises);
    sets[name] = Number(sourceData?.supersets?.[name]?.targetSet) || 0;
  });
  const groups: SessionGroup[] = session?.groups ?? [];
  groupKeys(toStringArray(session?.supersets), groups).forEach((key, index) => {
    exercises[key] = [...groups[index].exercises];
    sets[key] = groups[index].sets || 0;
  });
  return { units: sessionUnitKeys(session), exercises, sets };
};
