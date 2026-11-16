import { Content } from "./sharing";

// Pure helpers for the signed-out landing page's catalog of public sessions
// and plans. No Firebase imports, so the app's vitest run covers them
// (publicCatalog.test.ts). Only the fields picked here leave the server, so
// nothing private on an item or what it uses gets out (as in
// src/common/publicPlans.ts).

type Doc = Record<string, any>;

export const CATALOG = ["sessions", "plans"] as const;
export type CatalogContent = (typeof CATALOG)[number];

const list = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && !!v)
    : typeof value === "string" && value
      ? value.split(",")
      : [];

const WEEK_FIELDS = ["targetRep", "targetSet", "targetTime", "annotation"];

const pick = (source: Doc | undefined, fields: string[]) =>
  Object.fromEntries(
    fields.filter((f) => source?.[f] !== undefined && source[f] !== null && source[f] !== "").map((f) => [f, source![f]])
  );

// Listed on the landing page: public, live and not taken down.
export const isPubliclyListed = (data: Doc | undefined) =>
  !!data &&
  data.visibility === "public" &&
  !data.personalisedFor &&
  !data.archived &&
  data.moderation?.blocked !== true;

const weekOrder = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

// Card counts: weeks and sessions for a plan, exercises for a session
// (`supersetExercises` maps superset id -> its exercise ids).
export const summaryOf = (collection: CatalogContent, data: Doc, supersetExercises: Map<string, string[]>) => {
  if (collection === "plans") {
    return { weeks: data.open ? 0 : Object.keys(data.weeks ?? {}).length, sessions: list(data.sessions).length };
  }
  const ids = [
    ...list(data.supersets).flatMap((id) => supersetExercises.get(id) ?? []),
    ...(Array.isArray(data.groups) ? data.groups : []).flatMap((g: any) => list(g?.exercises)),
  ];
  return { exercises: new Set(ids).size };
};

export type PreviewUnit = {
  name: string;
  exercises: string[];
  sets?: number;
  reps?: number | string;
  time?: number;
  distance?: number;
};

const num = (value: unknown) => {
  const n = typeof value === "number" ? value : parseInt(String(value));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const clean = (unit: PreviewUnit): PreviewUnit =>
  Object.fromEntries(Object.entries(unit).filter(([, v]) => v !== undefined)) as PreviewUnit;

// `get` looks up a loaded doc by collection and id (undefined if missing).
type Get = (collection: Content, id: string) => Doc | undefined;

const exerciseNames = (ids: unknown, get: Get) =>
  list(ids)
    .map((id) => get("exercises", id)?.name)
    .filter((name): name is string => typeof name === "string" && !!name);

const sessionUnits = (session: Doc, get: Get): PreviewUnit[] => {
  const supersets = list(session.supersets)
    .map((id) => get("supersets", id))
    .filter((s): s is Doc => !!s)
    .map((s) =>
      clean({
        name: String(s.name ?? ""),
        exercises: exerciseNames(s.exercises, get),
        sets: num(s.targetSet),
        reps: s.type === "Time-based" ? undefined : num(s.targetRep),
        time: s.type === "Time-based" ? num(s.targetTime) : undefined,
      })
    );
  const groups = (Array.isArray(session.groups) ? session.groups : []).map((g: any) => {
    const measured = g?.measured !== false;
    const measure = measured ? g?.measure : undefined;
    return clean({
      name: String(g?.name ?? ""),
      exercises: exerciseNames(g?.exercises, get),
      sets: num(g?.sets),
      reps: measure === "time" || measure === "distance" ? undefined : num(g?.reps),
      time: measure === "time" ? num(g?.time) : undefined,
      distance: measure === "distance" ? num(g?.distance) : undefined,
    });
  });
  return [...supersets, ...groups].filter((unit) => unit.exercises.length > 0);
};

const sessionPreview = (session: Doc, get: Get) => ({
  name: String(session.name ?? ""),
  units: sessionUnits(session, get),
});

// What the preview sheet shows: a session's units and exercises, or a
// plan's weeks (targets only) and sessions.
export const buildPreview = (collection: CatalogContent, root: Doc, get: Get) => {
  if (collection === "sessions") return { collection, ...sessionPreview(root, get) };
  const weeks = root.open
    ? []
    : Object.keys(root.weeks ?? {})
        .sort(weekOrder)
        .map((week) => ({ week, ...pick(root.weeks[week], WEEK_FIELDS) }));
  return {
    collection,
    name: String(root.name ?? ""),
    open: !!root.open,
    weeks,
    sessions: list(root.sessions)
      .map((id) => get("sessions", id))
      .filter((s): s is Doc => !!s)
      .map((s) => sessionPreview(s, get)),
  };
};
