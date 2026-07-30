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

  return updates;
};
