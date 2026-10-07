import { toStringArray } from "../common/utils";
import { toDate } from "../common/planWeek";

// "(copy)" payloads for the add form, shared by all listings' Clone action.
export const cloneExercise = (e: any) => ({
  name: `${e.name} (copy)`,
  videoLink: e.videoLink ?? "",
  tags: toStringArray(e.tags),
  targetRep: e.targetRep ?? "",
  targetSet: e.targetSet ?? "",
  rest: e.rest ?? "",
  supersets: toStringArray(e.supersets),
  alternatives: toStringArray(e.alternatives),
  targetWeight: 0,
  isWeightExercise: e.isWeightExercise ?? true,
});

export const cloneSuperset = (s: any, sessions: string[]) => ({
  name: `${s.name} (copy)`,
  sessions,
  exercises: toStringArray(s.exercises),
  tags: toStringArray(s.tags),
  rest: s.rest ?? "",
  type: s.type ?? "Rep-based",
  targetRep: s.targetRep ?? "",
  targetSet: s.targetSet ?? "",
  targetTime: s.targetTime ?? "",
});

export const cloneSession = (s: any) => ({
  name: `${s.name} (copy)`,
  tags: toStringArray(s.tags),
  supersets: toStringArray(s.supersets),
  groups: s.groups ?? [],
});

export const clonePlan = (p: any) => ({
  name: `${p.name} (copy)`,
  numberOfWeeks: p.numberOfWeeks ?? "1",
  startDate: toDate(p.startDate)?.toDate(),
  baselineSet: p.baselineSet ?? "",
  baselineRep: p.baselineRep ?? "",
  baselineTime: p.baselineTime ?? "",
  sessions: toStringArray(p.sessions),
  cycle: p.cycle ?? [],
  open: p.open ?? false,
});
