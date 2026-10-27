import dayjs, { Dayjs } from "dayjs";
import { openPlanDoneSessions, sessionDueStatus } from "./planSessions";
import { HistoryRun, historyRuns } from "./sessionStats";

export type ScheduledSession = {
  plan: string;
  session: string;
  done: boolean;
  overdue: boolean;
  optional: boolean;
};
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

type AgendaSources = { plans: any; sessions: any; userdata: any };

// Every dated session across the user's plans, with its done/overdue state.
const datedSessions = ({ plans, sessions, userdata }: AgendaSources) =>
  Object.entries(plans ?? {}).flatMap(([planName, plan]: [string, any]) =>
    ((plan?.sessions ?? []) as string[])
      .filter((session) => !!sessions?.[session]?.date)
      .map((session) => {
        const date: string = sessions[session].date;
        const optional = sessions[session].optional === true;
        const status = sessionDueStatus(date, isDone(userdata, planName, plan, session), optional);
        return { plan: planName, session, date, done: status === "done", overdue: status === "overdue", optional };
      })
  );

// Dated sessions falling on `day`, and runs completed that day.
export const dayAgenda = (day: Dayjs, sources: AgendaSources): DayAgenda => {
  const scheduled = datedSessions(sources)
    .filter(({ date }) => dayjs(date).isSame(day, "day"))
    .map(({ plan, session, done, overdue, optional }) => ({ plan, session, done, overdue, optional }));
  const completed = historyRuns(sources.userdata).filter(
    (run) => !!run.completedAt && dayjs(run.completedAt).isSame(day, "day")
  );
  return { scheduled, completed };
};

export type MissedSession = ScheduledSession & { date: string };

// Sessions whose date has passed without being done, oldest first.
export const missedSessions = (sources: AgendaSources): MissedSession[] =>
  datedSessions(sources)
    .filter((s) => s.overdue)
    .sort((a, b) => a.date.localeCompare(b.date) || a.session.localeCompare(b.session));

// Overdue wins, then anything still planned, then done. An optional session
// left undone on a past day leaves no mark.
export const dayStatus = ({ scheduled, completed }: DayAgenda, day: Dayjs): DayStatus => {
  const isPast = day.isBefore(dayjs(), "day");
  if (scheduled.some((s) => s.overdue)) return "overdue";
  if (scheduled.some((s) => !s.done && !(s.optional && isPast))) return "planned";
  if (scheduled.some((s) => s.done) || completed.length > 0) return "done";
  return null;
};
