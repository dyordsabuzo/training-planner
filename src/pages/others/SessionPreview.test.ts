import { describe, expect, it } from "vitest";
import { unitTarget } from "./SessionPreview";
import { resolveSession } from "../resolveSessionSupersets";

const sourceData = {
  exercises: {
    Squat: { name: "Squat", targetWeight: 60 },
    Row: { name: "Row", targetWeight: 0 },
    Plank: { name: "Plank", targetWeight: 0 },
  },
  supersets: {
    Legs: { name: "Legs", exercises: ["Squat"], targetSet: "4", targetRep: "8" },
  },
};

const group = (name: string, extra: any) => ({
  name,
  exercises: ["Row"],
  sets: 3,
  reps: 10,
  percent: 0,
  rpe: 0,
  ...extra,
});

describe("unitTarget", () => {
  const units = resolveSession(
    sourceData,
    {
      supersets: ["Legs"],
      groups: [
        group("Reps", {}),
        group("Distance", { measure: "distance", distance: 400 }),
        group("Hold", { exercises: ["Plank"], measure: "time", time: 45 }),
        group("Easy", { measured: false, reps: 0 }),
      ],
    },
    { targetSet: 2 }
  );

  it("shows sets × reps for supersets and rep groups", () => {
    expect(unitTarget(units.Legs)).toBe("4 × 8 reps");
    expect(unitTarget(units.Reps)).toBe("3 × 10 reps");
  });

  it("shows distance and time targets", () => {
    expect(unitTarget(units.Distance)).toBe("3 × 400 m");
    expect(unitTarget(units.Hold)).toBe("3 × 45 s");
  });

  it("falls back to sets alone, or nothing", () => {
    expect(unitTarget(units.Easy)).toBe("3 sets");
    expect(unitTarget({ targetSet: 1 })).toBe("1 set");
    expect(unitTarget({ targetRep: 12 })).toBe("12 reps");
    expect(unitTarget({})).toBeNull();
  });
});
