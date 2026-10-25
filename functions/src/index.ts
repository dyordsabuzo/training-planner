import { initializeApp } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";

// Server-side code for the multi-tenant phases: org creation, invites,
// membership/custom-claims management and cross-org copy. Callables are
// added here as each phase lands; deploy with `yarn firebase:deploy:functions`.
initializeApp();
// Same region as the Firestore database.
setGlobalOptions({ region: "australia-southeast1", maxInstances: 10 });

export { suspendOrg } from "./admin";
export { acceptInvite, createInvite } from "./invites";
export { removeMember, setAssignedPlans, setMemberRole } from "./members";
export { createOrg } from "./orgs";
