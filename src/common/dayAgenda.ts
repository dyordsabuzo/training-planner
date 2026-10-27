import dayjs, { Dayjs } from "dayjs";
import { openPlanDoneSessions, sessionDueStatus } from "./planSessions";
import { HistoryRun, historyRuns } from "./sessionStats";

export type ScheduledSession = { plan: string; session: string; done: boolean; overdue: boolean };
export type DayAgenda = { scheduled: ScheduledSession[]; completed: HistoryRun[] };
export type DayStatus = "done" | "planned" | "overdue" | null;

// Monday to Sunday of the anchor's week.
export const weekDays = (anchor: Dayjs): Dayjs[] => {
  const monday = anchor.startOf("day").subtract((anchor.day() + 6) % 7, "day");
  return Array.from({ length: 7 }, (_, i) => monday.add(i, "day"));
};

// Open plans log under OPEN_WEEK; weekly plans count a session done once it's
// logged in any week.
const isDone = (userdata: any, planName: string, plan: any, session: string) =>
  plan.open
    ? openPlanDoneSessions(userdata, planName).includes(session)
    : Object.values(userdata?.[planName] ?? {}).some((week: any) => !!week?.[session]);

// Dated sessions falling on `day`, and runs completed that day.
export const dayAgenda = (
  day: Dayjs,
  { plans, sessions, userdata }: { plans: any; sessions: any; userdata: any }
): DayAgenda => {
  const scheduled = Object.entries(plans ?? {}).flatMap(([planName, plan]: [string, any]) =>
    ((plan?.sessions ?? []) as string[])
      .filter((session) => {
        const date = sessions?.[session]?.date;
        return !!date && dayjs(date).isSame(day, "day");
      })
      .map((session) => {
        const status = sessionDueStatus(sessions[session].date, isDone(userdata, planName, plan, session));
        return { plan: planName, session, done: status === "done", overdue: status === "overdue" };
      })
  );
  const completed = historyRuns(userdata).filter(
    (run) => !!run.completedAt && dayjs(run.completedAt).isSame(day, "day")
  );
  return { scheduled, completed };
};

// Overdue wins, then anything still planned, then done.
export const dayStatus = ({ scheduled, completed }: DayAgenda): DayStatus => {
  if (scheduled.some((s) => s.overdue)) return "overdue";
  if (scheduled.some((s) => !s.done)) return "planned";
  if (scheduled.length > 0 || completed.length > 0) return "done";
  return null;
};
