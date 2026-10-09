import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import { sessionDueStatus, sortPlansByCreated, sortSessionsByDate } from "./planSessions";

const sessions = {
  Late: { date: "2030-05-02" },
  Early: { date: "2030-01-10" },
  Undated: {},
};

describe("sortSessionsByDate", () => {
  it("orders by date with undated sessions last", () => {
    expect(sortSessionsByDate(["Undated", "Late", "Early"], sessions)).toEqual([
      "Early",
      "Late",
      "Undated",
    ]);
  });
});

describe("sessionDueStatus", () => {
  it("is done once logged, regardless of date", () => {
    expect(sessionDueStatus("2000-01-01", true)).toBe("done");
  });

  it("is overdue when the date has passed and it isn't done", () => {
    expect(sessionDueStatus("2000-01-01", false)).toBe("overdue");
  });

  it("is not flagged when the date is today or later", () => {
    expect(sessionDueStatus(dayjs().format("YYYY-MM-DD"), false)).toBeNull();
    expect(sessionDueStatus(undefined, false)).toBeNull();
  });
});

describe("sortPlansByCreated", () => {
  it("lists the newest creation date first and undated plans last", () => {
    const plans = {
      Old: { createdAt: "2026-01-01T00:00:00.000Z" },
      Newest: { createdAt: "2027-03-01T00:00:00.000Z" },
      Undated: {},
      Middle: { createdAt: "2026-09-01T00:00:00.000Z" },
    };
    expect(sortPlansByCreated(plans).map(([name]) => name)).toEqual([
      "Newest",
      "Middle",
      "Old",
      "Undated",
    ]);
  });
});
