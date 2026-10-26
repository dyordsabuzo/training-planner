import { describe, expect, it } from "vitest";
import { copyId, dependencyRefs, isSharedWith, remapForCopy, uniqueCopyName } from "./sharing";

describe("isSharedWith", () => {
  it("allows public items and items shared with the org", () => {
    expect(isSharedWith({ visibility: "public" }, "B")).toBe(true);
    expect(isSharedWith({ visibility: "orgs", sharedWithOrgIds: ["B"] }, "B")).toBe(true);
  });
  it("refuses private, other orgs' and personalised items", () => {
    expect(isSharedWith({}, "B")).toBe(false);
    expect(isSharedWith({ visibility: "orgs", sharedWithOrgIds: ["C"] }, "B")).toBe(false);
    expect(isSharedWith({ visibility: "public", personalisedFor: "u1" }, "B")).toBe(false);
    expect(isSharedWith(undefined, "B")).toBe(false);
  });
});

describe("dependencyRefs", () => {
  it("follows forward references only", () => {
    expect(dependencyRefs("sessions", { supersets: ["ss1"], groups: [{ exercises: ["ex1"] }] })).toEqual([
      { collection: "supersets", id: "ss1" },
      { collection: "exercises", id: "ex1" },
    ]);
    expect(dependencyRefs("supersets", { exercises: "ex1,ex2", sessions: ["se1"] })).toEqual([
      { collection: "exercises", id: "ex1" },
      { collection: "exercises", id: "ex2" },
    ]);
    expect(dependencyRefs("exercises", { supersets: ["ss1"], alternatives: ["ex2"] })).toEqual([
      { collection: "exercises", id: "ex2" },
    ]);
  });
});

describe("copyId", () => {
  it("is deterministic, and hashed when too long", () => {
    expect(copyId("A", "s1")).toBe("x_A_s1");
    const long = copyId("A".repeat(80), "B".repeat(80));
    expect(long).toMatch(/^x_h_[0-9a-f]{40}$/);
    expect(copyId("A".repeat(80), "B".repeat(80))).toBe(long);
  });
});

describe("remapForCopy", () => {
  const copied: Record<string, string> = { "supersets/ss1": "x_A_ss1", "exercises/ex1": "x_A_ex1" };
  const idOf = (c: string, id: string) => copied[`${c}/${id}`];

  it("remaps references, drops ones outside the copy and strips source fields", () => {
    const session = remapForCopy(
      "sessions",
      {
        id: "se1",
        name: "Day 1",
        supersets: ["ss1", "gone"],
        groups: [{ id: "g1", name: "Finisher", exercises: ["ex1"] }],
        visibility: "public",
        isShareable: true,
        sharedSnapshot: {},
        previousNames: ["Old"],
      },
      idOf
    );
    expect(session).toEqual({
      name: "Day 1",
      supersets: ["x_A_ss1"],
      groups: [{ id: "g1", name: "Finisher", exercises: ["x_A_ex1"] }],
    });
  });
  it("keeps back-links only within the copy", () => {
    expect(remapForCopy("exercises", { name: "Squat", supersets: ["ss1", "ss9"], alternatives: [] }, idOf)).toEqual({
      name: "Squat",
      supersets: ["x_A_ss1"],
      alternatives: [],
    });
    expect(remapForCopy("supersets", { name: "Legs", exercises: ["ex1"], sessions: ["se1"] }, idOf)).toEqual({
      name: "Legs",
      exercises: ["x_A_ex1"],
      sessions: [],
    });
  });
  it("never copies a personalised plan's client", () => {
    expect(remapForCopy("plans", { name: "P", sessions: [], personalisedFor: "u1" }, idOf)).toEqual({ name: "P", sessions: [] });
  });
});

describe("uniqueCopyName", () => {
  it("keeps the name unless it's taken", () => {
    expect(uniqueCopyName("Squat", new Set())).toBe("Squat");
    expect(uniqueCopyName("Squat", new Set(["Squat"]))).toBe("Squat (copy)");
    expect(uniqueCopyName("Squat", new Set(["Squat", "Squat (copy)"]))).toBe("Squat (copy 2)");
  });
});
