// One-off migration (multi-tenant plan, Phase 2): puts the existing
// single-tenant data into one org. Content is copied, not moved, to
// orgs/{orgId}/... with the same doc ids; the top-level copies are removed
// in a later cleanup. Users become members (admin → owner/trainer, everyone
// else → client with their granted plans) and get the `orgs` custom claim;
// the owner also gets `superAdmin`. Safe to re-run: existing members are
// left alone and unchanged content is skipped.
//
//   Emulator:   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
//               npx tsx scripts/migrate-orgs.ts --org-id=<id> --name="<org name>" --owner=<uid> [--apply]
//   Production: npx tsx scripts/migrate-orgs.ts --org-id=<id> --name="<org name>" --owner=<uid> [--apply]
//
// Always writes a JSON backup of everything it reads first.
import { mkdirSync, writeFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { getAuth } from "firebase-admin/auth";
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

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

const main = async () => {
  const orgId = arg("org-id");
  const name = arg("name");
  const ownerUid = arg("owner");
  if (!orgId || !/^[A-Za-z0-9_-]+$/.test(orgId) || !name || !ownerUid) {
    throw new Error('Usage: migrate-orgs.ts --org-id=<id> --name="<org name>" --owner=<uid> [--apply]');
  }
  logTarget("migrate-orgs");

  const content = Object.fromEntries(
    await Promise.all(CONTENT.map(async (c) => [c, await readAll(c)] as const))
  ) as Record<(typeof CONTENT)[number], Doc[]>;
  const users = await readAll("users");
  const settings = (await db.doc("settings/app").get()).data() ?? {};
  if (!users.some((u) => u.id === ownerUid)) throw new Error(`No users/${ownerUid} doc for the owner.`);

  const backupDir = "scripts/backups";
  mkdirSync(backupDir, { recursive: true });
  const backupFile = `${backupDir}/migrate-orgs-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(backupFile, JSON.stringify({ ...content, users, settings }, null, 2));
  console.log(`Backup written to ${backupFile}`);

  const org = db.doc(`orgs/${orgId}`);
  const existingOrg = await org.get();
  const writer = db.bulkWriter();
  let changed = 0;

  if (!existingOrg.exists) {
    changed += 1;
    console.log(`orgs/${orgId}: will be created`);
    if (!isDryRun) {
      writer.set(org, {
        name,
        code: orgId.slice(0, 6).toUpperCase(),
        ownerUid,
        status: "active",
        contentVersion: settings.contentVersion ?? new Date().toISOString(),
        createdAt: new Date(),
      });
    }
  }

  for (const c of CONTENT) {
    const existing = new Map((await readAll(`orgs/${orgId}/${c}`)).map((d) => [d.id, d.data]));
    let count = 0;
    for (const { id, data } of content[c]) {
      if (isDeepStrictEqual(existing.get(id), data)) continue;
      count += 1;
      if (!isDryRun) writer.set(org.collection(c).doc(id), data);
    }
    console.log(`${c}: ${count} of ${content[c].length} docs to copy`);
    changed += count;
  }

  const existingMembers = new Set((await readAll(`orgs/${orgId}/members`)).map((d) => d.id));
  const roles: Record<string, string> = {};
  for (const { id, data } of users) {
    roles[id] = id === ownerUid ? "owner" : data.role === "admin" ? "trainer" : "client";
    if (existingMembers.has(id)) continue;
    changed += 1;
    if (!isDryRun) {
      writer.set(org.collection("members").doc(id), {
        uid: id,
        role: roles[id],
        assignedPlanIds: Array.isArray(data.plans) ? data.plans : [],
        email: data.email ?? null,
        displayName: data.displayName ?? null,
        joinedAt: data.createdAt ?? new Date(),
      });
    }
  }
  console.log(`members: ${users.length - existingMembers.size} of ${users.length} to create`);

  await writer.close();

  // Claims go last so nobody's token points at an org that isn't written yet.
  const auth = getAuth();
  let claimCount = 0;
  for (const uid of Object.keys(roles)) {
    try {
      const { customClaims = {} } = await auth.getUser(uid);
      const next = {
        ...customClaims,
        orgs: { ...(customClaims.orgs ?? {}), [orgId]: roles[uid] },
        ...(uid === ownerUid ? { superAdmin: true } : {}),
      };
      if (isDeepStrictEqual(next, customClaims)) continue;
      claimCount += 1;
      if (!isDryRun) await auth.setCustomUserClaims(uid, next);
    } catch (error: any) {
      console.warn(`claims: skipped ${uid} (${error.code ?? error.message})`);
    }
  }
  console.log(`claims: ${claimCount} of ${Object.keys(roles).length} users to update`);

  console.log(isDryRun ? `Dry run: ${changed} docs would change.` : `Wrote ${changed} docs.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
