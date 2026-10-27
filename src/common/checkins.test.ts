import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import {
  checkinSummary,
  cleanCheckin,
  hasAnswers,
  readinessFlags,
} from "./checkins";

describe("cleanCheckin", () => {
  it("drops unset answers", () => {
    expect(cleanCheckin({ mood: 4, energy: undefined })).toEqual({ mood: 4 });
  });

  it("rejects out-of-range and fractional answers", () => {
    expect(() => cleanCheckin({ energy: 6 })).toThrow();
    expect(() => cleanCheckin({ soreness: 2.5 })).toThrow();
    expect(() => cleanCheckin({ sleepHours: 7.25 })).toThrow();
    expect(() => cleanCheckin({ sleepHours: 25 })).toThrow();
  });

  it("strips fields it doesn't know", () => {
    expect(cleanCheckin({ mood: 3, note: "sore knee" } as any)).toEqual({
      mood: 3,
    });
  });
});

describe("hasAnswers", () => {
  it("is false for missing or empty check-ins", () => {
    expect(hasAnswers(undefined)).toBe(false);
    expect(hasAnswers({})).toBe(false);
    expect(hasAnswers({ sleepHours: 0 })).toBe(true);
  });
});

describe("checkinSummary", () => {
  it("lists answered parts in order", () => {
    expect(
      checkinSummary({
        soreness: 2,
        sleepHours: 7.5,
        sleepQuality: 3,
        mood: 4,
        energy: 5,
      }),
    ).toEqual([
      "Mood: Good",
      "7.5 h sleep (Okay)",
      "Energy: Great",
      "Soreness: Light",
    ]);
    expect(checkinSummary({ sleepQuality: 2 })).toEqual(["Sleep: Low"]);
  });
});

describe("readinessFlags", () => {
  const today = dayjs("2026-10-27");

  it("averages the last 3 days", () => {
    const checkins = {
      "2026-10-27": { sleepHours: 5, energy: 2, soreness: 4 },
      "2026-10-26": { sleepHours: 6, energy: 2, soreness: 5 },
      "2026-10-25": { sleepHours: 5.5 },
    };
    expect(readinessFlags(checkins, today)).toEqual([
      "Short on sleep",
      "Low energy",
      "Very sore",
    ]);
  });

  it("ignores older days and stays quiet when fine", () => {
    expect(readinessFlags({ "2026-10-24": { sleepHours: 3 } }, today)).toEqual(
      [],
    );
    expect(
      readinessFlags(
        { "2026-10-27": { sleepHours: 8, energy: 4, soreness: 2 } },
        today,
      ),
    ).toEqual([]);
  });
});
