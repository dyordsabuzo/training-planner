import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import { sessionDueStatus, sortSessionsByDate } from "./planSessions";

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
