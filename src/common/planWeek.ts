import dayjs, { Dayjs } from "dayjs";

export const toDate = (value: any): Dayjs | null => {
  if (!value) {
    return null;
  }
  const date = dayjs(typeof value.toDate === "function" ? value.toDate() : value);
  return date.isValid() ? date : null;
};

// A plan has no explicit "current week" field, so it's derived from startDate:
// week N covers the 7-day span starting N weeks after startDate.
export const getCurrentWeekNumber = (plan: any): number | null => {
  const startDate = toDate(plan?.startDate);
  const totalWeeks = Object.keys(plan?.weeks ?? {}).length;
  if (!startDate || totalWeeks === 0) {
    return null;
  }

  const daysElapsed = dayjs().startOf("day").diff(startDate.startOf("day"), "day");
  if (daysElapsed < 0) {
    return null;
  }

  const weekIndex = Math.floor(daysElapsed / 7);
  return weekIndex < totalWeeks ? weekIndex : null;
};
