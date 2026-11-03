import { isListed } from "../common/sharing";
import { buildRelationshipGraph, getDirectReferencers, nodeId } from "./buildRelationshipGraph";

export const countListed = (items: any) => Object.values(items ?? {}).filter(isListed).length;

// Numbers for the Manage hero. Counts the same way the listings do, so a hero
// tile and its list header always agree.
export const setupSummary = (sourceData: any) => {
  const { edges } = buildRelationshipGraph(sourceData);
  return {
    exercises: countListed(sourceData?.exercises),
    supersets: countListed(sourceData?.supersets),
    sessions: countListed(sourceData?.sessions),
    plans: countListed(sourceData?.plans),
    unusedExercises: Object.entries(sourceData?.exercises ?? {}).filter(
      ([name, exercise]) =>
        isListed(exercise) && getDirectReferencers(nodeId("exercise", name), edges).length === 0
    ).length,
  };
};
