import { getFirestore } from "firebase-admin/firestore";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";

export const ORG_ROLES = ["owner", "trainer", "client"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const db = () => getFirestore();

export const orgRef = (orgId: string) => db().doc(`orgs/${orgId}`);
export const memberRef = (orgId: string, uid: string) => db().doc(`orgs/${orgId}/members/${uid}`);

export const idSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);

export const parse = <T extends z.ZodType>(schema: T, data: unknown): z.infer<T> => {
  const result = schema.safeParse(data);
  if (!result.success) throw new HttpsError("invalid-argument", z.prettifyError(result.error));
  return result.data;
};

export const requireUid = (request: CallableRequest) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");
  return uid;
};

// Checks the member doc rather than the claim, which can be up to an hour stale.
export const requireRole = async (orgId: string, uid: string, allowed: readonly OrgRole[]) => {
  const [org, member] = await Promise.all([orgRef(orgId).get(), memberRef(orgId, uid).get()]);
  const role = member.get("role") as OrgRole | undefined;
  if (!org.exists || org.get("status") === "suspended" || !role || !allowed.includes(role)) {
    throw new HttpsError("permission-denied", "Not allowed for this organisation.");
  }
  return role;
};

export const newMember = (request: CallableRequest, role: OrgRole) => ({
  uid: request.auth!.uid,
  role,
  assignedPlanIds: [] as string[],
  email: request.auth!.token.email ?? null,
  displayName: request.auth!.token.name ?? null,
  joinedAt: new Date(),
});
