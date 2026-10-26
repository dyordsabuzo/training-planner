// One-off (multi-tenant plan, Phase 4c): gives every org its public profile
// orgs/{orgId}/public/profile = { name, contentVersion }, which orgs linking
// to its library items read ("Owned by X", and when to refetch them).
// createOrg writes it for new orgs. Safe to re-run; up-to-date profiles are
// skipped. Writes nothing but profiles, so there's no backup.
//
//   Emulator:   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx tsx scripts/backfill-org-profiles.ts [--apply]
//   Production: GOOGLE_CLOUD_QUOTA_PROJECT=training-planner-387200 npx tsx scripts/backfill-org-profiles.ts [--apply]
import { db, isDryRun, logTarget } from "./lib/admin";

const main = async () => {
  logTarget("backfill-org-profiles");
  const orgs = (await db.collection("orgs").get()).docs;
  const profiles = orgs.length ? await db.getAll(...orgs.map((org) => org.ref.collection("public").doc("profile"))) : [];

  let changes = 0;
  const batch = db.batch();
  orgs.forEach((org, i) => {
    const wanted = { name: org.get("name") ?? org.id, contentVersion: org.get("contentVersion") ?? new Date().toISOString() };
    const current = profiles[i].data();
    if (current?.name === wanted.name && current?.contentVersion === wanted.contentVersion) {
      console.log(`  ${org.id}: up to date`);
      return;
    }
    console.log(`  ${org.id}: ${current ? "update" : "create"} ${JSON.stringify(wanted)}`);
    batch.set(profiles[i].ref, wanted, { merge: true });
    changes++;
  });

  console.log(`${orgs.length} orgs, ${changes} profile${changes === 1 ? "" : "s"} to write`);
  if (!isDryRun && changes) {
    await batch.commit();
    console.log("Written.");
  }
};

main();
