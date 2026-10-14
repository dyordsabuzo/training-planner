import { describe, expect, it } from "vitest";
import {
  EXAMPLE_CYCLE,
  buildWeek,
  computeCycleWeek,
  getLastLoggedWeight,
  getLastSessionWeight,
  getWeightForRule,
} from "./planCycle";

const plan = { baselineSet: "3", baselineRep: "10", baselineTime: "0", cycle: EXAMPLE_CYCLE };

describe("computeCycleWeek", () => {
  it("follows baseline -> weight -> rep -> set -> deload", () => {
    const weeks = [0, 1, 2, 3, 4].map((i) => computeCycleWeek(plan, i)!);
    expect(weeks.map((w) => [w.targetSet, w.targetRep])).toEqual([
      [3, 10],
      [3, 10],
      [3, 11],
      [4, 11],
      [3, 10], // deload back to baseline set/rep
    ]);
    expect(weeks.map((w) => w.weightRule.mode)).toEqual([
      "define",
      "increase",
      "hold",
      "hold",
      "hold",
    ]);
    expect(weeks[1].weightRule.amount).toBe(5);
  });

  it("repeats the cycle", () => {
    expect(computeCycleWeek(plan, 5)!.targetRep).toBe(10);
    expect(computeCycleWeek(plan, 7)!.targetRep).toBe(11);
  });

  it("falls back to baseline weeks without a cycle", () => {
    expect(buildWeek({ ...plan, cycle: [] }, 2)).toMatchObject({
      weekNumber: 2,
      targetSet: "3",
      targetRep: "10",
    });
  });
});

describe("weights", () => {
  const userdata = {
    P: { "Week 1": { S: { SS: { Squat: { 1: { targetWeight: "40" }, 2: { targetWeight: "42" } } } } } },
  };

  it("finds the last logged weight before a week", () => {
    expect(getLastLoggedWeight(userdata, "P", "Week 2", "Squat")).toBe(42);
    expect(getLastLoggedWeight(userdata, "P", "Week 1", "Squat")).toBeNull();
  });

  it("applies rules", () => {
    expect(getWeightForRule({ mode: "increase", amount: 2 }, 42, 0)).toBe(44);
    expect(getWeightForRule({ mode: "hold" }, 44, 0)).toBe(44);
    expect(getWeightForRule({ mode: "define" }, 44, 30)).toBe(30);
    expect(getWeightForRule({ mode: "hold" }, null, 30)).toBe(30);
  });
});

describe("getLastSessionWeight", () => {
  const dl = (weight: string) => ({ Deadlift: { 1: { targetWeight: "60" }, 2: { targetWeight: weight } } });
  const userdata = {
    id: "uid",
    P: {
      "Week 1": {
        "Session 2": { SS: dl("100"), meta: { completedAt: "2026-01-02T00:00:00Z" } },
        "Session 3": {
          SS: { Squat: { 1: { targetWeight: "80" } } },
          mood: { before: 3 },
          meta: { completedAt: "2026-01-03T00:00:00Z" },
        },
      },
    },
    Other: { "Week 9": { S: { SS: dl("200"), meta: { completedAt: "2026-02-01T00:00:00Z" } } } },
  };

  it("uses the last session of the plan that included the exercise", () => {
    expect(getLastSessionWeight(userdata, "P", "Deadlift")).toBe(100);
  });

  it("picks the most recently completed run", () => {
    const newer = {
      ...userdata,
      P: {
        ...userdata.P,
        "Week 0": { S: { SS: dl("110"), meta: { completedAt: "2026-01-05T00:00:00Z" } } },
      },
    };
    expect(getLastSessionWeight(newer, "P", "Deadlift")).toBe(110);
  });

  it("returns null when the exercise or plan has no logs", () => {
    expect(getLastSessionWeight(userdata, "P", "Bench")).toBeNull();
    expect(getLastSessionWeight(userdata, "Missing", "Deadlift")).toBeNull();
  });
});
