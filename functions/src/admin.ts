import { CallableRequest, HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { refreshClaims } from "./claims";
import { db, idSchema, memberRef, ORG_ROLES, orgRef, parse, profileRef, requireUid } from "./common";
import { CONTENT } from "./sharing";

// Plenty for now; each org costs a dozen aggregation reads.
const LIST_ORGS_LIMIT = 200;

const requireSuperAdmin = (request: CallableRequest) => {
  requireUid(request);
  if (request.auth!.token.superAdmin !== true) throw new HttpsError("permission-denied", "Super admins only.");
};

const countOf = async (query: FirebaseFirestore.Query) => (await query.count().get()).data().count;

// Super-admin only. Suspended orgs drop out of every member's claim. The
// public profile carries the status too, so members who lost the org can
// see why.
export const suspendOrg = onCall(async (request) => {
  requireSuperAdmin(request);
  const { orgId, suspended } = parse(z.object({ orgId: idSchema, suspended: z.boolean() }), request.data);

  const org = await orgRef(orgId).get();
  if (!org.exists) throw new HttpsError("not-found", "No such organisation.");
  const status = suspended ? "suspended" : "active";
  const batch = db().batch();
  batch.update(org.ref, { status });
  batch.set(profileRef(orgId), { status }, { merge: true });
  await batch.commit();

  const members = await db().collection(`orgs/${orgId}/members`).get();
  await Promise.all(members.docs.map((m) => refreshClaims(m.id)));
  return { ok: true };
});

// The Platform page's Organisations tab: every org with its size. Members
// and content of other orgs aren't readable from the app, hence a callable.
// No orderBy: the migrated default org has no createdAt.
export const listOrgs = onCall({ timeoutSeconds: 60 }, async (request) => {
  requireSuperAdmin(request);

  const orgs = (await db().collection("orgs").limit(LIST_ORGS_LIMIT).get()).docs;
  const result = await Promise.all(
    orgs.map(async (org) => {
      const members = db().collection(`orgs/${org.id}/members`);
      const content = (collection: string) => db().collection(`orgs/${org.id}/${collection}`);
      const ownerUid = org.get("ownerUid") as string | undefined;
      const [owner, roleCounts, itemCounts, publicCounts, links] = await Promise.all([
        ownerUid ? memberRef(org.id, ownerUid).get() : undefined,
        Promise.all(ORG_ROLES.map((role) => countOf(members.where("role", "==", role)))),
        Promise.all(CONTENT.map((collection) => countOf(content(collection)))),
        Promise.all(CONTENT.map((collection) => countOf(content(collection).where("visibility", "==", "public")))),
        countOf(content("links")),
      ]);
      return {
        id: org.id,
        name: String(org.get("name") ?? org.id),
        code: (org.get("code") as string | undefined) ?? null,
        status: org.get("status") === "suspended" ? "suspended" : "active",
        createdAt: (org.get("createdAt")?.toDate?.() as Date | undefined)?.toISOString() ?? null,
        ownerEmail: (owner?.get("email") as string | undefined) ?? null,
        members: Object.fromEntries(ORG_ROLES.map((role, i) => [role, roleCounts[i]])),
        items: Object.fromEntries(CONTENT.map((collection, i) => [collection, itemCounts[i]])),
        publicItems: publicCounts.reduce((sum, n) => sum + n, 0),
        links,
      };
    })
  );
  result.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return { orgs: result };
});
