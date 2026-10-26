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

// "<name> (<suffix>)", or "<name> (<suffix> 2)" ... when that's taken.
const uniqueName = (name: string, suffix: string, taken: Set<string>) => {
  const lower = new Set(Array.from(taken).map((n) => n.trim().toLowerCase()));
  let candidate = `${name} (${suffix})`;
  for (let i = 2; lower.has(candidate.toLowerCase()); i++) candidate = `${name} (${suffix} ${i})`;
  taken.add(candidate);
  return candidate;
};

// Copies of a plan and its sessions for one client (name form, as the UI
// uses), so a trainer can tweak them without touching the library originals.
// Supersets and exercises stay shared. Share settings aren't copied.
export const personalisePlan = (
  plan: any,
  sessions: Record<string, any>,
  plans: Record<string, any>,
  client: { uid: string; name: string }
) => {
  const takenSessions = new Set(Object.keys(sessions ?? {}));
  const renamed: Record<string, string> = {};
  const sessionCopies = toStringArray(plan.sessions)
    .filter((name) => sessions?.[name])
    .map((name) => {
      const { id, previousNames, isShareable, sharedSnapshot, sharedOrder, ...session } = sessions[name];
      renamed[name] = uniqueName(name, client.name, takenSessions);
      return { ...session, name: renamed[name] };
    });
  const { id, previousNames, createdAt, ...rest } = plan;
  return {
    sessions: sessionCopies,
    plan: {
      ...rest,
      // A cached plan may hold a plain { seconds } object here (see clonePlan).
      ...(plan.startDate && { startDate: toDate(plan.startDate)?.toDate() }),
      name: uniqueName(plan.name, client.name, new Set(Object.keys(plans ?? {}))),
      sessions: toStringArray(plan.sessions).map((name) => renamed[name] ?? name),
      personalisedFor: client.uid,
    },
  };
};
