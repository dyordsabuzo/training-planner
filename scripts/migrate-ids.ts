// One-off migration: content references and logged progress keys from names
// to doc ids (multi-tenant plan, Phase 1), giving every session group a
// stable id that its progress is keyed by. Safe to re-run: anything already
// migrated passes through unchanged.
//
//   Emulator:   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx tsx scripts/migrate-ids.ts [--apply]
//   Production: npx tsx scripts/migrate-ids.ts [--apply]   (needs ADC credentials)
//
// Always writes a JSON backup of every affected collection first.
import { mkdirSync, writeFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { SourceDbReferences } from "../src/common/collections";
import { Collections, toStoredEntity, toStoredUserdata } from "../src/common/refs";
import { db, isDryRun, logTarget } from "./lib/admin";

const CONTENT = [
  SourceDbReferences.EXERCISES,
  SourceDbReferences.SUPERSETS,
  SourceDbReferences.SESSIONS,
  SourceDbReferences.PLANS,
] as const;

type Doc = { id: string; data: Record<string, any> };

const readAll = async (name: string): Promise<Doc[]> =>
  (await db.collection(name).get()).docs.map((doc) => ({ id: doc.id, data: doc.data() }));

// Same shape the app's getFromDB builds: keyed by name, with the doc id.
const keyedByName = (docs: Doc[]) =>
  Object.fromEntries(docs.map(({ id, data }) => [data.name ?? id, { ...data, id }]));

const main = async () => {
  logTarget("migrate-ids");

  const content = Object.fromEntries(
    await Promise.all(CONTENT.map(async (name) => [name, await readAll(name)] as const))
  ) as Record<(typeof CONTENT)[number], Doc[]>;
  const userdata = await readAll(SourceDbReferences.USERDATA);

  const backupDir = "scripts/backups";
  mkdirSync(backupDir, { recursive: true });
  const backupFile = `${backupDir}/migrate-ids-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(backupFile, JSON.stringify({ ...content, userdata }, null, 2));
  console.log(`Backup written to ${backupFile}`);

  const collections: Collections = {
    exercises: keyedByName(content.exercises),
    supersets: keyedByName(content.supersets),
    sessions: keyedByName(content.sessions),
    plans: keyedByName(content.plans),
  };

  const writer = db.bulkWriter();
  let changed = 0;

  for (const name of CONTENT) {
    let count = 0;
    for (const { id, data } of content[name]) {
      const next = toStoredEntity(name, data, collections);
      if (isDeepStrictEqual(next, data)) continue;
      count += 1;
      if (!isDryRun) writer.set(db.collection(name).doc(id), next);
    }
    console.log(`${name}: ${count} of ${content[name].length} docs to update`);
    changed += count;
  }

  let userdataCount = 0;
  for (const { id, data } of userdata) {
    const next = toStoredUserdata(data, collections);
    if (isDeepStrictEqual(next, data)) continue;
    userdataCount += 1;
    // Replaced whole: the old name keys must go, not be merged with.
    if (!isDryRun) writer.set(db.collection(SourceDbReferences.USERDATA).doc(id), next);
  }
  console.log(`userdata: ${userdataCount} of ${userdata.length} docs to update`);
  changed += userdataCount;

  await writer.close();
  console.log(isDryRun ? `Dry run: ${changed} docs would change.` : `Updated ${changed} docs.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
