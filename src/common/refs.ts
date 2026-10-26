import { SourceDbReferences, toStringArray } from "./collections";
import {
  displayUnitName,
  groupId,
  groupKeys,
  SessionGroup,
} from "../pages/resolveSessionSupersets";

// Firestore stores references between content (and the keys of logged
// progress) as doc IDS, so renames never orphan anything and identical names
// in different organisations can't collide. The UI still works with names:
// it reads a "name view" built here, and every write is translated back to
// ids here. Names stay unique within a collection (see nameValidation.ts),
// so the mapping is unambiguous.
//
// Both directions are tolerant: a reference that isn't a known id/name is
// passed through unchanged. That keeps pre-migration data (name references,
// see scripts/migrate-ids.ts) readable, and drops nothing that points at a
// deleted item.

// Collections keyed by name, each entity carrying its doc `id` (getFromDB).
export type Collections = {
  exercises?: Record<string, any>;
  supersets?: Record<string, any>;
  sessions?: Record<string, any>;
  plans?: Record<string, any>;
};

type ContentDb =
  | SourceDbReferences.EXERCISES
  | SourceDbReferences.SUPERSETS
  | SourceDbReferences.SESSIONS
  | SourceDbReferences.PLANS;

type MapRef = (target: ContentDb, ref: string) => string;

const { EXERCISES, SUPERSETS, SESSIONS, PLANS } = SourceDbReferences;

// Every field that references another entity, per collection.
const mapEntityRefs = (db: ContentDb, entity: any, mapRef: MapRef) => {
  if (!entity) return entity;
  const list = (value: unknown, target: ContentDb) =>
    toStringArray(value).map((ref) => mapRef(target, ref));
  const has = (field: string) => field in entity;

  switch (db) {
    case EXERCISES:
      return {
        ...entity,
        ...(has("supersets") && { supersets: list(entity.supersets, SUPERSETS) }),
        ...(has("alternatives") && { alternatives: list(entity.alternatives, EXERCISES) }),
      };
    case SUPERSETS:
      return {
        ...entity,
        ...(has("exercises") && { exercises: list(entity.exercises, EXERCISES) }),
        ...(has("sessions") && { sessions: list(entity.sessions, SESSIONS) }),
      };
    case SESSIONS:
      // sharedSnapshot/sharedOrder are a self-contained, already-resolved
      // copy for the public share page, so they're left as they are.
      return {
        ...entity,
        ...(has("supersets") && { supersets: list(entity.supersets, SUPERSETS) }),
        ...(Array.isArray(entity.groups) && {
          groups: entity.groups.map((group: any) => ({
            ...group,
            exercises: list(group.exercises, EXERCISES),
          })),
        }),
      };
    case PLANS:
      return {
        ...entity,
        ...(has("sessions") && { sessions: list(entity.sessions, SESSIONS) }),
      };
  }
};

const collectionOf = (collections: Collections, db: ContentDb) =>
  collections[db as keyof Collections] ?? {};

type Finder = (db: ContentDb, ref: string) => any;

// Finds an entity by a reference: its id, its current name, or a name it had
// before (previousNames) if no other entity has had it. Earlier names only
// matter for references saved before ids were used.
const entityFinder = (collections: Collections): Finder => {
  const index = Object.fromEntries(
    ([EXERCISES, SUPERSETS, SESSIONS, PLANS] as ContentDb[]).map((db) => {
      const byName = collectionOf(collections, db);
      const byId: Record<string, any> = {};
      const byPreviousName: Record<string, any> = {};
      Object.values(byName).forEach((entity: any) => {
        if (!entity?.id) return;
        byId[entity.id] = entity;
        (entity.previousNames ?? []).forEach((name: string) => {
          const seen = byPreviousName[name];
          byPreviousName[name] = seen === undefined || seen === entity ? entity : null;
        });
      });
      return [db, { byId, byName, byPreviousName }];
    })
  );
  return (db, ref) => {
    const { byId, byName, byPreviousName } = index[db];
    return byId[ref] ?? byName[ref] ?? byPreviousName[ref] ?? undefined;
  };
};

// Any reference -> its id, per collection.
export const idLookup = (collections: Collections) => {
  const find = entityFinder(collections);
  return (db: ContentDb, ref: string): string => find(db, ref)?.id ?? ref;
};

// Everything an item uses, so it can be shared along with it: plan ->
// sessions -> supersets and group exercises -> exercises -> alternatives.
// Back-links (superset.sessions, exercise.supersets) aren't dependencies.
// Works on stored or viewed collections; returns each dependency once.
export const dependenciesOf = (db: ContentDb, ref: string, collections: Collections) => {
  const find = entityFinder(collections);
  const root = find(db, ref);
  const found = new Map<string, { db: ContentDb; id: string; name: string }>();
  const visit = (target: ContentDb, ref: string) => {
    const entity = find(target, ref);
    const key = `${target}/${entity?.id}`;
    if (!entity?.id || entity === root || found.has(key)) return;
    found.set(key, { db: target, id: entity.id, name: entity.name });
    walk(target, entity);
  };
  const walk = (target: ContentDb, entity: any) => {
    const each = (value: unknown, next: ContentDb) =>
      toStringArray(value).forEach((ref) => visit(next, ref));
    switch (target) {
      case PLANS:
        return each(entity.sessions, SESSIONS);
      case SESSIONS:
        each(entity.supersets, SUPERSETS);
        (Array.isArray(entity.groups) ? entity.groups : []).forEach((group: any) =>
          each(group?.exercises, EXERCISES)
        );
        return;
      case SUPERSETS:
        return each(entity.exercises, EXERCISES);
      case EXERCISES:
        return each(entity.alternatives, EXERCISES);
    }
  };
  if (root) walk(db, root);
  return Array.from(found.values());
};

// A session's exercise groups with their unit keys (see groupKeys) and ids.
const sessionGroups = (session: any, find: Finder) => {
  const groups: SessionGroup[] = Array.isArray(session?.groups) ? session.groups : [];
  const supersets = toStringArray(session?.supersets).map(
    (ref) => find(SUPERSETS, ref)?.name ?? ref
  );
  const keys = groupKeys(supersets, groups);
  return groups.map((group, i) => ({ group, key: keys[i], id: groupId(group, keys[i]) }));
};

// The unit (superset or group) a logged run's key refers to, within its
// session: a group id, a group's unit key (or the key its id was derived
// from, or a name it had before), else a superset reference.
const findUnit = (find: Finder, sessionRef: string, unitRef: string) => {
  const groups = sessionGroups(find(SESSIONS, sessionRef), find);
  const renamed = groups.filter((g) =>
    g.group.previousNames?.includes(displayUnitName(unitRef))
  );
  const group =
    groups.find((g) => g.id === unitRef) ??
    groups.find((g) => g.key === unitRef) ??
    groups.find((g) => g.id === `key:${unitRef}`) ??
    (renamed.length === 1 ? renamed[0] : undefined);
  if (group) return { id: group.id, name: group.key };
  const superset = find(SUPERSETS, unitRef);
  return superset && { id: superset.id as string, name: superset.name as string };
};

// Records the names an entity (or group) had before its current one. Kept
// through saves that don't rename; renaming back drops that name.
const withPreviousNames = (previous: any, next: any) => {
  if (!previous || !next) return next;
  const names = [...(previous.previousNames ?? []), previous.name].filter(
    (name, i, all) => name && name !== next.name && all.indexOf(name) === i
  );
  return names.length ? { ...next, previousNames: names } : next;
};

// Stored collections (id references) -> the name view the UI reads.
export const contentView = (collections: Collections): Collections => {
  const find = entityFinder(collections);
  const toName = (db: ContentDb, ref: string) => find(db, ref)?.name ?? ref;
  const view = (db: ContentDb) =>
    Object.fromEntries(
      Object.entries(collectionOf(collections, db)).map(([key, entity]) => [
        key,
        mapEntityRefs(db, entity, toName),
      ])
    );
  return {
    exercises: collections.exercises && view(EXERCISES),
    supersets: collections.supersets && view(SUPERSETS),
    sessions: collections.sessions && view(SESSIONS),
    plans: collections.plans && view(PLANS),
  };
};

// An entity from the UI (name references) -> what's saved (id references).
// A rename is recorded in previousNames, and every session group gets a
// stable id (groupId).
export const toStoredEntity = (db: ContentDb, entity: any, collections: Collections) => {
  const find = entityFinder(collections);
  const previous = entity?.id ? find(db, entity.id) : undefined;
  const stored = withPreviousNames(
    previous,
    mapEntityRefs(db, entity, (target, ref) => find(target, ref)?.id ?? ref)
  );
  if (db !== SESSIONS || !Array.isArray(stored?.groups)) return stored;
  const before = sessionGroups(previous, find);
  const after = sessionGroups(entity, find);
  return {
    ...stored,
    groups: stored.groups.map((group: any, i: number) =>
      withPreviousNames(before.find((g) => g.id === after[i].id)?.group, {
        ...group,
        id: after[i].id,
      })
    ),
  };
};

// --- Logged progress (userdata/{uid}) ---
// Shape: plan -> week -> session -> { unit -> exercise -> set -> log, mood, meta }
// plus inProgress { plan, week, session, data: unit -> exercise -> ... }.
// Plan, session, unit (superset or group) and exercise keys are stored as ids.
// A unit is only meaningful within its session, so it's mapped with it.

const RUN_RESERVED = ["mood", "meta"];
const DOC_RESERVED = ["id", "inProgress"];

type KeyMaps = {
  plan: (key: string) => string;
  session: (key: string) => string;
  unit: (key: string, session: string) => string;
  exercise: (key: string) => string;
};

const isObject = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === "object" && !Array.isArray(value);

// Two keys can map to the same name (e.g. a run logged under the plan's name
// before migration and another under its id), so merge rather than overwrite.
const deepMerge = (a: any, b: any): any => {
  if (!isObject(a) || !isObject(b)) return b;
  const merged = { ...a };
  Object.entries(b).forEach(([key, value]) => {
    merged[key] = key in merged ? deepMerge(merged[key], value) : value;
  });
  return merged;
};

const mapKeys = (
  obj: any,
  mapKey: (key: string) => string,
  mapValue = (value: any, _key: string) => value
) => {
  const result: Record<string, any> = {};
  Object.entries(obj ?? {}).forEach(([key, value]) => {
    const mapped = mapKey(key);
    const next = mapValue(value, key);
    result[mapped] = mapped in result ? deepMerge(result[mapped], next) : next;
  });
  return result;
};

// unit -> exercise -> sets, as logged for one run (mood/meta untouched).
const mapLoggedRun = (run: any, keys: KeyMaps, session: string) => {
  const result: Record<string, any> = {};
  Object.entries(run ?? {}).forEach(([unit, value]) => {
    if (RUN_RESERVED.includes(unit)) {
      result[unit] = value;
      return;
    }
    const mapped = keys.unit(unit, session);
    const exercises = mapKeys(value, keys.exercise);
    result[mapped] = mapped in result ? deepMerge(result[mapped], exercises) : exercises;
  });
  return result;
};

const mapUserdata = (doc: any, keys: KeyMaps) => {
  if (!isObject(doc)) return doc;
  const result: Record<string, any> = {};
  Object.entries(doc).forEach(([key, value]) => {
    if (DOC_RESERVED.includes(key) || !isObject(value)) {
      result[key] = value;
      return;
    }
    const plan = keys.plan(key);
    const weeks = Object.fromEntries(
      Object.entries(value).map(([week, sessions]) => [
        week,
        mapKeys(sessions, keys.session, (run, session) => mapLoggedRun(run, keys, session)),
      ])
    );
    result[plan] = plan in result ? deepMerge(result[plan], weeks) : weeks;
  });
  if (isObject(doc.inProgress)) {
    const { plan, session, data } = doc.inProgress;
    result.inProgress = {
      ...doc.inProgress,
      ...(plan !== undefined && { plan: keys.plan(plan) }),
      ...(session !== undefined && { session: keys.session(session) }),
      ...(data !== undefined && { data: mapLoggedRun(data, keys, session) }),
    };
  }
  return result;
};

// --- Stored split by plan ---
// userdata/{uid} keeps inProgress; each plan's runs live in
// userdata/{uid}/plans/{planId} as { orgId, [week]: ... }, so a trainer of
// that org can read them (Firestore rules check orgId).
export const userdataPlansPath = (uid: string) => `userdata/${uid}/plans`;

// Root doc + plan docs -> the single-doc shape the rest of the app reads.
// Plan fields still on the root (before scripts/split-userdata.ts --cleanup)
// are ignored: plans come only from the plan docs of the active org.
export const assembleUserdata = (uid: string, root: any, planDocs: Record<string, any>) => ({
  ...Object.fromEntries(
    Object.entries(planDocs).map(([planId, { orgId, ...weeks }]) => [planId, weeks])
  ),
  id: uid,
  ...(isObject(root?.inProgress) && { inProgress: root.inProgress }),
});

// A single-doc userdata -> its plan entries (scripts/split-userdata.ts).
export const userdataPlans = (doc: any): Record<string, any> =>
  Object.fromEntries(
    Object.entries(doc ?? {}).filter(([key, value]) => !DOC_RESERVED.includes(key) && isObject(value))
  );

// Names saved with each run (meta.labels), so history can still name items
// that were deleted since, or plans the user no longer has access to.
const savedLabels = (doc: any): Record<string, string> => {
  const labels: Record<string, string> = {};
  Object.entries(doc ?? {}).forEach(([key, weeks]) => {
    if (DOC_RESERVED.includes(key) || !isObject(weeks)) return;
    Object.values(weeks).forEach((sessions: any) =>
      Object.values(sessions ?? {}).forEach((run: any) =>
        Object.assign(labels, run?.meta?.labels ?? {})
      )
    );
  });
  return labels;
};

// Stored progress (id keys) -> the name view the UI reads.
export const userdataView = (doc: any, collections: Collections) => {
  const find = entityFinder(collections);
  const labels = savedLabels(doc);
  const label = (db: ContentDb) => (key: string) => find(db, key)?.name ?? labels[key] ?? key;
  return mapUserdata(doc, {
    plan: label(PLANS),
    session: label(SESSIONS),
    unit: (key, session) => findUnit(find, session, key)?.name ?? labels[key] ?? key,
    exercise: label(EXERCISES),
  });
};

// Translators for writing progress: UI names -> stored ids.
export const progressKeys = (collections: Collections) => {
  const find = entityFinder(collections);
  const toId = idLookup(collections);
  const keys: KeyMaps = {
    plan: (name) => toId(PLANS, name),
    session: (name) => toId(SESSIONS, name),
    unit: (name, session) => findUnit(find, session, name)?.id ?? name,
    exercise: (name) => toId(EXERCISES, name),
  };
  return {
    ...keys,
    // unit -> exercise -> sets for one run of a session.
    run: (run: any, session: string) => mapLoggedRun(run, keys, session),
    // id -> name for everything a run references, saved as meta.labels.
    labels: (names: { plan: string; session: string; run: any }) => {
      const labels: Record<string, string> = {};
      const add = (id: string, name: string) => {
        if (id !== name) labels[id] = name;
      };
      add(keys.plan(names.plan), names.plan);
      add(keys.session(names.session), names.session);
      Object.entries(names.run ?? {})
        .filter(([unit]) => !RUN_RESERVED.includes(unit))
        .forEach(([unit, exercises]) => {
          add(keys.unit(unit, names.session), unit);
          Object.keys(exercises ?? {}).forEach((exercise) =>
            add(keys.exercise(exercise), exercise)
          );
        });
      return labels;
    },
  };
};

// A whole userdata doc with name keys -> id keys, recording each run's names
// as meta.labels (scripts/migrate-ids.ts). Already-migrated keys pass through.
export const toStoredUserdata = (doc: any, collections: Collections) => {
  if (!isObject(doc)) return doc;
  const keys = progressKeys(collections);
  const labelled = Object.fromEntries(
    Object.entries(doc).map(([plan, weeks]) => {
      if (DOC_RESERVED.includes(plan) || !isObject(weeks)) return [plan, weeks];
      return [
        plan,
        Object.fromEntries(
          Object.entries(weeks).map(([week, sessions]) => [
            week,
            Object.fromEntries(
              Object.entries(sessions ?? {}).map(([session, run]: [string, any]) => [
                session,
                isObject(run)
                  ? {
                      ...run,
                      meta: {
                        ...run.meta,
                        labels: { ...run.meta?.labels, ...keys.labels({ plan, session, run }) },
                      },
                    }
                  : run,
              ])
            ),
          ])
        ),
      ];
    })
  );
  return mapUserdata(labelled, keys);
};
