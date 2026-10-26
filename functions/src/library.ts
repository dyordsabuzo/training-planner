import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { db, idSchema, orgRef, parse, requireRole, requireUid } from "./common";
import {
  BACK_LINKS,
  CONTENT,
  Content,
  copyId,
  dependencyRefs,
  isSharedWith,
  Ref,
  remapForCopy,
  uniqueCopyName,
} from "./sharing";

const TRAINERS = ["owner", "trainer"] as const;
// Per collection and view; plenty for now, and keeps a call inside the timeout.
const LIST_LIMIT = 100;

const key = ({ collection, id }: Ref) => `${collection}/${id}`;
const tagsOf = (data: any): string[] =>
  Array.isArray(data?.tags) ? data.tags : typeof data?.tags === "string" && data.tags ? data.tags.split(",") : [];

// The Library browser's lists. "Shared with me" can't be a client query (the
// rules can't prove sharedWithOrgIds.hasAny(claims) for a list), so both
// views come from here, along with the owner orgs' names, which the app
// can't read.
export const listLibrary = onCall(async (request) => {
  const uid = requireUid(request);
  const { orgId, view } = parse(
    z.object({ orgId: idSchema, view: z.enum(["shared", "public"]) }),
    request.data
  );
  await requireRole(orgId, uid, TRAINERS);

  const snaps = await Promise.all(
    CONTENT.map((collection) => {
      const group = db().collectionGroup(collection);
      const query =
        view === "shared"
          ? group.where("sharedWithOrgIds", "array-contains", orgId)
          : group.where("visibility", "==", "public");
      return query.limit(LIST_LIMIT).get();
    })
  );

  const found = snaps.flatMap((snap, i) =>
    snap.docs
      .map((doc) => ({ doc, ownerId: doc.ref.parent.parent?.id, isOrgContent: doc.ref.parent.parent?.parent.id === "orgs" }))
      .filter(({ doc, ownerId, isOrgContent }) => isOrgContent && ownerId !== orgId && isSharedWith(doc.data(), orgId))
      .map(({ doc, ownerId }) => {
        const data = doc.data();
        const uses = dependencyRefs(CONTENT[i], data).length;
        return { collection: CONTENT[i], id: doc.id, orgId: ownerId!, name: String(data.name ?? doc.id), tags: tagsOf(data), uses };
      })
  );

  const ownerIds = Array.from(new Set(found.map((item) => item.orgId)));
  const owners = ownerIds.length ? await db().getAll(...ownerIds.map((id) => orgRef(id))) : [];
  const active = new Map(
    owners.filter((o) => o.exists && o.get("status") !== "suspended").map((o) => [o.id, String(o.get("name"))])
  );
  const items = found
    .filter((item) => active.has(item.orgId))
    .map((item) => ({ ...item, orgName: active.get(item.orgId)! }));
  return { items };
});

// Loads an item and everything it uses from the source org, level by level.
// References to items that no longer exist are left out.
const loadWithDependencies = async (srcOrgId: string, root: Ref, rootData: any) => {
  const docs = new Map<string, Ref & { data: any }>([[key(root), { ...root, data: rootData }]]);
  let frontier = dependencyRefs(root.collection, rootData);
  while (frontier.length) {
    const unseen = Array.from(new Map(frontier.filter((r) => !docs.has(key(r))).map((r) => [key(r), r])).values());
    if (!unseen.length) break;
    const snaps = await db().getAll(...unseen.map((r) => orgRef(srcOrgId).collection(r.collection).doc(r.id)));
    frontier = [];
    snaps.forEach((snap, i) => {
      if (!snap.exists) return;
      const ref = unseen[i];
      docs.set(key(ref), { ...ref, data: snap.data() });
      frontier.push(...dependencyRefs(ref.collection, snap.data()!));
    });
  }
  return Array.from(docs.values());
};

// Copies a shared item, and everything it uses, into the caller's org.
// Copies get deterministic ids (copyId), so anything copied from the same
// source before is reused rather than duplicated; references are remapped
// to the copies, and each copy records where it came from in `source`.
// Dependencies are copied even if their owner left them private: the shared
// item is unusable without them.
export const copyToOrg = onCall({ timeoutSeconds: 60 }, async (request) => {
  const uid = requireUid(request);
  const { srcOrgId, collection, id, targetOrgId } = parse(
    z.object({ srcOrgId: idSchema, collection: z.enum(CONTENT), id: idSchema, targetOrgId: idSchema }),
    request.data
  );
  if (srcOrgId === targetOrgId) {
    throw new HttpsError("invalid-argument", "That item is already in your organisation.");
  }
  await requireRole(targetOrgId, uid, TRAINERS);

  const [srcOrg, rootSnap] = await Promise.all([
    orgRef(srcOrgId).get(),
    orgRef(srcOrgId).collection(collection).doc(id).get(),
  ]);
  if (!srcOrg.exists || srcOrg.get("status") === "suspended" || !isSharedWith(rootSnap.data(), targetOrgId)) {
    throw new HttpsError("not-found", "That item isn't shared with your organisation.");
  }

  const items = await loadWithDependencies(srcOrgId, { collection, id }, rootSnap.data());
  const copied = new Map(items.map((item) => [key(item), copyId(srcOrgId, item.id)]));
  const idOf = (target: Content, sourceId: string) => copied.get(`${target}/${sourceId}`);
  const target = (item: Ref) => orgRef(targetOrgId).collection(item.collection).doc(copyId(srcOrgId, item.id));

  const existing = await db().getAll(...items.map(target));
  const isNew = new Set(items.filter((_, i) => !existing[i].exists).map(key));
  const toCreate = items.filter((item) => isNew.has(key(item)));
  // One batch (max 500 writes) keeps the copy all-or-nothing.
  if (items.length > 450) {
    throw new HttpsError("failed-precondition", "That item uses too many others to copy in one go.");
  }

  const takenNames = new Map<Content, Set<string>>();
  for (const c of new Set(toCreate.map((item) => item.collection))) {
    const names = await orgRef(targetOrgId).collection(c).select("name").get();
    takenNames.set(c, new Set(names.docs.map((d) => d.get("name"))));
  }

  const now = new Date();
  const batch = db().batch();
  toCreate.forEach((item) => {
    const taken = takenNames.get(item.collection)!;
    const name = uniqueCopyName(String(item.data.name ?? item.id), taken);
    taken.add(name);
    batch.create(target(item), {
      ...remapForCopy(item.collection, item.data, idOf),
      name,
      ...(item.collection === "plans" && { createdAt: now.toISOString() }),
      source: { orgId: srcOrgId, id: item.id, mode: "copy", copiedAt: now },
    });
  });
  // An item copied earlier keeps its back-links in step with new copies that
  // use it (e.g. an exercise gains the superset copied now).
  items
    .filter((item) => !isNew.has(key(item)))
    .forEach((item) => {
      const back = BACK_LINKS[item.collection];
      if (!back) return;
      const added = remapForCopy(item.collection, { [back.field]: item.data[back.field] }, (t, sid) =>
        isNew.has(`${t}/${sid}`) ? idOf(t, sid) : undefined
      )[back.field] as string[];
      if (added.length) batch.update(target(item), { [back.field]: FieldValue.arrayUnion(...added) });
    });
  if (toCreate.length) batch.update(orgRef(targetOrgId), { contentVersion: now.toISOString() });
  await batch.commit();

  return { id: copyId(srcOrgId, id), created: toCreate.length, skipped: items.length - toCreate.length };
});
