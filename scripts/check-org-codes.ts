// Read-only check (multi-tenant plan, Phase 4a): orgs are found by their
// `code` when sharing library items (findOrgByCode returns the first match),
// so every org needs a code and no two may share one. Migrated orgs got
// theirs from their id (migrate-orgs.ts) rather than createOrg's uniqueCode.
//
//   Emulator:   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx tsx scripts/check-org-codes.ts
//   Production: GOOGLE_CLOUD_QUOTA_PROJECT=training-planner-387200 npx tsx scripts/check-org-codes.ts
import { db, logTarget } from "./lib/admin";

const main = async () => {
  logTarget("check-org-codes (read-only)");
  const orgs = (await db.collection("orgs").get()).docs;
  const byCode = new Map<string, string[]>();
  const missing: string[] = [];
  orgs.forEach((org) => {
    const code = org.get("code");
    if (typeof code !== "string" || !code) return missing.push(org.id);
    byCode.set(code, [...(byCode.get(code) ?? []), org.id]);
  });

  orgs.forEach((org) => console.log(`  ${org.id}  ${org.get("code") ?? "(none)"}  ${org.get("name")}`));
  const duplicates = Array.from(byCode.entries()).filter(([, ids]) => ids.length > 1);
  duplicates.forEach(([code, ids]) => console.log(`DUPLICATE ${code}: ${ids.join(", ")}`));
  missing.forEach((id) => console.log(`MISSING code: ${id}`));
  console.log(`${orgs.length} orgs, ${duplicates.length} duplicate codes, ${missing.length} without a code`);
  if (duplicates.length || missing.length) process.exitCode = 1;
};

main();
