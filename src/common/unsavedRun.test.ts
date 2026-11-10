import { describe, expect, it } from "vitest";
import { unsavedRun } from "./unsavedRun";

const plans = { Strength: {} };
const inProgress = {
  plan: "Strength",
  week: "Week 1",
  session: "Day 1",
  data: { Legs: { Squat: { 1: {}, 2: {} }, Lunge: { 1: {} } } },
};

describe("unsavedRun", () => {
  it("counts every logged set", () => {
    expect(unsavedRun({ inProgress }, plans)).toMatchObject({ session: "Day 1", sets: 3, replacesResults: false });
  });

  it("finds nothing without a slot, sets or a plan in this org", () => {
    expect(unsavedRun({}, plans)).toBeNull();
    expect(unsavedRun({ inProgress: { ...inProgress, data: {} } }, plans)).toBeNull();
    expect(unsavedRun({ inProgress }, {})).toBeNull();
  });

  it("flags existing results, but not a mood check-in alone", () => {
    const withEntry = (entry: any) => ({ inProgress, Strength: { "Week 1": { "Day 1": entry } } });
    expect(unsavedRun(withEntry({ mood: {}, meta: {} }), plans)?.replacesResults).toBe(false);
    expect(unsavedRun(withEntry({ Legs: {}, meta: {} }), plans)?.replacesResults).toBe(true);
  });
});
