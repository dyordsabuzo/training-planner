export type NodeType = "plan" | "session" | "superset" | "exercise";

export type GraphNode = {
  id: string;
  type: NodeType;
  label: string;
};

export type GraphEdge = {
  source: string;
  target: string;
};

export type GraphColumn = {
  type: NodeType;
  nodes: GraphNode[];
};

export type RelationshipGraph = {
  columns: GraphColumn[];
  edges: GraphEdge[];
};

export const nodeId = (type: NodeType, name: string) => `${type}:${name}`;

export const buildRelationshipGraph = (sourceData: any): RelationshipGraph => {
  const plans = sourceData?.plans ?? {};
  const sessions = sourceData?.sessions ?? {};
  const supersets = sourceData?.supersets ?? {};
  const exercises = sourceData?.exercises ?? {};

  const toNodes = (type: NodeType, dict: any): GraphNode[] =>
    Object.keys(dict).map((name) => ({ id: nodeId(type, name), type, label: name }));

  const edges: GraphEdge[] = [];

  Object.values(plans).forEach((plan: any) => {
    (plan?.sessions ?? []).forEach((sessionName: string) => {
      if (sessions[sessionName]) {
        edges.push({
          source: nodeId("plan", plan.name),
          target: nodeId("session", sessionName),
        });
      }
    });
  });

  Object.values(sessions).forEach((session: any) => {
    (session?.supersets ?? []).forEach((supersetName: string) => {
      if (supersets[supersetName]) {
        edges.push({
          source: nodeId("session", session.name),
          target: nodeId("superset", supersetName),
        });
      }
    });
  });

  Object.values(supersets).forEach((superset: any) => {
    (superset?.exercises ?? []).forEach((exerciseName: string) => {
      if (exercises[exerciseName]) {
        edges.push({
          source: nodeId("superset", superset.name),
          target: nodeId("exercise", exerciseName),
        });
      }
    });
  });

  return {
    columns: [
      { type: "plan", nodes: toNodes("plan", plans) },
      { type: "session", nodes: toNodes("session", sessions) },
      { type: "superset", nodes: toNodes("superset", supersets) },
      { type: "exercise", nodes: toNodes("exercise", exercises) },
    ],
    edges,
  };
};

const traverse = (startId: string, adjacency: Map<string, Set<string>>): Set<string> => {
  const visited = new Set<string>();
  const queue = [startId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    adjacency.get(current)?.forEach((next) => {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    });
  }
  return visited;
};

// Direct incoming edges only (not the full ancestor traversal below) — used
// for "used by N" delete-safety messaging, where a single-typed count (e.g.
// "used by 2 supersets") is more honest than a mixed-type ancestor count.
export const getDirectReferencers = (nodeId: string, edges: GraphEdge[]): string[] =>
  edges.filter((e) => e.target === nodeId).map((e) => e.source);

// Highlights only genuine ancestors (upstream, e.g. the Sessions/Plans a Superset
// belongs to) and descendants (downstream, e.g. the Exercises within a Superset) of
// the selected node — not siblings reached only via a shared parent/child (e.g. two
// Sessions that happen to share a Superset shouldn't light each other up).
export const getRelatedNodeIds = (
  startId: string,
  edges: GraphEdge[]
): Set<string> => {
  const forward = new Map<string, Set<string>>();
  const backward = new Map<string, Set<string>>();
  edges.forEach(({ source, target }) => {
    if (!forward.has(source)) forward.set(source, new Set());
    forward.get(source)!.add(target);
    if (!backward.has(target)) backward.set(target, new Set());
    backward.get(target)!.add(source);
  });

  const descendants = traverse(startId, forward);
  const ancestors = traverse(startId, backward);

  return new Set([startId, ...descendants, ...ancestors]);
};
