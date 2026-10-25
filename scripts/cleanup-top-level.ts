// One-off cleanup (multi-tenant plan, Phase 2c), run once the app reads only
// orgs/{orgId}/... and the rules no longer allow the old paths:
// - deletes the pre-org top-level exercises, supersets, sessions and plans
// - removes the legacy `role` and `plans` fields from users/{uid}
// - removes settings/app.contentVersion (now on the org doc)
//
// Refuses to delete a top-level doc that has no copy in the org, since
// that copy is the only thing left afterwards. Safe to re-run.
//
//   Emulator:   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx tsx scripts/cleanup-top-level.ts [--org-id=default] [--apply]
//   Production: GOOGLE_CLOUD_QUOTA_PROJECT=training-planner-387200 npx tsx scripts/cleanup-top-level.ts [--apply]
//
// Always writes a JSON backup of everything it removes first.
import { mkdirSync, writeFileSync } from "node:fs";
import { FieldValue } from "firebase-admin/firestore";
import { SourceDbReferences } from "../src/common/collections";
import { db, isDryRun, logTarget } from "./lib/admin";

const CONTENT = [
  SourceDbReferences.EXERCISES,
  SourceDbReferences.SUPERSETS,
  SourceDbReferences.SESSIONS,
  SourceDbReferences.PLANS,
] as const;

type Doc = { id: string; data: Record<string, any> };

const readAll = async (path: string): Promise<Doc[]> =>
  (await db.collection(path).get()).docs.map((doc) => ({ id: doc.id, data: doc.data() }));

const main = async () => {
  const orgId = process.argv.find((a) => a.startsWith("--org-id="))?.split("=")[1] ?? "default";
  logTarget("cleanup-top-level");

  const content = Object.fromEntries(
    await Promise.all(CONTENT.map(async (c) => [c, await readAll(c)] as const))
  ) as Record<(typeof CONTENT)[number], Doc[]>;
  const users = await readAll("users");
  const settings = (await db.doc("settings/app").get()).data() ?? {};

  const missing: string[] = [];
  for (const c of CONTENT) {
    const copied = new Set((await readAll(`orgs/${orgId}/${c}`)).map((d) => d.id));
    missing.push(...content[c].filter((d) => !copied.has(d.id)).map((d) => `${c}/${d.id}`));
  }
  if (missing.length) {
    throw new Error(`Not copied to orgs/${orgId}, nothing deleted: ${missing.join(", ")}`);
  }

  const backupDir = "scripts/backups";
  mkdirSync(backupDir, { recursive: true });
  const backupFile = `${backupDir}/cleanup-top-level-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(backupFile, JSON.stringify({ ...content, users, settings }, null, 2));
  console.log(`Backup written to ${backupFile}`);

  const writer = db.bulkWriter();
  let changed = 0;
  for (const c of CONTENT) {
    console.log(`${c}: ${content[c].length} docs to delete`);
    changed += content[c].length;
    if (!isDryRun) content[c].forEach((d) => writer.delete(db.collection(c).doc(d.id)));
  }

  const legacyUsers = users.filter((u) => "role" in u.data || "plans" in u.data);
  console.log(`users: ${legacyUsers.length} of ${users.length} docs to strip role/plans`);
  changed += legacyUsers.length;
  if (!isDryRun) {
    legacyUsers.forEach((u) =>
      writer.update(db.collection("users").doc(u.id), { role: FieldValue.delete(), plans: FieldValue.delete() })
    );
  }

  if ("contentVersion" in settings) {
    console.log("settings/app: contentVersion to remove");
    changed += 1;
    if (!isDryRun) writer.update(db.doc("settings/app"), { contentVersion: FieldValue.delete() });
  }

  await writer.close();
  console.log(isDryRun ? `Dry run: ${changed} docs would change.` : `Changed ${changed} docs.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
