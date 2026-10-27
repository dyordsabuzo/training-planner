import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import { dayAgenda, dayStatus, missedSessions, weekDays } from "./dayAgenda";
import { OPEN_WEEK } from "./planCycle";

describe("weekDays", () => {
  it("returns Monday to Sunday of the anchor's week", () => {
    const days = weekDays(dayjs("2026-10-29")).map((d) => d.format("YYYY-MM-DD"));
    expect(days).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
  });

  it("keeps a Sunday in the week that started the Monday before", () => {
    expect(weekDays(dayjs("2026-11-01"))[0].format("YYYY-MM-DD")).toBe("2026-10-26");
  });
});

describe("dayAgenda", () => {
  const today = dayjs().format("YYYY-MM-DD");
  const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
  const lastWeek = dayjs().subtract(7, "day").format("YYYY-MM-DD");
  const plans = {
    Open: { open: true, sessions: ["Done", "Missed", "Today", "Undated"] },
    Weekly: { sessions: ["Legs"] },
  };
  const sessions = {
    Done: { date: lastWeek },
    Missed: { date: yesterday },
    Today: { date: today },
    Undated: {},
    Legs: { date: lastWeek },
  };
  const userdata = {
    Open: {
      [OPEN_WEEK]: {
        Done: { meta: { completedAt: `${lastWeek}T08:30:00` } },
        Skip: { meta: { skipped: true, skippedAt: `${today}T08:00:00` } },
      },
    },
    Weekly: { "Week 1": { Legs: { meta: { completedAt: `${lastWeek}T18:00:00` } } } },
  };
  const ctx = { plans, sessions, userdata };

  it("matches sessions dated on the same day", () => {
    expect(dayAgenda(dayjs(), ctx).scheduled).toEqual([
      { plan: "Open", session: "Today", done: false, overdue: false },
    ]);
  });

  it("marks done and overdue sessions", () => {
    expect(dayAgenda(dayjs(yesterday), ctx).scheduled).toEqual([
      { plan: "Open", session: "Missed", done: false, overdue: true },
    ]);
    expect(dayAgenda(dayjs(lastWeek), ctx).scheduled).toEqual([
      { plan: "Open", session: "Done", done: true, overdue: false },
      { plan: "Weekly", session: "Legs", done: true, overdue: false },
    ]);
  });

  it("lists missed sessions across plans, oldest first", () => {
    const older = dayjs().subtract(3, "day").format("YYYY-MM-DD");
    const withOlder = {
      ...ctx,
      plans: { ...plans, Weekly: { sessions: ["Legs", "Arms"] } },
      sessions: { ...sessions, Arms: { date: older } },
    };
    expect(missedSessions(withOlder)).toEqual([
      { plan: "Weekly", session: "Arms", date: older, done: false, overdue: true },
      { plan: "Open", session: "Missed", date: yesterday, done: false, overdue: true },
    ]);
  });

  it("lists runs completed that day, excluding skipped ones", () => {
    expect(dayAgenda(dayjs(lastWeek), ctx).completed.map((r) => r.session).sort()).toEqual(["Done", "Legs"]);
    expect(dayAgenda(dayjs(), ctx).completed).toEqual([]);
  });
});

describe("dayStatus", () => {
  const run: any = { plan: "P", week: "W", session: "S", logged: {} };
  const s = (done: boolean, overdue: boolean) => ({ plan: "P", session: "S", done, overdue });

  it("ranks overdue, then planned, then done", () => {
    expect(dayStatus({ scheduled: [s(true, false), s(false, true)], completed: [] })).toBe("overdue");
    expect(dayStatus({ scheduled: [s(true, false), s(false, false)], completed: [] })).toBe("planned");
    expect(dayStatus({ scheduled: [s(true, false)], completed: [] })).toBe("done");
    expect(dayStatus({ scheduled: [], completed: [run] })).toBe("done");
    expect(dayStatus({ scheduled: [], completed: [] })).toBeNull();
  });
});
