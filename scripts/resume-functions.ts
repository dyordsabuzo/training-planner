// Re-opens the callables after the billing guard (functions/src/guard.ts)
// suspended them. --allow-up-to sets the month-to-date cost you accept; the
// guard trips again once the cost goes past it (it resets to 0 next month).
//
//   npx tsx scripts/resume-functions.ts                         (dry run: shows the cost and access)
//   npx tsx scripts/resume-functions.ts --allow-up-to=2 --apply
//
// Needs ADC credentials with a quota project (GOOGLE_CLOUD_QUOTA_PROJECT=training-planner-387200).
import { CALLABLES, PLATFORM_DOC, REGION } from "../functions/src/config";
import { setPublicInvoker } from "../functions/src/invoker";
import { db, isDryRun, logTarget, projectId } from "./lib/admin";

const main = async () => {
  logTarget("resume-functions");
  const ref = db.doc(PLATFORM_DOC);
  const platform = (await ref.get()).data() ?? {};
  console.log(
    `Suspended: ${!!platform.functionsSuspended}; month-to-date cost ${platform.costAmount ?? 0} ${platform.currencyCode ?? ""}` +
      ` (allowed ${platform.allowedCost ?? 0})`
  );

  const allowArg = process.argv.find((a) => a.startsWith("--allow-up-to="))?.split("=")[1];
  const allowUpTo = Number(allowArg);
  if (allowArg === undefined || !Number.isFinite(allowUpTo) || allowUpTo < (platform.costAmount ?? 0)) {
    console.log("Pass --allow-up-to=<amount>, at least the current cost, to resume.");
    return;
  }
  if (isDryRun) {
    console.log(`Dry run: would re-open ${CALLABLES.length} callables and allow up to ${allowUpTo}.`);
    return;
  }

  // Allowance first, so a notification arriving mid-way doesn't re-suspend.
  await ref.set(
    {
      functionsSuspended: false,
      allowedCost: allowUpTo,
      allowedCostIntervalStart: platform.costIntervalStart ?? null,
      resumedAt: new Date(),
    },
    { merge: true }
  );
  for (const fn of CALLABLES) {
    const changed = await setPublicInvoker(projectId, REGION, fn, true);
    console.log(`${fn}: ${changed ? "re-opened" : "already public"}`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
