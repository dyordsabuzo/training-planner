import { describe, expect, it } from "vitest";
import { countListed, setupSummary } from "./setupSummary";

describe("countListed", () => {
  it("handles missing collections", () => {
    expect(countListed(undefined)).toBe(0);
  });

  it("skips archived items but keeps linked ones", () => {
    expect(
      countListed({
        a: { name: "a" },
        b: { name: "b", archived: true },
        c: { name: "c", archived: true, linked: { orgId: "o", srcId: "s" } },
      })
    ).toBe(2);
  });
});

describe("setupSummary", () => {
  it("returns zeros while nothing has loaded", () => {
    expect(setupSummary({})).toEqual({
      exercises: 0,
      supersets: 0,
      sessions: 0,
      plans: 0,
      unusedExercises: 0,
    });
  });

  it("counts each section and the exercises no superset uses", () => {
    const summary = setupSummary({
      exercises: { Squat: { name: "Squat" }, Lunge: { name: "Lunge" }, Plank: { name: "Plank" } },
      supersets: { Legs: { name: "Legs", exercises: ["Squat"] } },
      sessions: { "Day 1": { name: "Day 1", supersets: ["Legs"] } },
      plans: { Base: { name: "Base", sessions: ["Day 1"] } },
    });
    expect(summary).toEqual({
      exercises: 3,
      supersets: 1,
      sessions: 1,
      plans: 1,
      unusedExercises: 2,
    });
  });

  it("does not report archived exercises as unused", () => {
    const summary = setupSummary({
      exercises: { Squat: { name: "Squat", archived: true }, Plank: { name: "Plank" } },
    });
    expect(summary.exercises).toBe(1);
    expect(summary.unusedExercises).toBe(1);
  });

  it("treats an exercise used only by an archived superset as used, like the list does", () => {
    const summary = setupSummary({
      exercises: { Squat: { name: "Squat" } },
      supersets: { Old: { name: "Old", exercises: ["Squat"], archived: true } },
    });
    expect(summary.supersets).toBe(0);
    expect(summary.unusedExercises).toBe(0);
  });
});
