import { logger } from "firebase-functions";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { db } from "./common";
import { BILLING_TOPIC, CALLABLES, GUARD_SERVICE_ACCOUNT, PLATFORM_DOC, REGION } from "./config";
import { setPublicInvoker } from "./invoker";

type BudgetNotification = { costAmount?: number; costIntervalStart?: string; currencyCode?: string };

// Kill switch: as soon as the project's month-to-date cost goes past what
// has been allowed (0 by default; scripts/resume-functions.ts raises it),
// every callable is closed to the public and the app is told through
// settings/platform. Budget notifications arrive a few times a day and lag
// actual usage by hours. Hosting and Firestore are not affected.
export const billingGuard = onMessagePublished(
  { topic: BILLING_TOPIC, serviceAccount: GUARD_SERVICE_ACCOUNT, retry: false },
  async (event) => {
    const { costAmount = 0, costIntervalStart, currencyCode } = (event.data.message.json ?? {}) as BudgetNotification;
    const ref = db().doc(PLATFORM_DOC);
    const platform = (await ref.get()).data() ?? {};
    // An allowance only applies to the billing month it was given in.
    const allowed = platform.allowedCostIntervalStart === costIntervalStart ? platform.allowedCost ?? 0 : 0;
    if (costAmount <= allowed) return;

    const projectId = process.env.GCLOUD_PROJECT!;
    const changed = await Promise.all(CALLABLES.map((fn) => setPublicInvoker(projectId, REGION, fn, false)));
    await ref.set(
      { functionsSuspended: true, costAmount, currencyCode: currencyCode ?? null, costIntervalStart: costIntervalStart ?? null, checkedAt: new Date() },
      { merge: true }
    );
    if (changed.some(Boolean)) {
      logger.warn(`Billing guard: cost ${costAmount} ${currencyCode} > ${allowed}; callables suspended.`);
    }
  }
);
