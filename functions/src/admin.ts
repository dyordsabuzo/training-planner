import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { refreshClaims } from "./claims";
import { db, idSchema, orgRef, parse, requireUid } from "./common";

// Super-admin only. Suspended orgs drop out of every member's claim.
export const suspendOrg = onCall(async (request) => {
  requireUid(request);
  if (request.auth!.token.superAdmin !== true) throw new HttpsError("permission-denied", "Super admins only.");
  const { orgId, suspended } = parse(z.object({ orgId: idSchema, suspended: z.boolean() }), request.data);

  const org = await orgRef(orgId).get();
  if (!org.exists) throw new HttpsError("not-found", "No such organisation.");
  await org.ref.update({ status: suspended ? "suspended" : "active" });

  const members = await db().collection(`orgs/${orgId}/members`).get();
  await Promise.all(members.docs.map((m) => refreshClaims(m.id)));
  return { ok: true };
});
