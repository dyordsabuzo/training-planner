// Library sharing (Phase 4). Every content item is private unless its
// `visibility` says otherwise; the Firestore rules (dragonbeat) enforce it.

export const VISIBILITIES = ["private", "orgs", "public"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export type SharedOrg = { id: string; name: string; code: string };

// sharedWithOrgs keeps the names for the picker (another org's doc can't be
// read); sharedWithOrgIds is what the rules check.
export type Sharing = {
  visibility: Visibility;
  sharedWithOrgIds: string[];
  sharedWithOrgs: SharedOrg[];
};

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  private: "Private",
  orgs: "Specific orgs",
  public: "Public",
};

export const sharingOf = (entity: any): Sharing => ({
  visibility: VISIBILITIES.includes(entity?.visibility) ? entity.visibility : "private",
  sharedWithOrgIds: Array.isArray(entity?.sharedWithOrgIds) ? entity.sharedWithOrgIds : [],
  sharedWithOrgs: Array.isArray(entity?.sharedWithOrgs) ? entity.sharedWithOrgs : [],
});

// Blocked from the marketplace by the platform admin (moderateItem); the
// rules refuse making it public until it's unblocked.
export const isBlocked = (entity: any) => entity?.moderation?.blocked === true;

// Plans personalised for a client are never shared.
export const canShare = (entity: any) => !entity?.personalisedFor;

// Sharing an item's dependencies along with it only ever widens their
// access: a public dependency stays public, and orgs are added, not replaced.
// A blocked item never becomes public; it keeps what it had.
export const widenSharing = (current: Sharing, next: Sharing, blocked = false): Sharing => {
  if (current.visibility === "public" || next.visibility === "private") return current;
  if (next.visibility === "public") return blocked ? current : next;
  const orgs = [...current.sharedWithOrgs];
  next.sharedWithOrgs.forEach((org) => {
    if (!orgs.some((o) => o.id === org.id)) orgs.push(org);
  });
  const ids = Array.from(new Set([...current.sharedWithOrgIds, ...next.sharedWithOrgIds]));
  return { visibility: "orgs", sharedWithOrgIds: ids, sharedWithOrgs: orgs };
};

// Listings hide items their org archived (deleted while other orgs link to
// them); items linked from an org that archived them stay listed.
export const isListed = (entity: any) => !entity?.archived || !!entity?.linked;
