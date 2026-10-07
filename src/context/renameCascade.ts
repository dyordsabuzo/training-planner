import { SourceDbReferences } from "../common/utils";

type ReferenceRule = { collection: SourceDbReferences; field: string };

// Describes, for each entity type, which other collections/fields hold a
// string reference to its name that needs updating when it's renamed.
// Mirrors the same forward fields buildRelationshipGraph.ts already resolves.
const REFERENCE_MAP: Record<SourceDbReferences, ReferenceRule[]> = {
  [SourceDbReferences.EXERCISES]: [
    { collection: SourceDbReferences.EXERCISES, field: "alternatives" },
    { collection: SourceDbReferences.SUPERSETS, field: "exercises" },
  ],
  [SourceDbReferences.SUPERSETS]: [
    { collection: SourceDbReferences.EXERCISES, field: "supersets" },
    { collection: SourceDbReferences.SESSIONS, field: "supersets" },
  ],
  [SourceDbReferences.SESSIONS]: [
    { collection: SourceDbReferences.SUPERSETS, field: "sessions" },
    { collection: SourceDbReferences.PLANS, field: "sessions" },
  ],
  [SourceDbReferences.PLANS]: [],
  [SourceDbReferences.USERDATA]: [],
};

export type RenamedEntityUpdate = {
  collection: SourceDbReferences;
  entity: any;
};

export const getEntitiesNeedingRenameUpdate = (
  sourceData: any,
  type: SourceDbReferences,
  oldName: string,
  newName: string
): RenamedEntityUpdate[] => {
  if (!oldName || oldName === newName) {
    return [];
  }

  const rules = REFERENCE_MAP[type] ?? [];
  const updates: RenamedEntityUpdate[] = [];

  rules.forEach(({ collection, field }) => {
    const dict = sourceData?.[collection] ?? {};
    Object.values(dict).forEach((entity: any) => {
      const list: string[] = entity?.[field] ?? [];
      if (list.includes(oldName)) {
        updates.push({
          collection,
          entity: {
            ...entity,
            [field]: list.map((item) => (item === oldName ? newName : item)),
          },
        });
      }
    });
  });

  // Session groups hold exercise names inside an object array, so they need
  // their own pass; the plain field rules above can't reach them.
  if (type === SourceDbReferences.EXERCISES) {
    Object.values(sourceData?.[SourceDbReferences.SESSIONS] ?? {}).forEach((session: any) => {
      const groups: any[] = session?.groups ?? [];
      if (!groups.some((g) => (g.exercises ?? []).includes(oldName))) {
        return;
      }
      updates.push({
        collection: SourceDbReferences.SESSIONS,
        entity: {
          ...session,
          groups: groups.map((g) => ({
            ...g,
            exercises: (g.exercises ?? []).map((n: string) => (n === oldName ? newName : n)),
          })),
        },
      });
    });
  }

  return updates;
};
