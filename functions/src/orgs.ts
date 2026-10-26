import { randomInt } from "node:crypto";
import { HttpsError, onCall } from "firebase-functions/v2/https";
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

// Sharing library items with a specific org starts from its code: trainers
// type it in and get back that org's name. There's no search, so orgs can't
// be browsed. The claim is enough here (a read-only lookup).
export const findOrgByCode = onCall(async (request) => {
  requireUid(request);
  const roles = Object.values((request.auth?.token.orgs ?? {}) as Record<string, string>);
  if (!roles.some((role) => role === "owner" || role === "trainer")) {
    throw new HttpsError("permission-denied", "Only trainers can look up organisations.");
  }
  const { code } = parse(
    z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,12}$/) }),
    request.data
  );

  const found = await db().collection("orgs").where("code", "==", code).limit(1).get();
  const org = found.docs[0];
  if (!org || org.get("status") === "suspended") {
    throw new HttpsError("not-found", "No organisation has that code.");
  }
  return { id: org.id, name: org.get("name") as string, code };
});
