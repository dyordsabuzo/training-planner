import { z } from "zod";
import dayjs, { Dayjs } from "dayjs";

// A client's own regular commitment (e.g. on-water training every Tue/Thu),
// stored at userdata/{uid}/events/{eventId} tagged with the active org (see
// the dragonbeat rules). Attendance is kept per day on the event doc.
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const eventInputSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a name."),
    // 0 = Sunday .. 6 = Saturday (dayjs .day()).
    weekdays: z.array(z.number().int().min(0).max(6)).min(1, "Pick at least one day."),
    startDate: z.string().regex(DATE, "Pick a start date."),
    endDate: z.string().regex(DATE, "Pick an end date."),
    startTime: z
      .string()
      .optional()
      .transform((value) => value || undefined)
      .refine((value) => value === undefined || TIME.test(value), "Use HH:mm."),
    location: optionalText,
    notes: optionalText,
  })
  .refine((e) => e.endDate >= e.startDate, { path: ["endDate"], message: "End date must be on or after the start date." });

export type EventInput = z.input<typeof eventInputSchema>;
export type Attendance = "attended" | "missed";

export type RecurringEvent = z.output<typeof eventInputSchema> & {
  id: string;
  orgId: string;
  attendance?: Record<string, Attendance>;
  createdAt: string;
};

export type EventStatus = Attendance | "pending" | "overdue";
// Future occurrences have no status yet.
export type EventOccurrence = { event: RecurringEvent; status: EventStatus | null };

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const eventDay = (day: Dayjs) => day.format("YYYY-MM-DD");

// Validated input without the unset fields (Firestore rejects undefined).
export const cleanEventInput = (input: EventInput) => {
  const parsed = eventInputSchema.parse(input);
  return Object.fromEntries(
    Object.entries({ ...parsed, weekdays: Array.from(new Set(parsed.weekdays)).sort((a, b) => a - b) }).filter(
      ([, value]) => value !== undefined
    )
  ) as z.output<typeof eventInputSchema>;
};

// First error per field, for the form.
export const eventInputErrors = (input: EventInput): Partial<Record<keyof EventInput, string>> => {
  const result = eventInputSchema.safeParse(input);
  if (result.success) return {};
  const errors: Partial<Record<keyof EventInput, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof EventInput;
    errors[field] ??= issue.message;
  }
  return errors;
};

// Within the inclusive date range and on one of the event's weekdays.
export const occursOn = (event: RecurringEvent, day: Dayjs) => {
  const date = eventDay(day);
  return date >= event.startDate && date <= event.endDate && event.weekdays.includes(day.day());
};

// Events falling on `day`, by start time (untimed last), with their status:
// a confirmed answer wins; otherwise today is pending and a past day overdue.
export const occurrencesOn = (events: RecurringEvent[], day: Dayjs): EventOccurrence[] => {
  const date = eventDay(day);
  const today = eventDay(dayjs());
  return events
    .filter((event) => occursOn(event, day))
    .sort((a, b) => (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99") || a.name.localeCompare(b.name))
    .map((event) => {
      const answer = event.attendance?.[date];
      const status: EventStatus | null = answer ?? (date === today ? "pending" : date < today ? "overdue" : null);
      return { event, status };
    });
};
