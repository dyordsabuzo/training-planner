import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SourceDataContext from "../context/SourceDataContext";
import { EmptyState } from "./EmptyState";
import { ExerciseForm } from "../forms/ExerciseForm";
import { SupersetForm } from "../forms/SupersetForm";
import { SessionForm } from "../forms/SessionForm";
import { PlanForm } from "../forms/PlanForm";
import {
  buildRelationshipGraph,
  getRelatedNodeIds,
  GraphEdge,
  NodeType,
} from "./buildRelationshipGraph";

const SWIPE_THRESHOLD = 50;

const columnTheme: Record<NodeType, { title: string; badge: string; selectedRing: string; dot: string }> = {
  plan: {
    title: "Plans",
    badge: "bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-100",
    selectedRing: "ring-primary-600",
    dot: "bg-primary-600",
  },
  session: {
    title: "Sessions",
    badge: "bg-accent-100 text-accent-800 dark:bg-accent-800 dark:text-accent-100",
    selectedRing: "ring-accent-600",
    dot: "bg-accent-600",
  },
  superset: {
    title: "Supersets",
    badge: "bg-success-100 text-success-700 dark:bg-success-700/40 dark:text-success-500",
    selectedRing: "ring-success-600",
    dot: "bg-success-600",
  },
  exercise: {
    title: "Exercises",
    badge: "bg-warning-100 text-warning-700 dark:bg-warning-700/40 dark:text-warning-500",
    selectedRing: "ring-warning-600",
    dot: "bg-warning-600",
  },
};

type NodePosition = { leftX: number; rightX: number; y: number };
type EditingNode = { type: NodeType; name: string };

export const RelationshipMap = () => {
  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const graph = useMemo(() => buildRelationshipGraph(sourceData), [sourceData]);
  const totalNodes = graph.columns.reduce((sum, col) => sum + col.nodes.length, 0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<EditingNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [positions, setPositions] = useState<Map<string, NodePosition>>(new Map());

  const columnCount = graph.columns.length;
  const maxWindowStart = Math.max(0, columnCount - 2);
  const [windowStart, setWindowStart] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goToPrevWindow = () => setWindowStart((w) => Math.max(0, w - 1));
  const goToNextWindow = () => setWindowStart((w) => Math.min(maxWindowStart, w + 1));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) {
      return;
    }
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta <= -SWIPE_THRESHOLD) {
      goToNextWindow();
    } else if (delta >= SWIPE_THRESHOLD) {
      goToPrevWindow();
    }
  };

  const registerNodeRef = (id: string) => (el: HTMLButtonElement | null) => {
    if (el) {
      nodeRefs.current.set(id, el);
    } else {
      nodeRefs.current.delete(id);
    }
  };

  const recomputePositions = () => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const next = new Map<string, NodePosition>();
    nodeRefs.current.forEach((el, id) => {
      const rect = el.getBoundingClientRect();
      next.set(id, {
        leftX: rect.left - containerRect.left,
        rightX: rect.right - containerRect.left,
        y: rect.top - containerRect.top + rect.height / 2,
      });
    });
    setPositions(next);
  };

  useLayoutEffect(() => {
    recomputePositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  useEffect(() => {
    window.addEventListener("resize", recomputePositions);
    return () => window.removeEventListener("resize", recomputePositions);
  }, []);

  useEffect(() => {
    setWindowStart((w) => Math.min(w, maxWindowStart));
  }, [maxWindowStart]);

  const relatedIds = useMemo(
    () => (selectedId ? getRelatedNodeIds(selectedId, graph.edges) : null),
    [selectedId, graph.edges]
  );

  const isDimmed = (id: string) => !!relatedIds && !relatedIds.has(id);
  const isSelected = (id: string) => id === selectedId;

  const edgePath = (edge: GraphEdge) => {
    const from = positions.get(edge.source);
    const to = positions.get(edge.target);
    if (!from || !to) {
      return null;
    }
    const midX = (from.rightX + to.leftX) / 2;
    return `M ${from.rightX} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.leftX} ${to.y}`;
  };

  const isEdgeHighlighted = (edge: GraphEdge) =>
    !relatedIds || (relatedIds.has(edge.source) && relatedIds.has(edge.target));

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-bold text-text-light dark:text-text-dark">Relationships</h2>
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
          Select an item to see how it connects. Double-click an item to edit it.
        </p>
      </div>

      {totalNodes === 0 ? (
        <EmptyState message="Add some exercises, supersets, sessions and plans to see how they connect." />
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark">
          <div className="flex items-center justify-between gap-2 px-3 pt-3">
            <button
              type="button"
              onClick={goToPrevWindow}
              disabled={windowStart === 0}
              aria-label="Show previous columns"
              className="min-h-11 min-w-11 flex items-center justify-center rounded-full
                text-secondary dark:text-secondary-200
                hover:bg-gray-50 dark:hover:bg-gray-800
                disabled:opacity-30 disabled:pointer-events-none
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: maxWindowStart + 1 }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setWindowStart(index)}
                  aria-label={`Show columns ${index + 1} of ${maxWindowStart + 1}`}
                  aria-current={windowStart === index}
                  className={`w-2 h-2 rounded-full transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                    ${windowStart === index ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={goToNextWindow}
              disabled={windowStart === maxWindowStart}
              aria-label="Show next columns"
              className="min-h-11 min-w-11 flex items-center justify-center rounded-full
                text-secondary dark:text-secondary-200
                hover:bg-gray-50 dark:hover:bg-gray-800
                disabled:opacity-30 disabled:pointer-events-none
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>

          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="overflow-hidden p-6"
          >
            <div
              ref={containerRef}
              className="relative flex gap-0 transition-transform duration-300 ease-in-out"
              style={{
                width: `${(columnCount / 2) * 100}%`,
                transform: `translateX(-${windowStart * (100 / columnCount)}%)`,
              }}
            >
              <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
                {graph.edges.map((edge, index) => {
                  const d = edgePath(edge);
                  if (!d) {
                    return null;
                  }
                  const highlighted = isEdgeHighlighted(edge);
                  return (
                    <path
                      key={`${edge.source}-${edge.target}-${index}`}
                      d={d}
                      fill="none"
                      className={
                        highlighted
                          ? "stroke-primary/60 dark:stroke-primary-300/60"
                          : "stroke-gray-200 dark:stroke-gray-700"
                      }
                      strokeWidth={highlighted ? 2 : 1.5}
                    />
                  );
                })}
              </svg>

              {graph.columns.map((column) => {
                const theme = columnTheme[column.type];
                return (
                  <div
                    key={column.type}
                    style={{ width: `${100 / columnCount}%` }}
                    className="relative shrink-0 flex flex-col gap-2 px-4"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                      <span className="text-xs font-semibold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
                        {theme.title} ({column.nodes.length})
                      </span>
                    </div>

                    {column.nodes.length === 0 && (
                      <span className="text-xs italic text-text-muted-light dark:text-text-muted-dark">
                        None yet
                      </span>
                    )}

                    {column.nodes.map((node) => (
                      <button
                        key={node.id}
                        ref={registerNodeRef(node.id)}
                        type="button"
                        onClick={() => setSelectedId(isSelected(node.id) ? null : node.id)}
                        onDoubleClick={() => setEditingNode({ type: node.type, name: node.label })}
                        title={`${node.label} (double-click to edit)`}
                        className={`min-h-11 w-full text-left px-3 py-2 rounded-lg text-sm font-medium
                          break-words transition-all duration-150
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                          ${
                            isDimmed(node.id)
                              ? "opacity-30 bg-gray-50 dark:bg-gray-800 text-text-muted-light dark:text-text-muted-dark"
                              : theme.badge
                          }
                          ${isSelected(node.id) ? `ring-2 ${theme.selectedRing}` : ""}`}
                      >
                        {node.label}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {editingNode?.type === "plan" && (
        <PlanForm
          data={sourceData?.plans?.[editingNode.name]}
          type="edit"
          closeForm={() => setEditingNode(null)}
        />
      )}
      {editingNode?.type === "session" && (
        <SessionForm
          data={sourceData?.sessions?.[editingNode.name]}
          type="edit"
          closeForm={() => setEditingNode(null)}
        />
      )}
      {editingNode?.type === "superset" && (
        <SupersetForm
          data={sourceData?.supersets?.[editingNode.name]}
          entryType="edit"
          closeForm={() => setEditingNode(null)}
        />
      )}
      {editingNode?.type === "exercise" && (
        <ExerciseForm
          data={sourceData?.exercises?.[editingNode.name]}
          type="edit"
          closeForm={() => setEditingNode(null)}
        />
      )}
    </div>
  );
};
