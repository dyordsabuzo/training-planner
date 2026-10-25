// One-off migration (multi-tenant plan, Phase 3a): splits each
// userdata/{uid} doc into userdata/{uid}/plans/{planId} = { orgId, ...weeks },
// so trainers can read a client's progress for their org.
// - default: copies every plan entry to its plan doc (orgId from whichever
//   orgs/*/plans/{planId} exists, else --org-id). Run before deploying the app.
// - --cleanup: copies again (catches runs saved by the old app meanwhile),
//   then removes the plan entries from the root doc, keeping inProgress.
//   Run after the new app is live.
// Safe to re-run; unchanged plan docs are skipped.
//
//   Emulator:   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx tsx scripts/split-userdata.ts [--org-id=default] [--cleanup] [--apply]
//   Production: GOOGLE_CLOUD_QUOTA_PROJECT=training-planner-387200 npx tsx scripts/split-userdata.ts [--cleanup] [--apply]
//
// Always writes a JSON backup of every userdata doc first.
import { mkdirSync, writeFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { FieldValue } from "firebase-admin/firestore";
import { SourceDbReferences } from "../src/common/collections";
import { userdataPlans, userdataPlansPath } from "../src/common/refs";
import { db, isDryRun, logTarget } from "./lib/admin";

const main = async () => {
  const fallbackOrgId = process.argv.find((a) => a.startsWith("--org-id="))?.split("=")[1] ?? "default";
  const cleanup = process.argv.includes("--cleanup");
  logTarget(`split-userdata${cleanup ? " --cleanup" : ""}`);

  const orgOfPlan = new Map<string, string>();
  (await db.collectionGroup("plans").get()).docs
    .filter((doc) => doc.ref.parent.parent?.parent.id === "orgs")
    .forEach((doc) => orgOfPlan.set(doc.id, doc.ref.parent.parent!.id));

  const userdata = (await db.collection(SourceDbReferences.USERDATA).get()).docs;
  const existing = new Map<string, Record<string, any>>();
  for (const doc of userdata) {
    (await doc.ref.collection("plans").get()).docs.forEach((plan) =>
      existing.set(`${doc.id}/${plan.id}`, plan.data())
    );
  }

  const backupDir = "scripts/backups";
  mkdirSync(backupDir, { recursive: true });
  const backupFile = `${backupDir}/split-userdata-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(
    backupFile,
    JSON.stringify(
      { userdata: userdata.map((d) => ({ id: d.id, data: d.data() })), plans: Object.fromEntries(existing) },
      null,
      2
    )
  );
  console.log(`Backup written to ${backupFile}`);

  const writer = db.bulkWriter();
  let copied = 0;
  for (const doc of userdata) {
    for (const [planId, weeks] of Object.entries(userdataPlans(doc.data()))) {
      const current = existing.get(`${doc.id}/${planId}`);
      const orgId = current?.orgId ?? orgOfPlan.get(planId) ?? fallbackOrgId;
      if (!current && !orgOfPlan.has(planId)) {
        console.log(`  ${doc.id}/${planId}: no org has this plan, using ${orgId}`);
      }
      // Runs already in the plan doc win: once the new app is live it saves
      // (and deletes) there, and the root entry is stale.
      const next: Record<string, any> = { ...current, orgId };
      Object.entries(weeks as Record<string, any>).forEach(([week, sessions]) => {
        next[week] = { ...sessions, ...current?.[week] };
      });
      if (isDeepStrictEqual(current, next)) continue;
      console.log(`  copy ${doc.id}/${planId} → orgId ${orgId}`);
      copied += 1;
      if (!isDryRun) writer.set(db.collection(userdataPlansPath(doc.id)).doc(planId), next);
    }
  }
  // Every copy is written before any root entry is removed.
  await writer.flush();

  let stripped = 0;
  if (cleanup) {
    for (const doc of userdata) {
      const planIds = Object.keys(userdataPlans(doc.data()));
      if (planIds.length === 0) continue;
      console.log(`  strip ${planIds.length} plan entries from userdata/${doc.id}`);
      stripped += 1;
      if (!isDryRun) {
        writer.update(doc.ref, Object.fromEntries(planIds.map((planId) => [planId, FieldValue.delete()])));
      }
    }
  }
  await writer.close();
  console.log(
    `${isDryRun ? "Dry run: would copy" : "Copied"} ${copied} plan docs` +
      (cleanup ? `, ${isDryRun ? "would strip" : "stripped"} ${stripped} userdata docs.` : ".")
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
