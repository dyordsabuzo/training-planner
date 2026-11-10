import { z } from "zod";
import { resolveSession, setsOrDefault } from "../pages/resolveSessionSupersets";
import { toStringArray } from "./collections";
import { sortSessionsByDate } from "./planSessions";

// A public plan is a copy at orgs/{orgId}/publicPlans/{token}, readable by
// anyone holding the token. Only the fields listed here are ever copied, so
// nothing private on the plan, its sessions or its exercises gets out.
// rest and sideRest are left out: public runs have no rest timers.
const UNIT_FIELDS = [
  "name",
  "key",
  "kind",
  "type",
  "measured",
  "targetRep",
  "targetSet",
  "targetTime",
  "targetDistance",
  "leftRight",
  "tempo",
  "annotation",
];
const WEEK_FIELDS = ["targetRep", "targetSet", "targetTime", "annotation"];

const pick = (source: any, fields: string[]) =>
  Object.fromEntries(
    fields.filter((f) => source?.[f] !== undefined && source[f] !== null).map((f) => [f, source[f]])
  );

export const buildPublicPlan = (plan: any, sourceData: any, publishedAt: string) => {
  const alternatives: Record<string, any> = {};

  const publicExercise = ({ exercise, targetWeight }: any) => {
    const known = toStringArray(exercise.alternatives).filter((name) => sourceData.exercises?.[name]);
    known.forEach((name) => {
      alternatives[name] = pick(sourceData.exercises[name], ["name", "videoLink", "targetWeight"]);
    });
    return {
      exercise: { ...pick(exercise, ["name", "videoLink"]), ...(known.length > 0 && { alternatives: known }) },
      targetWeight: targetWeight ?? 0,
    };
  };

  const names = toStringArray(plan.sessions).filter((name) => sourceData.sessions?.[name]);
  const ordered = plan.open ? sortSessionsByDate(names, sourceData.sessions) : [...names].sort();
  const sessions = ordered
    .map((name) => ({
      name,
      // An array, because Firestore doesn't keep the order of map keys.
      units: Object.values(resolveSession(sourceData, sourceData.sessions[name]))
        .map((unit: any) => ({
          ...pick(unit, UNIT_FIELDS),
          exercises: unit.exercises.filter((item: any) => item.exercise).map(publicExercise),
        }))
        .filter((unit) => unit.exercises.length > 0),
    }))
    .filter((session) => session.units.length > 0);

  return {
    planId: plan.id,
    name: plan.name,
    open: !!plan.open,
    publishedAt,
    weeks: plan.open
      ? {}
      : Object.fromEntries(Object.entries(plan.weeks ?? {}).map(([week, data]) => [week, pick(data, WEEK_FIELDS)])),
    sessions,
    alternatives,
  };
};

// A single session goes public as a one-session open plan, so it shares the
// same copy, page and rules.
export const buildPublicSession = (session: any, sourceData: any, publishedAt: string) =>
  buildPublicPlan({ id: session.id, name: session.name, open: true, sessions: [session.name] }, sourceData, publishedAt);

const unitSchema = z
  .object({
    name: z.string(),
    exercises: z.array(z.object({ exercise: z.object({ name: z.string() }).passthrough() }).passthrough()),
  })
  .passthrough();

const sessionSchema = z.object({ name: z.string(), units: z.array(unitSchema).min(1) });

// What the public page accepts from Firestore.
export const publicPlanSchema = z.object({
  name: z.string(),
  open: z.boolean(),
  weeks: z.record(z.record(z.any())).default({}),
  sessions: z.array(sessionSchema),
  alternatives: z.record(z.any()).default({}),
});

export type PublicPlan = z.infer<typeof publicPlanSchema>;
export type PublicSession = z.infer<typeof sessionSchema>;

// The session in the shape the workout screens run. Week targets fill in
// whatever the unit doesn't set itself.
export const publicSessionData = (plan: PublicPlan, session: PublicSession, week?: string) => {
  const targets: any = (week && plan.weeks[week]) || {};
  return {
    session: session.name,
    ...(week && { week }),
    annotation: [targets.annotation, "Public workout — nothing is saved"].filter(Boolean).join(" · "),
    targetRep: targets.targetRep,
    targetTime: targets.targetTime,
    // Keyed by position: only order matters, and a unit named "1" would
    // otherwise sort ahead of the others.
    supersets: Object.fromEntries(
      session.units.map((unit: any, index) => [
        `unit-${index}`,
        { ...unit, targetSet: setsOrDefault(unit.targetSet ?? targets.targetSet) },
      ])
    ),
  };
};
