import { randomBytes } from "node:crypto";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { refreshClaims } from "./claims";
import { db, idSchema, memberRef, newMember, orgRef, parse, requireRole, requireUid } from "./common";

const DAY_MS = 24 * 60 * 60 * 1000;

const inviteRef = (orgId: string, token: string) => db().doc(`orgs/${orgId}/invites/${token}`);

// Owner only. The token goes in the join link (/join/:orgId/:token).
export const createInvite = onCall(async (request) => {
  const uid = requireUid(request);
  const { orgId, role, expiresInDays, maxUses } = parse(
    z.object({
      orgId: idSchema,
      role: z.enum(["trainer", "client"]),
      expiresInDays: z.number().int().min(1).max(30).default(7),
      maxUses: z.number().int().min(1).max(100).default(1),
    }),
    request.data
  );
  await requireRole(orgId, uid, ["owner"]);

  const token = randomBytes(16).toString("base64url");
  await inviteRef(orgId, token).create({
    role,
    createdBy: uid,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + expiresInDays * DAY_MS),
    usesLeft: maxUses,
  });
  return { token };
});

// Existing members keep their role and don't use up the invite.
export const acceptInvite = onCall(async (request) => {
  const uid = requireUid(request);
  const { orgId, token } = parse(z.object({ orgId: idSchema, token: idSchema }), request.data);

  const role = await db().runTransaction(async (tx) => {
    const [org, invite, member] = await Promise.all([
      tx.get(orgRef(orgId)),
      tx.get(inviteRef(orgId, token)),
      tx.get(memberRef(orgId, uid)),
    ]);
    if (!org.exists || org.get("status") === "suspended" || !invite.exists) {
      throw new HttpsError("not-found", "This invite isn't valid.");
    }
    if (member.exists) return member.get("role");
    if (invite.get("expiresAt").toMillis() < Date.now() || invite.get("usesLeft") < 1) {
      throw new HttpsError("failed-precondition", "This invite has expired.");
    }
    tx.create(memberRef(orgId, uid), newMember(request, invite.get("role")));
    tx.update(invite.ref, { usesLeft: invite.get("usesLeft") - 1 });
    return invite.get("role");
  });

  await refreshClaims(uid);
  return { orgId, role };
});
