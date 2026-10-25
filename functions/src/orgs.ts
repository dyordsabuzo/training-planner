import { randomInt } from "node:crypto";
import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { refreshClaims } from "./claims";
import { db, memberRef, newMember, parse, requireUid } from "./common";

// Short public code used to find an org when sharing (Phase 4).
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const uniqueCode = async (): Promise<string> => {
  const code = Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
  const taken = await db().collection("orgs").where("code", "==", code).limit(1).get();
  return taken.empty ? code : uniqueCode();
};

// Self-service: any signed-in user can start an org and becomes its owner.
export const createOrg = onCall(async (request) => {
  const uid = requireUid(request);
  const { name } = parse(z.object({ name: z.string().trim().min(2).max(80) }), request.data);

  const org = db().collection("orgs").doc();
  const batch = db().batch();
  batch.create(org, {
    name,
    code: await uniqueCode(),
    ownerUid: uid,
    status: "active",
    contentVersion: new Date().toISOString(),
    createdAt: new Date(),
  });
  batch.create(memberRef(org.id, uid), newMember(request, "owner"));
  await batch.commit();

  await refreshClaims(uid);
  return { orgId: org.id };
});
