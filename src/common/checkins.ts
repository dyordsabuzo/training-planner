import { z } from "zod";
import { Dayjs } from "dayjs";

// One check-in per day, stored at userdata/{uid}/checkins/{YYYY-MM-DD} (see
// the dragonbeat rules). Every answer is optional; ratings are 1-5.
const rating = z.number().int().min(1).max(5);

export const checkinSchema = z.object({
  mood: rating.optional(),
  sleepHours: z.number().min(0).max(24).multipleOf(0.5).optional(),
  sleepQuality: rating.optional(),
  energy: rating.optional(),
  soreness: rating.optional(),
});

export type Checkin = z.infer<typeof checkinSchema>;

export const checkinId = (day: Dayjs) => day.format("YYYY-MM-DD");

// Validated answers without the unset ones (Firestore rejects undefined).
export const cleanCheckin = (input: Checkin): Checkin =>
  Object.fromEntries(
    Object.entries(checkinSchema.parse(input)).filter(
      ([, value]) => value !== undefined,
    ),
  ) as Checkin;

export const hasAnswers = (checkin?: Checkin) =>
  !!checkin && Object.values(cleanCheckin(checkin)).length > 0;

// Same order as the mood RATINGS faces (1 = worst, 5 = best).
export const RATING_LABELS = ["Exhausted", "Low", "Okay", "Good", "Great"];
// Soreness runs the other way: 1 = none, 5 = very sore.
export const SORENESS_LABELS = [
  "None",
  "Light",
  "Moderate",
  "Sore",
  "Very sore",
];

// Short readable parts, e.g. ["Mood: Good", "7.5 h sleep (Okay)", ...].
export const checkinSummary = (checkin?: Checkin): string[] => {
  if (!checkin) return [];
  const label = (value?: number) =>
    value ? RATING_LABELS[value - 1] : undefined;
  const sleep =
    checkin.sleepHours !== undefined
      ? `${checkin.sleepHours} h sleep${checkin.sleepQuality ? ` (${label(checkin.sleepQuality)})` : ""}`
      : checkin.sleepQuality
        ? `Sleep: ${label(checkin.sleepQuality)}`
        : undefined;
  return [
    checkin.mood ? `Mood: ${label(checkin.mood)}` : undefined,
    sleep,
    checkin.energy ? `Energy: ${label(checkin.energy)}` : undefined,
    checkin.soreness
      ? `Soreness: ${SORENESS_LABELS[checkin.soreness - 1]}`
      : undefined,
  ].filter((part): part is string => !!part);
};

const average = (values: (number | undefined)[]) => {
  const present = values.filter((v): v is number => v !== undefined);
  return present.length
    ? present.reduce((a, b) => a + b, 0) / present.length
    : undefined;
};

// Warnings for a trainer from the last 3 days of check-ins (today included).
export const readinessFlags = (
  checkins: Record<string, Checkin>,
  today: Dayjs,
): string[] => {
  const recent = [0, 1, 2]
    .map((back) => checkins[checkinId(today.subtract(back, "day"))])
    .filter((c): c is Checkin => !!c);
  const sleep = average(recent.map((c) => c.sleepHours));
  const energy = average(recent.map((c) => c.energy));
  const soreness = average(recent.map((c) => c.soreness));
  return [
    sleep !== undefined && sleep < 6 ? "Short on sleep" : undefined,
    energy !== undefined && energy <= 2 ? "Low energy" : undefined,
    soreness !== undefined && soreness >= 4 ? "Very sore" : undefined,
  ].filter((flag): flag is string => !!flag);
};
