import dayjs from "dayjs";
import { OPEN_WEEK } from "./planCycle";

// Open plans log every completed run under the OPEN_WEEK key in userdata.
export const openPlanDoneSessions = (userdata: any, planName: string): string[] =>
  Object.keys(userdata?.[planName]?.[OPEN_WEEK] ?? {});

// Orders sessions by their date ("YYYY-MM-DD"); undated ones go last by name.
export const sortSessionsByDate = (names: string[], sessions: any): string[] =>
  [...names].sort((a, b) => {
    const da: string = sessions?.[a]?.date ?? "";
    const db: string = sessions?.[b]?.date ?? "";
    if (da && db) return da.localeCompare(db) || a.localeCompare(b);
    if (da || db) return da ? -1 : 1;
    return a.localeCompare(b);
  });

export const formatSessionDate = (date: string) => dayjs(date).format("ddd, MMM D");

// "done" once logged, "overdue" when its date has passed and it isn't done.
export const sessionDueStatus = (date: string | undefined, done: boolean) => {
  if (done) return "done";
  if (date && dayjs(date).isBefore(dayjs(), "day")) return "overdue";
  return null;
};

// Plans newest first by creation date. Plans created before dates were recorded
// have none, so they go last, by name.
export const sortPlansByCreated = (plans: any): [string, any][] =>
  (Object.entries(plans ?? {}) as [string, any][]).sort(([nameA, a], [nameB, b]) => {
    const createdA: string = a?.createdAt ?? "";
    const createdB: string = b?.createdAt ?? "";
    if (createdA && createdB) {
      return createdB.localeCompare(createdA) || nameA.localeCompare(nameB);
    }
    if (createdA || createdB) return createdA ? -1 : 1;
    return nameA.localeCompare(nameB);
  });
