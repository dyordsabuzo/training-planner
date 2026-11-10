import { describe, expect, it } from "vitest";
import { buildPublicPlan, buildPublicSession, publicPlanSchema, publicSessionData } from "./publicPlans";

const sourceData = {
  exercises: {
    Squat: { name: "Squat", targetWeight: 60, videoLink: "v", alternatives: ["Lunge", "Gone"], notes: "private", visibility: "orgs" },
    Lunge: { name: "Lunge", targetWeight: 20, notes: "private" },
  },
  supersets: {
    Legs: { name: "Legs", exercises: ["Squat"], rest: 90, sessions: ["Day B"], previousNames: ["Old"] },
  },
  sessions: {
    "Day B": {
      name: "Day B",
      supersets: ["Legs"],
      groups: [{ name: "Finisher", exercises: ["Lunge"], sets: 2, reps: 10, percent: 0, rpe: 0, rest: 60, leftRight: true, sideRest: 15 }],
      sharedWithOrgs: ["x"],
    },
    "Day A": { name: "Day A", supersets: ["Legs"] },
    Empty: { name: "Empty", supersets: [] },
  },
};

const plan = {
  id: "p1",
  name: "Strength",
  sessions: ["Day B", "Day A", "Empty", "Missing"],
  weeks: { "Week 1": { targetRep: 8, targetSet: 3, annotation: "Easy", weightRule: { mode: "increase" }, secret: 1 } },
  personalNote: "private",
};

const built = buildPublicPlan(plan, sourceData, "2026-11-10T00:00:00.000Z");
const parsed = publicPlanSchema.parse(JSON.parse(JSON.stringify(built)));

describe("buildPublicPlan", () => {
  it("copies runnable sessions only, in order", () => {
    expect(built.sessions.map((s) => s.name)).toEqual(["Day A", "Day B"]);
    expect(built.sessions[1].units.map((u: any) => u.name)).toEqual(["Legs", "Finisher"]);
  });

  it("copies no private or sharing fields", () => {
    const text = JSON.stringify(built);
    ["private", "visibility", "sharedWithOrgs", "previousNames", "secret", "weightRule", "personalNote"].forEach((word) =>
      expect(text).not.toContain(word)
    );
  });

  it("leaves out rest timers, including the switch between sides", () => {
    const text = JSON.stringify(built);
    expect(text).not.toContain('"rest"');
    expect(text).not.toContain("sideRest");
    expect((built.sessions[1].units[1] as any).leftRight).toBe(true);
  });

  it("keeps alternatives that still exist", () => {
    const squat: any = built.sessions[0].units[0].exercises[0];
    expect(squat.exercise.alternatives).toEqual(["Lunge"]);
    expect(built.alternatives).toEqual({ Lunge: { name: "Lunge", targetWeight: 20 } });
  });
});

describe("buildPublicSession", () => {
  const copy = buildPublicSession({ id: "s1", ...sourceData.sessions["Day B"] }, sourceData, "2026-11-10T00:00:00.000Z");

  it("is a one-session open plan named after the session", () => {
    expect(copy).toMatchObject({ planId: "s1", name: "Day B", open: true, weeks: {} });
    expect(copy.sessions.map((s) => s.name)).toEqual(["Day B"]);
    expect(publicPlanSchema.safeParse(JSON.parse(JSON.stringify(copy))).success).toBe(true);
  });

  it("copies no private fields or rest timers", () => {
    const text = JSON.stringify(copy);
    ["private", "sharedWithOrgs", "previousNames", '"rest"', "sideRest"].forEach((word) => expect(text).not.toContain(word));
  });
});

describe("publicSessionData", () => {
  it("fills in the week's targets where a unit has none", () => {
    const data: any = publicSessionData(parsed, parsed.sessions[0], "Week 1");
    expect(data.week).toBe("Week 1");
    expect(data.targetRep).toBe(8);
    expect(data.annotation).toBe("Easy · Public workout — nothing is saved");
    expect((Object.values(data.supersets)[0] as any).targetSet).toBe(3);
  });

  it("keeps a unit's own sets and unit order", () => {
    const data: any = publicSessionData(parsed, parsed.sessions[1], "Week 1");
    expect(Object.values(data.supersets).map((u: any) => [u.name, u.targetSet])).toEqual([
      ["Legs", 3],
      ["Finisher", 2],
    ]);
  });
});

describe("publicSessionData with no sets anywhere", () => {
  it("defaults to 3", () => {
    const data: any = publicSessionData({ ...parsed, weeks: {} }, parsed.sessions[0]);
    expect((Object.values(data.supersets)[0] as any).targetSet).toBe(3);
  });
});

describe("publicPlanSchema", () => {
  it("rejects a malformed document", () => {
    expect(publicPlanSchema.safeParse({ name: "x", open: false, sessions: [{ name: "a", units: [] }] }).success).toBe(false);
  });
});
