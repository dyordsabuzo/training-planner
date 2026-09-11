// Resolves a session's superset names (and each superset's exercise names)
// against sourceData into the enriched, runnable shape ExercisePage expects.
// Shared by the real training flow (SessionPage.selectSession) and the
// Manage > Sessions "simulate" flow (SimulateSessionPage), which has no
// plan/week seed values to carry over.
export const resolveSessionSupersets = (
  sourceData: any,
  session: string,
  seed: { targetRep?: any; targetSet?: any; annotation?: any } = {}
) => {
  let supersets = {};
  const sessionSupersets = sourceData.sessions[session].supersets;

  sessionSupersets.forEach((s: string) => {
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
        targetRep,
        targetSet,
        annotation,
        rest,
      },
    };
  });

  return supersets;
};
