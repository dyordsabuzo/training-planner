import { getAuth } from "firebase-admin/auth";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { refreshClaims } from "./claims";
import { idSchema, memberRef, orgRef, parse, requireRole, requireUid } from "./common";

const targetMember = async (orgId: string, uid: string) => {
  const member = await memberRef(orgId, uid).get();
  if (!member.exists) throw new HttpsError("not-found", "Not a member of this organisation.");
  return member;
};

// Owner, or the platform admin (from the Platform page's access requests):
// adds an existing account as a trainer or client. Existing members are left
// as they are. Suspended orgs refuse it either way.
export const addMember = onCall(async (request) => {
  const caller = requireUid(request);
  const { orgId, uid, role } = parse(
    z.object({ orgId: idSchema, uid: idSchema, role: z.enum(["trainer", "client"]) }),
    request.data
  );
  if (request.auth!.token.superAdmin === true) {
    const org = await orgRef(orgId).get();
    if (!org.exists || org.get("status") === "suspended") {
      throw new HttpsError("permission-denied", "Not allowed for this organisation.");
    }
  } else {
    await requireRole(orgId, caller, ["owner"]);
  }
  const account = await getAuth()
    .getUser(uid)
    .catch(() => {
      throw new HttpsError("not-found", "No such account.");
    });

  const ref = memberRef(orgId, uid);
  const added = !(await ref.get()).exists;
  if (added) {
    await ref.create({
      uid,
      role,
      assignedPlanIds: [],
      email: account.email ?? null,
      displayName: account.displayName ?? null,
      joinedAt: new Date(),
    });
    await refreshClaims(uid);
  }
  return { ok: true, added };
});

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

// Owner only: which trainers look after a client. Labels the roster ("My
// clients"); any trainer of the org can still see every client.
export const setClientTrainers = onCall(async (request) => {
  const caller = requireUid(request);
  const { orgId, uid, trainerUids } = parse(
    z.object({ orgId: idSchema, uid: idSchema, trainerUids: z.array(idSchema).max(20) }),
    request.data
  );
  await requireRole(orgId, caller, ["owner"]);
  const member = await targetMember(orgId, uid);
  if (member.get("role") !== "client") throw new HttpsError("failed-precondition", "Only clients have trainers.");
  const unique = [...new Set(trainerUids)];
  const trainers = await Promise.all(unique.map((trainerUid) => memberRef(orgId, trainerUid).get()));
  if (trainers.some((t) => !["owner", "trainer"].includes(t.get("role")))) {
    throw new HttpsError("invalid-argument", "Every trainer must be a trainer of this organisation.");
  }

  await member.ref.update({ trainerUids: unique });
  return { ok: true };
});
