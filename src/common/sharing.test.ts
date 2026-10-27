import { describe, expect, it } from "vitest";
import { canShare, isBlocked, sharingOf, widenSharing } from "./sharing";

const orgA = { id: "a", name: "A", code: "AAAAAA" };
const orgB = { id: "b", name: "B", code: "BBBBBB" };
const shared = (...orgs: typeof orgA[]) => ({
  visibility: "orgs" as const,
  sharedWithOrgIds: orgs.map((o) => o.id),
  sharedWithOrgs: orgs,
});

describe("sharing", () => {
  it("treats missing or unknown fields as private", () => {
    expect(sharingOf({})).toEqual({ visibility: "private", sharedWithOrgIds: [], sharedWithOrgs: [] });
    expect(sharingOf({ visibility: "everyone" }).visibility).toBe("private");
  });
  it("never shares a personalised plan", () => {
    expect(canShare({ personalisedFor: "u1" })).toBe(false);
    expect(canShare({ name: "Plan" })).toBe(true);
  });
  it("widens a dependency's sharing, never narrows it", () => {
    const priv = sharingOf({});
    const pub = sharingOf({ visibility: "public" });
    expect(widenSharing(priv, shared(orgA))).toEqual(shared(orgA));
    expect(widenSharing(shared(orgA), shared(orgA, orgB))).toEqual(shared(orgA, orgB));
    expect(widenSharing(shared(orgB), shared(orgA))).toEqual(shared(orgB, orgA));
    expect(widenSharing(pub, shared(orgA))).toEqual(pub);
    expect(widenSharing(shared(orgA), pub)).toEqual(pub);
    expect(widenSharing(shared(orgA), priv)).toEqual(shared(orgA));
  });
  it("never widens a blocked dependency to public", () => {
    const pub = sharingOf({ visibility: "public" });
    expect(widenSharing(shared(orgA), pub, true)).toEqual(shared(orgA));
    expect(widenSharing(sharingOf({}), pub, true)).toEqual(sharingOf({}));
    expect(widenSharing(sharingOf({}), shared(orgA), true)).toEqual(shared(orgA));
  });
  it("is blocked only while moderation.blocked is set", () => {
    expect(isBlocked({ moderation: { blocked: true } })).toBe(true);
    expect(isBlocked({ moderation: { blocked: false } })).toBe(false);
    expect(isBlocked({})).toBe(false);
  });
});
