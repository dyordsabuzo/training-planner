import { FieldValue, WriteBatch } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { bumpContentVersion, db, idSchema, linkRef, orgRef, parse, requireRole, requireUid } from "./common";
import {
  BACK_LINKS,
  CONTENT,
  Content,
  copyId,
  dependencyRefs,
  isOfferedTo,
  isSharedWith,
  LINKABLE,
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
      .filter(({ doc, ownerId, isOrgContent }) => isOrgContent && ownerId !== orgId && isOfferedTo(doc.data(), orgId))
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

type Loaded = Ref & { data: any };

// Adds copies of `items` (an item and everything it uses, from srcOrgId) to
// the batch. Copies get deterministic ids (copyId), so anything copied from
// the same source before is reused rather than duplicated; references are
// remapped to the copies, and each copy records where it came from in
// `source`. Returns how many are new.
const addCopies = async (
  batch: WriteBatch,
  srcOrgId: string,
  items: Loaded[],
  targetOrgId: string,
  now: Date
) => {
  const copied = new Map(items.map((item) => [key(item), copyId(srcOrgId, item.id)]));
  const idOf = (target: Content, sourceId: string) => copied.get(`${target}/${sourceId}`);
  const target = (item: Ref) => orgRef(targetOrgId).collection(item.collection).doc(copyId(srcOrgId, item.id));

  const existing = await db().getAll(...items.map(target));
  const isNew = new Set(items.filter((_, i) => !existing[i].exists).map(key));
  const toCreate = items.filter((item) => isNew.has(key(item)));

  const takenNames = new Map<Content, Set<string>>();
  for (const c of new Set(toCreate.map((item) => item.collection))) {
    const names = await orgRef(targetOrgId).collection(c).select("name").get();
    takenNames.set(c, new Set(names.docs.map((d) => d.get("name"))));
  }

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
  return { created: toCreate.length, skipped: items.length - toCreate.length };
};

// One batch (max 500 writes) keeps each call all-or-nothing; a link or
// conversion takes up to three writes per item.
const requireBatchSize = (items: Loaded[], writesEach: number) => {
  if (items.length * writesEach > 450) {
    throw new HttpsError("failed-precondition", "That item uses too many others to do this in one go.");
  }
};

const itemSchema = { srcOrgId: idSchema, id: idSchema, targetOrgId: idSchema };

// The source org and item a caller wants to copy or link, if it's offered to them.
const offeredItem = async (srcOrgId: string, collection: Content, id: string, targetOrgId: string) => {
  if (srcOrgId === targetOrgId) {
    throw new HttpsError("invalid-argument", "That item is already in your organisation.");
  }
  const [srcOrg, rootSnap] = await Promise.all([
    orgRef(srcOrgId).get(),
    orgRef(srcOrgId).collection(collection).doc(id).get(),
  ]);
  if (!srcOrg.exists || srcOrg.get("status") === "suspended" || !isOfferedTo(rootSnap.data(), targetOrgId)) {
    throw new HttpsError("not-found", "That item isn't shared with your organisation.");
  }
  return { srcOrgName: String(srcOrg.get("name")), data: rootSnap.data()! };
};

// Copies a shared item, and everything it uses, into the caller's org.
// Dependencies are copied even if their owner left them private: the shared
// item is unusable without them.
export const copyToOrg = onCall({ timeoutSeconds: 60 }, async (request) => {
  const uid = requireUid(request);
  const { srcOrgId, collection, id, targetOrgId } = parse(
    z.object({ ...itemSchema, collection: z.enum(CONTENT) }),
    request.data
  );
  await requireRole(targetOrgId, uid, TRAINERS);
  const { data } = await offeredItem(srcOrgId, collection, id, targetOrgId);

  const items = await loadWithDependencies(srcOrgId, { collection, id }, data);
  requireBatchSize(items, 1);
  const now = new Date();
  const batch = db().batch();
  const result = await addCopies(batch, srcOrgId, items, targetOrgId, now);
  if (result.created) bumpContentVersion(batch, targetOrgId, now.toISOString());
  await batch.commit();
  return { id: copyId(srcOrgId, id), ...result };
});

const srcItemRef = (srcOrgId: string, item: Ref) => orgRef(srcOrgId).collection(item.collection).doc(item.id);

// Live link: the caller's org uses another org's item, read-only, and sees
// the owner's edits. Each linked item (and everything it uses, which must be
// shared too, since the caller's members read them directly) gets a link doc
// orgs/{orgId}/links/{copyId}; references hold that id. The source counts
// its links (linkCount): a linked item is archived, not deleted.
export const linkToOrg = onCall({ timeoutSeconds: 60 }, async (request) => {
  const uid = requireUid(request);
  const { srcOrgId, collection, id, targetOrgId } = parse(
    z.object({ ...itemSchema, collection: z.enum(LINKABLE) }),
    request.data
  );
  await requireRole(targetOrgId, uid, TRAINERS);
  const { srcOrgName, data } = await offeredItem(srcOrgId, collection, id, targetOrgId);

  const items = await loadWithDependencies(srcOrgId, { collection, id }, data);
  requireBatchSize(items, 2);
  const unshared = items.filter((item) => !isSharedWith(item.data, targetOrgId));
  if (unshared.length) {
    const names = unshared.map((item) => item.data.name ?? item.id).join(", ");
    throw new HttpsError("failed-precondition", `Ask ${srcOrgName} to also share: ${names}.`);
  }

  // Already linked, or already copied (the copy wins): nothing to do.
  const ids = items.map((item) => copyId(srcOrgId, item.id));
  const [links, copies] = await Promise.all([
    db().getAll(...ids.map((lid) => linkRef(targetOrgId, lid))),
    db().getAll(...items.map((item, i) => orgRef(targetOrgId).collection(item.collection).doc(ids[i]))),
  ]);
  const toLink = items.filter((_, i) => !links[i].exists && !copies[i].exists);

  const now = new Date();
  const batch = db().batch();
  toLink.forEach((item) => {
    batch.create(linkRef(targetOrgId, copyId(srcOrgId, item.id)), {
      srcOrgId,
      collection: item.collection,
      srcId: item.id,
      linkedAt: now,
      linkedBy: uid,
    });
    batch.update(srcItemRef(srcOrgId, item), { linkCount: FieldValue.increment(1) });
  });
  if (toLink.length) {
    // The owner's cache refreshes too, so its link counts are current.
    bumpContentVersion(batch, targetOrgId, now.toISOString());
    bumpContentVersion(batch, srcOrgId, now.toISOString());
  }
  await batch.commit();
  return { id: copyId(srcOrgId, id), linked: toLink.length, skipped: items.length - toLink.length };
});

const linkSchema = z.object({ orgId: idSchema, linkId: idSchema });

const readLink = async (orgId: string, linkId: string) => {
  const link = await linkRef(orgId, linkId).get();
  if (!link.exists) throw new HttpsError("not-found", "That link no longer exists.");
  return link.data() as { srcOrgId: string; collection: Content; srcId: string };
};

// Replaces a link with a copy under the same id, so references to it (and
// clients' progress, keyed by id) don't change. Everything it uses is copied
// too, and links to those items are replaced as well.
export const convertLinkToCopy = onCall({ timeoutSeconds: 60 }, async (request) => {
  const uid = requireUid(request);
  const { orgId, linkId } = parse(linkSchema, request.data);
  await requireRole(orgId, uid, TRAINERS);
  const { srcOrgId, collection, srcId } = await readLink(orgId, linkId);

  const root = await orgRef(srcOrgId).collection(collection).doc(srcId).get();
  if (!isSharedWith(root.data(), orgId)) {
    throw new HttpsError("failed-precondition", "Its owner no longer shares it, so it can't be copied.");
  }
  const items = await loadWithDependencies(srcOrgId, { collection, id: srcId }, root.data());
  requireBatchSize(items, 3);

  const now = new Date();
  const batch = db().batch();
  const result = await addCopies(batch, srcOrgId, items, orgId, now);
  const links = await db().getAll(...items.map((item) => linkRef(orgId, copyId(srcOrgId, item.id))));
  links.forEach((link, i) => {
    if (!link.exists) return;
    batch.delete(link.ref);
    batch.update(srcItemRef(srcOrgId, items[i]), { linkCount: FieldValue.increment(-1) });
  });
  bumpContentVersion(batch, orgId, now.toISOString());
  bumpContentVersion(batch, srcOrgId, now.toISOString());
  await batch.commit();
  return { id: linkId, ...result };
});

// Removes a link nothing else in the org uses: neither the org's own items
// nor other linked items (whose references to it would silently vanish).
export const unlink = onCall(async (request) => {
  const uid = requireUid(request);
  const { orgId, linkId } = parse(linkSchema, request.data);
  await requireRole(orgId, uid, TRAINERS);
  const { srcOrgId, collection, srcId } = await readLink(orgId, linkId);

  const [own, otherLinks] = await Promise.all([
    Promise.all(CONTENT.map((c) => orgRef(orgId).collection(c).get())),
    orgRef(orgId).collection("links").where("srcOrgId", "==", srcOrgId).get(),
  ]);
  const usedByOwn = own.flatMap((snap, i) =>
    snap.docs.filter((d) => dependencyRefs(CONTENT[i], d.data()).some((r) => r.collection === collection && r.id === linkId))
  );
  const others = otherLinks.docs.filter((d) => d.id !== linkId);
  const otherSources = others.length
    ? await db().getAll(...others.map((d) => srcItemRef(srcOrgId, { collection: d.get("collection"), id: d.get("srcId") })))
    : [];
  const usedByLinked = otherSources.filter(
    (snap, i) =>
      snap.exists &&
      dependencyRefs(others[i].get("collection"), snap.data()!).some((r) => r.collection === collection && r.id === srcId)
  );
  const users = [...usedByOwn.map((d) => d.get("name")), ...usedByLinked.map((d) => d.get("name"))];
  if (users.length) {
    throw new HttpsError("failed-precondition", `Still used by: ${users.join(", ")}.`);
  }

  const now = new Date().toISOString();
  const batch = db().batch();
  batch.delete(linkRef(orgId, linkId));
  batch.update(srcItemRef(srcOrgId, { collection, id: srcId }), { linkCount: FieldValue.increment(-1) });
  bumpContentVersion(batch, orgId, now);
  bumpContentVersion(batch, srcOrgId, now);
  await batch.commit();
  return { id: linkId };
});
