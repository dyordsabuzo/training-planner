import { describe, expect, it } from "vitest";
import { completedRuns, exerciseOccurrences, formatSet, historyRuns, progressVsPrevious, summariseRun } from "./sessionStats";

const logged = {
  Legs: {
    Squat: {
      1: { targetRep: "5", targetWeight: 100 },
      2: { targetRep: "5", targetWeight: 105 },
    },
  },
  Finisher: {
    Row: { 1: { targetDistance: 400 } },
  },
};

describe("summariseRun", () => {
  it("totals sets, reps, volume and distance", () => {
    const { totals } = summariseRun(logged);
    expect(totals).toEqual({ sets: 3, reps: 10, volume: 1025, distance: 400 });
  });

  it("keeps sets in order per exercise", () => {
    const { units } = summariseRun(logged);
    expect(units[0].exercises[0].sets.map((s) => s.set)).toEqual([1, 2]);
  });
});

describe("completedRuns", () => {
  it("lists every logged session of a plan, newest week first", () => {
    const userdata = {
      Plan: {
        "Week 1": { A: logged },
        "Week 2": { B: logged },
      },
    };
    expect(completedRuns(userdata, "Plan").map((r) => `${r.week}/${r.session}`)).toEqual([
      "Week 2/B",
      "Week 1/A",
    ]);
  });
});

describe("exerciseOccurrences", () => {
  it("finds an exercise in other sessions across plans, skipping non-plan fields", () => {
    const userdata = {
      id: "uid-1",
      Plan: { "Week 1": { A: logged } },
      Other: { "Week 3": { C: { Legs: { Squat: { 1: { targetRep: 8, targetWeight: 90 } } } } } },
    };
    const found = exerciseOccurrences(userdata, "Squat");
    expect(found.map((o) => `${o.plan}/${o.week}/${o.session}`)).toEqual([
      "Other/Week 3/C",
      "Plan/Week 1/A",
    ]);
    expect(found[0].sets.map(formatSet)).toEqual(["90 kg × 8 reps"]);
  });
});

describe("historyRuns", () => {
  it("lists runs across plans, most recent first, skipping reserved keys", () => {
    const userdata = {
      id: "uid-1",
      inProgress: { plan: "Plan", data: {} },
      Plan: {
        "Week 2": { B: { ...logged, meta: { completedAt: "2030-02-01T10:00:00.000Z" } } },
        "Week 10": { A: { ...logged, mood: { before: {} }, meta: { completedAt: "2030-03-01T10:00:00.000Z" } } },
      },
      Other: { Open: { C: logged } },
    };
    const runs = historyRuns(userdata);
    expect(runs.map((r) => `${r.plan}/${r.week}/${r.session}`)).toEqual([
      "Plan/Week 10/A",
      "Plan/Week 2/B",
      "Other/Open/C",
    ]);
    expect(runs[2].completedAt).toBeUndefined();
  });

  it("ignores meta when summarising a run", () => {
    expect(summariseRun({ ...logged, meta: { completedAt: "x" } }).totals.sets).toBe(3);
  });
});

describe("progressVsPrevious", () => {
  it("reports weight and rep increases against the previous run", () => {
    const current = [{ set: 1, weight: 105, reps: 5 }];
    const previous = [{ set: 1, weight: 100, reps: 8 }];
    expect(progressVsPrevious(current, previous)).toEqual([
      "Weight increased from 100 kg to 105 kg",
    ]);
    expect(progressVsPrevious([{ set: 1, weight: 100, reps: 10 }], previous)).toEqual([
      "Reps increased from 8 to 10",
    ]);
  });

  it("is empty without a previous run or with no change", () => {
    expect(progressVsPrevious([{ set: 1, weight: 100, reps: 8 }])).toEqual([]);
    expect(progressVsPrevious([{ set: 1, weight: 100, reps: 8 }], [{ set: 1, weight: 100, reps: 8 }])).toEqual([]);
  });
});
