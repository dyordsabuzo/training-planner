import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import { trainingMomentum } from "./trainingMomentum";
import { HistoryRun, historyRuns } from "./sessionStats";

// A Wednesday; its week starts on Monday 2026-11-02.
const now = dayjs("2026-11-04T12:00:00");
const run = (completedAt?: string) => ({ completedAt } as HistoryRun);

describe("trainingMomentum", () => {
  it("is zero with no runs", () => {
    expect(trainingMomentum([], now)).toEqual({ sessionsThisWeek: 0, weekStreak: 0 });
  });

  it("splits weeks at Monday midnight", () => {
    const runs = [run("2026-11-02T00:00:00"), run("2026-11-01T23:59:00")];
    expect(trainingMomentum(runs, now)).toEqual({ sessionsThisWeek: 1, weekStreak: 2 });
  });

  it("counts a Sunday in the week that started the Monday before", () => {
    const sunday = dayjs("2026-11-08T23:00:00");
    expect(trainingMomentum([run("2026-11-02T08:00:00")], sunday)).toEqual({ sessionsThisWeek: 1, weekStreak: 1 });
  });

  it("counts every run this week but each week once in the streak", () => {
    const runs = [run("2026-11-02T08:00:00"), run("2026-11-03T08:00:00"), run("2026-11-04T08:00:00")];
    expect(trainingMomentum(runs, now)).toEqual({ sessionsThisWeek: 3, weekStreak: 1 });
  });

  it("keeps the streak while the current week has no run yet", () => {
    const runs = [run("2026-10-28T08:00:00"), run("2026-10-21T08:00:00")];
    expect(trainingMomentum(runs, now)).toEqual({ sessionsThisWeek: 0, weekStreak: 2 });
  });

  it("ends the streak at a gap", () => {
    const runs = [run("2026-11-03T08:00:00"), run("2026-10-27T08:00:00"), run("2026-10-13T08:00:00")];
    expect(trainingMomentum(runs, now).weekStreak).toBe(2);
  });

  it("has no streak when the last run was before last week", () => {
    expect(trainingMomentum([run("2026-10-20T08:00:00")], now).weekStreak).toBe(0);
  });

  it("ignores runs without completedAt", () => {
    expect(trainingMomentum([run(undefined)], now)).toEqual({ sessionsThisWeek: 0, weekStreak: 0 });
  });

  it("holds across daylight saving changes", () => {
    // US clocks go back on 2026-11-01, Australian ones forward on 2026-10-04.
    const runs = ["11-03", "10-28", "10-21", "10-14", "10-07", "09-30"].map((day) => run(`2026-${day}T08:00:00`));
    expect(trainingMomentum(runs, now).weekStreak).toBe(6);
  });

  it("leaves out skipped sessions via historyRuns", () => {
    const userdata = {
      Plan: {
        "Week 1": {
          Done: { meta: { completedAt: "2026-11-03T08:00:00" } },
          Skip: { meta: { skipped: true, completedAt: "2026-11-03T09:00:00" } },
        },
      },
    };
    expect(trainingMomentum(historyRuns(userdata), now).sessionsThisWeek).toBe(1);
  });
});
