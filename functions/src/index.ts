import { initializeApp } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";

// Server-side code for the multi-tenant phases: org creation, invites,
// membership/custom-claims management and cross-org copy. Callables are
// added here as each phase lands; deploy with `yarn firebase:deploy:functions`.
initializeApp();
// Set `region` here to match the Firestore database location before the first deploy.
setGlobalOptions({ maxInstances: 10 });
