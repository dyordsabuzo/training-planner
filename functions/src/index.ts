import { initializeApp } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";
import { REGION } from "./config";

// Server-side code for the multi-tenant phases: org creation, invites,
// membership/custom-claims management and cross-org copy. Callables are
// added here as each phase lands; deploy with `yarn firebase:deploy:functions`.
initializeApp();
// Sized to cap the worst-case spend rate: one small instance per function,
// short timeout. Extra concurrent calls are refused rather than scaled out.
setGlobalOptions({ region: REGION, maxInstances: 1, cpu: "gcf_gen1", memory: "256MiB", timeoutSeconds: 10 });

export { suspendOrg } from "./admin";
export { billingGuard } from "./guard";
export { acceptInvite, createInvite } from "./invites";
export { addMember, removeMember, setAssignedPlans, setClientTrainers, setMemberRole } from "./members";
export { createOrg } from "./orgs";
