// Matches /training-planner/train/<sessionId> — the live, in-progress workout
// screens (ExercisePage and its SummaryPage transitions), as opposed to the
// bare /training-planner/train setup/selection screen — as well as the
// admin simulate route and the public shareable-link route, which both
// render the same screens.
export const isTrainSessionPath = (pathname: string) =>
  /^\/training-planner\/train\/[^/]+$/.test(pathname) ||
  /^\/training-planner\/manage\/simulate\/[^/]+$/.test(pathname) ||
  /^\/training-planner\/share\/[^/]+$/.test(pathname);
