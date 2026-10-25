import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { refreshClaims } from "./claims";
import { idSchema, memberRef, parse, requireRole, requireUid } from "./common";

const targetMember = async (orgId: string, uid: string) => {
  const member = await memberRef(orgId, uid).get();
  if (!member.exists) throw new HttpsError("not-found", "Not a member of this organisation.");
  return member;
};

// Owner only; the owner role itself can't be given or taken here.
export const setMemberRole = onCall(async (request) => {
  const caller = requireUid(request);
  const { orgId, uid, role } = parse(
    z.object({ orgId: idSchema, uid: idSchema, role: z.enum(["trainer", "client"]) }),
    request.data
  );
  await requireRole(orgId, caller, ["owner"]);
  const member = await targetMember(orgId, uid);
  if (member.get("role") === "owner") throw new HttpsError("failed-precondition", "The owner's role can't be changed.");

  await member.ref.update({ role });
  await refreshClaims(uid);
  return { ok: true };
});

// The owner removes anyone else; any other member can leave.
export const removeMember = onCall(async (request) => {
  const caller = requireUid(request);
  const { orgId, uid } = parse(z.object({ orgId: idSchema, uid: idSchema }), request.data);
  if (caller !== uid) await requireRole(orgId, caller, ["owner"]);
  const member = await targetMember(orgId, uid);
  if (member.get("role") === "owner") throw new HttpsError("failed-precondition", "The owner can't be removed.");

  await member.ref.delete();
  await refreshClaims(uid);
  return { ok: true };
});

// Trainers grant clients access to plans. Rules read this list, so no claim refresh.
export const setAssignedPlans = onCall(async (request) => {
  const caller = requireUid(request);
  const { orgId, uid, planIds } = parse(
    z.object({ orgId: idSchema, uid: idSchema, planIds: z.array(idSchema).max(200) }),
    request.data
  );
  await requireRole(orgId, caller, ["owner", "trainer"]);
  const member = await targetMember(orgId, uid);

  await member.ref.update({ assignedPlanIds: [...new Set(planIds)] });
  return { ok: true };
});
