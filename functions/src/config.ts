// Dependency-free so scripts/ can import it too.

// Same region as the Firestore database.
export const REGION = "australia-southeast1";

// Every callable exported from index.ts. The billing guard blocks public
// access to these, so keep this list in sync when adding one.
export const CALLABLES = [
  "createOrg",
  "createInvite",
  "acceptInvite",
  "addMember",
  "setMemberRole",
  "removeMember",
  "setAssignedPlans",
  "setClientTrainers",
  "suspendOrg",
] as const;

// The Cloud Billing budget publishes its notifications to this topic.
export const BILLING_TOPIC = "billing-alerts";

// Suspension state, readable by the app (settings rules: any signed-in user).
export const PLATFORM_DOC = "settings/platform";

// Runs only the billing guard; the one identity allowed to change access to the callables.
export const GUARD_SERVICE_ACCOUNT = "billing-guard@training-planner-387200.iam.gserviceaccount.com";
