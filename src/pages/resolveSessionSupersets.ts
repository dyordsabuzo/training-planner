// Resolves a session's superset names (and each superset's exercise names)
// against sourceData into the enriched, runnable shape ExercisePage expects.
// Shared by the real training flow (SessionPage.selectSession), the
// Manage > Sessions "simulate" flow (SimulateSessionPage, no plan/week seed
// values to carry over), and shareable-link snapshot generation (SessionForm,
// where the session being saved may not exist in sourceData yet/as-is).
// Takes the superset name list directly rather than looking it up via
// sourceData.sessions[session], since the caller may be resolving against
// in-progress form state that hasn't been persisted yet.
export const resolveSessionSupersets = (
  sourceData: any,
  supersetNames: string[],
  seed: { targetRep?: any; targetSet?: any; annotation?: any } = {}
) => {
  let supersets = {};

  supersetNames.forEach((s: string) => {
    let { targetRep, targetSet, annotation } = seed;
    let { sessions, rest, tags, ...superset } = sourceData.supersets[s];
    let exercises = superset.exercises
      .filter((e: string) => sourceData.exercises[e])
      .map((e: string) => {
        const exercise = sourceData.exercises[e];
        return {
          exercise,
          targetWeight: exercise.targetWeight || 0,
        };
      });

    if (exercises.length < 2) {
      exercises.push({});
    }

    if (superset.targetRep) {
      targetRep = superset.targetRep;
    }
    if (superset.targetSet) {
      targetSet = superset.targetSet;
    }

    supersets = {
      ...supersets,
      [superset.name]: {
        ...superset,
        exercises,
        ...(targetRep !== undefined && { targetRep }),
        ...(targetSet !== undefined && { targetSet }),
        ...(annotation !== undefined && { annotation }),
        ...(rest !== undefined && { rest }),
      },
    };
  });

  return supersets;
};
