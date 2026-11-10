// A workout whose sets were saved as it went (userdata.inProgress, written per
// set) but which never finished: the app closed or crashed before the final
// save. Finishing, ending or cancelling a run always clears that slot.
export type UnsavedRun = {
  plan: string;
  week: string;
  session: string;
  data: any;
  savedAt?: string;
  sets: number;
  // The session already has results in that week, which saving would replace.
  replacesResults: boolean;
};

const NOT_UNITS = ["mood", "meta"];

// Null when there's nothing to recover. A plan missing from `plans` belongs to
// another org, so it waits until that org is active.
export const unsavedRun = (userdata: any, plans: any): UnsavedRun | null => {
  const { plan, week, session, data, savedAt } = userdata?.inProgress ?? {};
  if (!plan || !week || !session || !plans?.[plan]) return null;
  const sets = Object.values(data ?? {})
    .flatMap((exercises: any) => Object.values(exercises ?? {}))
    .reduce((count: number, logged: any) => count + Object.keys(logged ?? {}).length, 0);
  if (sets === 0) return null;
  const earlier = userdata[plan]?.[week]?.[session] ?? {};
  return {
    plan,
    week,
    session,
    data,
    savedAt,
    sets,
    replacesResults: Object.keys(earlier).some((key) => !NOT_UNITS.includes(key)),
  };
};
