import { describe, expect, it } from "vitest";
import { resolveSession, sessionUnitKeys, sessionUnitNames } from "./resolveSessionSupersets";

const sourceData = {
  exercises: {
    Squat: { name: "Squat", targetWeight: 60 },
    Lunge: { name: "Lunge", targetWeight: 20 },
  },
  supersets: {
    Legs: { name: "Legs", exercises: ["Squat", "Lunge"], targetSet: "4", targetRep: "8" },
  },
};

describe("resolveSession with groups", () => {
  const session = {
    groups: [
      { name: "Heavy", exercises: ["Squat"], sets: 5, reps: 5, percent: 80, rpe: 8 },
      { name: "Accessory", exercises: ["Lunge", "Missing"], sets: 3, reps: 12, percent: 0, rpe: 0 },
    ],
  };

  it("applies percent to the reference weight and sets reps/sets/RPE", () => {
    const units = resolveSession(sourceData, session, { referenceWeight: () => 100 });
    expect(units.Heavy.targetSet).toBe(5);
    expect(units.Heavy.targetRep).toBe(5);
    expect(units.Heavy.annotation).toBe("RPE 8");
    expect(units.Heavy.exercises[0].targetWeight).toBe(80);
  });

  it("falls back to stored weight with no percent and skips missing exercises", () => {
    const units = resolveSession(sourceData, session, { referenceWeight: () => undefined });
    expect(units.Heavy.exercises[0].targetWeight).toBe(48);
    expect(units.Accessory.exercises).toHaveLength(1);
    expect(units.Accessory.exercises[0].targetWeight).toBe(20);
  });

  it("uses group names as unit names", () => {
    expect(sessionUnitNames(session)).toEqual(["Heavy", "Accessory"]);
  });
});

describe("resolveSession with a time-measured group", () => {
  const session = {
    groups: [
      {
        name: "Plank",
        exercises: ["Squat"],
        sets: 3,
        reps: 0,
        measure: "time" as const,
        time: 45,
        percent: 0,
        rpe: 0,
      },
    ],
  };

  it("resolves to a Time-based unit with targetTime and no targetRep", () => {
    const units = resolveSession(sourceData, session);
    expect(units.Plank.type).toBe("Time-based");
    expect(units.Plank.targetTime).toBe(45);
    expect(units.Plank.targetRep).toBeUndefined();
    expect(units.Plank.targetDistance).toBeUndefined();
  });

  it("marks reps/distance groups as Rep-based", () => {
    const repsUnits = resolveSession(sourceData, {
      groups: [{ name: "Reps", exercises: ["Squat"], sets: 3, reps: 10, percent: 0, rpe: 0 }],
    });
    expect(repsUnits.Reps.type).toBe("Rep-based");
  });
});

describe("rest between sides", () => {
  it("passes sideRest through regardless of leftRight", () => {
    const withBoth = resolveSession(sourceData, {
      groups: [
        {
          name: "Rows",
          exercises: ["Squat"],
          sets: 3,
          reps: 10,
          percent: 0,
          rpe: 0,
          leftRight: true,
          sideRest: 15,
        },
      ],
    });
    expect(withBoth.Rows.leftRight).toBe(true);
    expect(withBoth.Rows.sideRest).toBe(15);

    const withoutLeftRight = resolveSession(sourceData, {
      groups: [{ name: "Deadlift", exercises: ["Squat"], sets: 3, reps: 10, percent: 0, rpe: 0 }],
    });
    expect(withoutLeftRight.Deadlift.leftRight).toBe(false);
    expect(withoutLeftRight.Deadlift.sideRest).toBe(0);
  });
});

describe("supersets and groups together", () => {
  it("runs supersets then groups", () => {
    const mixed = { supersets: ["Legs"], groups: [{ name: "Core", exercises: ["Lunge"], sets: 2, reps: 10, percent: 0, rpe: 0 }] };
    expect(sessionUnitNames(mixed)).toEqual(["Legs", "Core"]);
    expect(Object.keys(resolveSession(sourceData, mixed))).toEqual(["Legs", "Core"]);
  });

  it("still resolves superset-only sessions", () => {
    expect(Object.keys(resolveSession(sourceData, { supersets: ["Legs"] }))).toEqual(["Legs"]);
  });
});

describe("groups with the same name", () => {
  const group = (name: string, exercise: string) => ({
    name,
    exercises: [exercise],
    sets: 2,
    reps: 8,
    percent: 0,
    rpe: 0,
  });

  it("gives each repeated group its own key but keeps the display name", () => {
    const session = { groups: [group("Warm-up", "Squat"), group("Warm-up", "Lunge")] };
    expect(sessionUnitKeys(session)).toEqual(["Warm-up", "Warm-up #2"]);
    expect(sessionUnitNames(session)).toEqual(["Warm-up", "Warm-up"]);

    const units = resolveSession(sourceData, session);
    expect(Object.keys(units)).toEqual(["Warm-up", "Warm-up #2"]);
    expect(units["Warm-up #2"].name).toBe("Warm-up");
    expect(units["Warm-up #2"].exercises[0].exercise.name).toBe("Lunge");
  });

  it("keeps group keys clear of superset names", () => {
    const session = { supersets: ["Legs"], groups: [group("Legs", "Squat")] };
    expect(sessionUnitKeys(session)).toEqual(["Legs", "Legs #2"]);
  });
});
