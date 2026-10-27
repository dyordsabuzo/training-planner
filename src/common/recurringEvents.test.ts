import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import { cleanEventInput, eventInputErrors, occurrencesOn, occursOn, RecurringEvent } from "./recurringEvents";

const fmt = (d: dayjs.Dayjs) => d.format("YYYY-MM-DD");

const event = (overrides: Partial<RecurringEvent> = {}): RecurringEvent => ({
  id: "e1",
  orgId: "o",
  name: "On-water",
  weekdays: [2, 4], // Tue, Thu
  startDate: "2026-10-01",
  endDate: "2026-10-31",
  createdAt: "x",
  ...overrides,
});

describe("occursOn", () => {
  it("matches the weekdays within the inclusive range", () => {
    expect(occursOn(event(), dayjs("2026-10-27"))).toBe(true); // Tue
    expect(occursOn(event(), dayjs("2026-10-29"))).toBe(true); // Thu
    expect(occursOn(event(), dayjs("2026-10-28"))).toBe(false); // Wed
  });

  it("includes both ends and excludes days outside", () => {
    const e = event({ startDate: "2026-10-06", endDate: "2026-10-29" });
    expect(occursOn(e, dayjs("2026-10-06"))).toBe(true);
    expect(occursOn(e, dayjs("2026-10-29"))).toBe(true);
    expect(occursOn(e, dayjs("2026-10-01"))).toBe(false);
    expect(occursOn(e, dayjs("2026-11-03"))).toBe(false);
  });
});

describe("occurrencesOn", () => {
  const today = dayjs();
  const everyDay = (overrides: Partial<RecurringEvent> = {}) =>
    event({
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      startDate: fmt(today.subtract(30, "day")),
      endDate: fmt(today.add(30, "day")),
      ...overrides,
    });

  it("is pending today, overdue on a past day and has no status in the future", () => {
    expect(occurrencesOn([everyDay()], today)[0].status).toBe("pending");
    expect(occurrencesOn([everyDay()], today.subtract(1, "day"))[0].status).toBe("overdue");
    expect(occurrencesOn([everyDay()], today.add(1, "day"))[0].status).toBeNull();
  });

  it("uses the confirmed answer for that day", () => {
    const past = today.subtract(2, "day");
    const e = everyDay({ attendance: { [fmt(past)]: "missed", [fmt(today)]: "attended" } });
    expect(occurrencesOn([e], past)[0].status).toBe("missed");
    expect(occurrencesOn([e], today)[0].status).toBe("attended");
  });

  it("orders by start time, untimed last", () => {
    const events = [
      everyDay({ id: "c", name: "Untimed" }),
      everyDay({ id: "b", name: "Evening", startTime: "18:00" }),
      everyDay({ id: "a", name: "Morning", startTime: "06:30" }),
    ];
    expect(occurrencesOn(events, today).map((o) => o.event.id)).toEqual(["a", "b", "c"]);
  });
});

describe("event input", () => {
  const valid = { name: "On-water", weekdays: [4, 2, 2], startDate: "2026-10-01", endDate: "2026-10-01" };

  it("cleans valid input, dropping empty optionals and sorting weekdays", () => {
    expect(cleanEventInput({ ...valid, startTime: "", location: " ", notes: "Bring PFD" })).toEqual({
      ...valid,
      weekdays: [2, 4],
      notes: "Bring PFD",
    });
  });

  it("rejects a blank name, no weekdays, an end before the start and a bad time", () => {
    expect(
      eventInputErrors({ ...valid, name: " ", weekdays: [], endDate: "2026-09-30", startTime: "25:00" })
    ).toEqual({
      name: expect.any(String),
      weekdays: expect.any(String),
      endDate: expect.any(String),
      startTime: expect.any(String),
    });
    expect(eventInputErrors(valid)).toEqual({});
  });
});
