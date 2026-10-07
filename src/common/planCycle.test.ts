import { describe, expect, it } from "vitest";
import {
  EXAMPLE_CYCLE,
  buildWeek,
  computeCycleWeek,
  getLastLoggedWeight,
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
