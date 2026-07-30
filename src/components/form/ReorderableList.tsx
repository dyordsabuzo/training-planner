import { useRef, useState } from "react";
import { faGripVertical, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  label?: string;
  items: string[];
  onReorder: (items: string[]) => void;
  onRemove?: (item: string) => void;
  emptyMessage?: string;
  className?: string;
};

// A list of labeled panels that can be reordered by dragging the grip handle.
// Uses the Pointer Events API (not the HTML5 drag-and-drop API, which is
// mouse-only) so reordering works the same way with touch, mouse, or pen —
// same "roll your own, no new dependency" approach already used for
// RelationshipMap's touch carousel elsewhere in this app.
export const ReorderableList = ({
  label,
  items,
  onReorder,
  onRemove,
  emptyMessage = "No items selected",
  className,
}: Props) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const registerItemRef = (index: number) => (el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(index, el);
    } else {
      itemRefs.current.delete(index);
    }
  };

  const handlePointerDown = (index: number) => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDraggingIndex(index);
    setOverIndex(index);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (draggingIndex === null) {
      return;
    }

    let nextOverIndex = overIndex;
    itemRefs.current.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
        nextOverIndex = index;
      }
    });

    if (nextOverIndex !== overIndex) {
      setOverIndex(nextOverIndex);
    }
  };

  const handlePointerUp = () => {
    if (draggingIndex !== null && overIndex !== null && draggingIndex !== overIndex) {
      const next = [...items];
      const [moved] = next.splice(draggingIndex, 1);
      next.splice(overIndex, 0, moved);
      onReorder(next);
    }
    setDraggingIndex(null);
    setOverIndex(null);
  };

  return (
    <div className={`w-full ${className ?? ""}`}>
      {label && (
        <div className="block mb-1 text-xs font-medium uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
          {label}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-sm italic text-text-muted-light dark:text-text-muted-dark">
          {emptyMessage}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div
              key={item}
              ref={registerItemRef(index)}
              className={`flex items-center gap-2 min-h-11 px-2 rounded-lg border text-sm
                bg-white dark:bg-surface-dark text-text-light dark:text-text-dark
                transition-colors
                ${
                  draggingIndex === index
                    ? "opacity-50 border-gray-300 dark:border-gray-600"
                    : overIndex === index && draggingIndex !== null
                      ? "border-primary ring-2 ring-primary"
                      : "border-gray-300 dark:border-gray-600"
                }`}
            >
              <button
                type="button"
                onPointerDown={handlePointerDown(index)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                aria-label={`Reorder ${item}`}
                className="min-h-11 min-w-8 flex items-center justify-center shrink-0 touch-none cursor-grab
                  active:cursor-grabbing text-text-muted-light dark:text-text-muted-dark
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                <FontAwesomeIcon icon={faGripVertical} />
              </button>

              <span className="flex-1 break-words py-2">{item}</span>

              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  aria-label={`Remove ${item}`}
                  className="min-h-8 min-w-8 shrink-0 flex items-center justify-center rounded-full
                    text-text-muted-light dark:text-text-muted-dark
                    hover:bg-gray-100 dark:hover:bg-gray-700
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-xs" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
