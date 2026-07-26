// Matches /training-planner/train/<sessionId> — the live, in-progress workout
// screens (ExercisePage and its SummaryPage transitions), as opposed to the
// bare /training-planner/train setup/selection screen.
export const isTrainSessionPath = (pathname: string) =>
  /^\/training-planner\/train\/[^/]+$/.test(pathname);
