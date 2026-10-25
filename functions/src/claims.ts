import { getAuth } from "firebase-admin/auth";
import { db, orgRef } from "./common";

// Rebuilds the `orgs: {[orgId]: role}` custom claim from the user's member
// docs, leaving out suspended orgs. Other claims (superAdmin) are kept.
// Firestore rules read roles from this claim.
export const refreshClaims = async (uid: string) => {
  const members = (await db().collectionGroup("members").where("uid", "==", uid).get()).docs;
  const orgs = members.length ? await db().getAll(...members.map((m) => orgRef(m.ref.parent.parent!.id))) : [];
  const active = new Set(orgs.filter((o) => o.exists && o.get("status") !== "suspended").map((o) => o.id));

  const auth = getAuth();
  const { customClaims } = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, {
    ...customClaims,
    orgs: Object.fromEntries(
      members.filter((m) => active.has(m.ref.parent.parent!.id)).map((m) => [m.ref.parent.parent!.id, m.get("role")])
    ),
  });
};
