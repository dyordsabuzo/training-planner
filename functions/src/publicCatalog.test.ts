import { describe, expect, it } from "vitest";
import { buildPreview, isPubliclyListed, summaryOf } from "./publicCatalog";

const docs: Record<string, any> = {
  "exercises/e1": { name: "Squat", targetWeight: 100, notes: "private" },
  "exercises/e2": { name: "Lunge" },
  "exercises/e3": { name: "Plank" },
  "supersets/ss1": { name: "Legs", exercises: ["e1", "e2", "gone"], targetSet: "4", targetRep: 8, rest: 90, sessions: ["s1"] },
  "sessions/s1": {
    name: "Day A",
    supersets: ["ss1"],
    groups: [{ name: "Core", exercises: ["e3"], sets: 3, reps: 0, measure: "time", time: 45, rest: 30, percent: 70 }],
    sharedWithOrgIds: ["B"],
  },
};
const get = (c: string, id: string) => docs[`${c}/${id}`];

describe("isPubliclyListed", () => {
  it("lists live public items only", () => {
    expect(isPubliclyListed({ visibility: "public" })).toBe(true);
    expect(isPubliclyListed({ visibility: "orgs" })).toBe(false);
    expect(isPubliclyListed({ visibility: "public", archived: true })).toBe(false);
    expect(isPubliclyListed({ visibility: "public", moderation: { blocked: true } })).toBe(false);
    expect(isPubliclyListed({ visibility: "public", personalisedFor: "u1" })).toBe(false);
    expect(isPubliclyListed(undefined)).toBe(false);
  });
});

describe("buildPreview", () => {
  it("keeps only names and targets of a session", () => {
    expect(buildPreview("sessions", docs["sessions/s1"], get)).toEqual({
      collection: "sessions",
      name: "Day A",
      units: [
        { name: "Legs", exercises: ["Squat", "Lunge"], sets: 4, reps: 8 },
        { name: "Core", exercises: ["Plank"], sets: 3, time: 45 },
      ],
    });
  });

  it("keeps a plan's week targets and session contents, nothing else", () => {
    const plan = {
      name: "Strength",
      sessions: ["s1", "missing"],
      weeks: { "Week 10": { targetRep: 5 }, "Week 2": { targetRep: 8, secret: "x" } },
      personalNotes: "private",
    };
    const preview = buildPreview("plans", plan, get) as any;
    expect(preview.weeks).toEqual([
      { week: "Week 2", targetRep: 8 },
      { week: "Week 10", targetRep: 5 },
    ]);
    expect(preview.sessions.map((s: any) => s.name)).toEqual(["Day A"]);
    expect(JSON.stringify(preview)).not.toMatch(/private|secret|targetWeight|rest|sharedWith|percent/);
  });
});

describe("summaryOf", () => {
  it("counts a plan's weeks and sessions, and a session's distinct exercises", () => {
    expect(summaryOf("plans", { weeks: { a: {}, b: {} }, sessions: ["s1"] }, new Map())).toEqual({ weeks: 2, sessions: 1 });
    expect(summaryOf("plans", { open: true, weeks: { a: {} }, sessions: [] }, new Map())).toEqual({ weeks: 0, sessions: 0 });
    expect(summaryOf("sessions", docs["sessions/s1"], new Map([["ss1", ["e1", "e2", "e3"]]]))).toEqual({ exercises: 3 });
  });
});
