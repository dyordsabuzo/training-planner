import dayjs, { Dayjs } from "dayjs";
import { weekDays } from "./dayAgenda";
import { HistoryRun } from "./sessionStats";

const FORMAT = "YYYY-MM-DD";
const weekKey = (day: Dayjs) => weekDays(day)[0].format(FORMAT);

// Sessions in the current Monday-to-Sunday week, and how many weeks in a row
// have a run. A current week with no run yet doesn't break the streak, so
// planned rest early in the week doesn't reset it. historyRuns already leaves
// out skipped sessions; runs without a completedAt can't be placed in a week.
export const trainingMomentum = (runs: HistoryRun[], now: Dayjs) => {
  const weeks = runs.flatMap((run) => (run.completedAt ? [weekKey(dayjs(run.completedAt))] : []));
  const active = new Set(weeks);
  const thisWeek = weekKey(now);

  let cursor = weekDays(now)[0];
  if (!active.has(thisWeek)) cursor = cursor.subtract(7, "day");
  let weekStreak = 0;
  while (active.has(cursor.format(FORMAT))) {
    weekStreak += 1;
    cursor = cursor.subtract(7, "day");
  }

  return { sessionsThisWeek: weeks.filter((week) => week === thisWeek).length, weekStreak };
};
