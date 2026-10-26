import { createHash } from "node:crypto";

// Pure helpers for sharing library items between orgs (Phase 4): who an item
// is shared with, what it depends on, and how a copy is remapped. No Firebase
// imports, so the app's vitest run covers them (sharing.test.ts).

export const CONTENT = ["exercises", "supersets", "sessions", "plans"] as const;
export type Content = (typeof CONTENT)[number];
export type Ref = { collection: Content; id: string };
type Doc = Record<string, any>;

const list = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && !!v)
    : typeof value === "string" && value
      ? value.split(",")
      : [];

// Readable by another org: public, or shared with that org. A plan
// personalised for a client never is (the rules enforce the same).
export const isSharedWith = (data: Doc | undefined, orgId: string) =>
  !!data &&
  !data.personalisedFor &&
  (data.visibility === "public" ||
    (data.visibility === "orgs" && list(data.sharedWithOrgIds).includes(orgId)));

// Offered to another org (Library, new copies and links): shared with it and
// not archived. An archived item stays readable for orgs already linking it.
export const isOfferedTo = (data: Doc | undefined, orgId: string) => isSharedWith(data, orgId) && !data?.archived;

// Only these can be linked; plans are assigned to clients by id, so another
// org's plan can't be. Plans are copied instead.
export const LINKABLE = ["exercises", "supersets", "sessions"] as const;

// What an item uses, copied along with it: plan -> sessions -> supersets and
// group exercises -> exercises -> alternatives. Mirrors dependenciesOf in
// src/common/refs.ts (the app's copy, which this can't import).
export const dependencyRefs = (collection: Content, data: Doc): Ref[] => {
  const refs = (value: unknown, target: Content) => list(value).map((id) => ({ collection: target, id }));
  switch (collection) {
    case "plans":
      return refs(data.sessions, "sessions");
    case "sessions":
      return [
        ...refs(data.supersets, "supersets"),
        ...(Array.isArray(data.groups) ? data.groups : []).flatMap((g: any) => refs(g?.exercises, "exercises")),
      ];
    case "supersets":
      return refs(data.exercises, "exercises");
    case "exercises":
      return refs(data.alternatives, "exercises");
  }
};

// The id of a copy of (srcOrgId, id) in another org. Deterministic, so a
// repeated copy finds what an earlier one created (and, in 4c, a link and
// its "convert to copy" share the id). Hashed if it would be too long.
export const copyId = (srcOrgId: string, id: string) => {
  const plain = `x_${srcOrgId}_${id}`;
  return plain.length <= 128
    ? plain
    : `x_h_${createHash("sha1").update(`${srcOrgId}/${id}`).digest("hex")}`;
};

// Fields that belong to the source item, not to a copy of it.
const NOT_COPIED = [
  "id",
  "previousNames",
  "isShareable",
  "sharedSnapshot",
  "sharedOrder",
  "visibility",
  "sharedWithOrgIds",
  "sharedWithOrgs",
  "personalisedFor",
  "archived",
  "linkCount",
  "source",
];

// Back-links the app keeps in step with the forward references
// (exercise.supersets <-> superset.exercises, superset.sessions <->
// session.supersets). A copy keeps only those inside the copied set.
export const BACK_LINKS: Partial<Record<Content, { field: string; target: Content }>> = {
  exercises: { field: "supersets", target: "supersets" },
  supersets: { field: "sessions", target: "sessions" },
};

// A source doc -> its copy: references remapped with `idOf` (undefined drops
// the reference, e.g. one to a deleted item), source fields stripped.
export const remapForCopy = (
  collection: Content,
  data: Doc,
  idOf: (target: Content, id: string) => string | undefined
): Doc => {
  const copy: Doc = Object.fromEntries(Object.entries(data).filter(([key]) => !NOT_COPIED.includes(key)));
  const map = (value: unknown, target: Content) =>
    list(value)
      .map((id) => idOf(target, id))
      .filter((id): id is string => !!id);
  const has = (field: string) => field in data;

  switch (collection) {
    case "plans":
      if (has("sessions")) copy.sessions = map(data.sessions, "sessions");
      break;
    case "sessions":
      if (has("supersets")) copy.supersets = map(data.supersets, "supersets");
      if (Array.isArray(data.groups)) {
        copy.groups = data.groups.map((g: any) => ({ ...g, exercises: map(g?.exercises, "exercises") }));
      }
      break;
    case "supersets":
      if (has("exercises")) copy.exercises = map(data.exercises, "exercises");
      break;
    case "exercises":
      if (has("alternatives")) copy.alternatives = map(data.alternatives, "exercises");
      break;
  }
  const back = BACK_LINKS[collection];
  if (back && has(back.field)) copy[back.field] = map(data[back.field], back.target);
  return copy;
};

// Keeps a copied item's name unless the org already uses it.
export const uniqueCopyName = (name: string, taken: Set<string>) => {
  if (!taken.has(name)) return name;
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? `${name} (copy)` : `${name} (copy ${n})`;
    if (!taken.has(candidate)) return candidate;
  }
};
