import { ReactNode } from "react";
import { toStringArray } from "../common/utils";
import { Badge } from "@dyordsabuzo/ui-components";

type Props = {
  title: string;
  relatedLabel?: string;
  relatedItems?: string[];
  meta?: string;
  tags?: string[];
  usageCount?: number;
  usageLabel?: string;
  onOpen?: () => void;
  actions?: ReactNode;
  selected?: boolean;
  onToggleSelect?: () => void;
};

// Tag chips and the card's left accent bar share one colour per tag, so a
// tag reads the same everywhere. Literal class names keep Tailwind's scanner happy.
const TAG_STYLES = [
  { chip: "bg-primary-50 text-primary-700 dark:bg-primary-800/30 dark:text-primary-200", bar: "border-l-primary-500" },
  { chip: "bg-success-50 text-success-700 dark:bg-success-700/20 dark:text-success-500", bar: "border-l-success-500" },
  { chip: "bg-accent-500/15 text-accent-700 dark:text-accent-500", bar: "border-l-accent-500" },
];

export const tagStyle = (tag: string) => {
  const hash = Array.from(tag).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return TAG_STYLES[hash % TAG_STYLES.length];
};

// Single source for usage wording, used by cards and the grid column.
export const usageText = (count: number, label: string) =>
  count > 0 ? `Used by ${count} ${label}${count === 1 ? "" : "s"}` : "Unused";

// Presentational card for the Exercise/Superset/Session/Plan listings.
// Clicking the body or the title opens the item for editing; the Edit button
// and ⋮ menu sit in the header and stop their clicks from bubbling here.
export const EntityCard = ({
  title,
  relatedLabel,
  relatedItems,
  meta,
  tags,
  usageCount = 0,
  usageLabel = "",
  onOpen,
  actions,
  selected = false,
  onToggleSelect,
}: Props) => {
  // Some legacy records store these as a comma-separated string rather than
  // a real array — normalize defensively regardless of what a caller passes.
  const normalizedRelatedItems = toStringArray(relatedItems);
  const normalizedTags = toStringArray(tags);
  const barClass = normalizedTags.length > 0 ? tagStyle(normalizedTags[0]).bar : "border-l-gray-300 dark:border-l-gray-600";

  return (
    <div
      onClick={onOpen}
      className={`relative grow min-h-11 text-left border border-l-4 ${barClass}
        border-primary-200 dark:border-primary-700 bg-white dark:bg-surface-dark
        text-text-light dark:text-text-dark p-4 rounded-md text-sm shadow-sm hover:shadow-md
        transition-shadow flex flex-col gap-2 ${onOpen ? "cursor-pointer" : ""}
        ${selected ? "ring-2 ring-primary" : ""}`}
    >
      {meta && (
        <span className="-mt-1 text-xs font-medium text-primary dark:text-primary-200">{meta}</span>
      )}

      <div className="flex items-center gap-2">
        {onToggleSelect && (
          <span onClick={(e) => e.stopPropagation()} className="flex items-center shrink-0">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              aria-label={`Select ${title}`}
              className="h-4 w-4 accent-primary"
            />
          </span>
        )}
        <button
          type="button"
          onClick={onOpen}
          disabled={!onOpen}
          className="grow min-w-0 min-h-11 flex items-center font-bold text-left break-words rounded
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default"
        >
          {title}
        </button>
        {actions}
      </div>

      {normalizedRelatedItems.length > 0 && (
        <div>
          {relatedLabel && (
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark mb-1">
              {relatedLabel}
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {normalizedRelatedItems.map((item) => (
              <Badge key={item} variant="neutral">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {normalizedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {normalizedTags.map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${tagStyle(tag).chip}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {usageLabel !== "" && (
        <div className="mt-auto pt-1">
          <Badge variant={usageCount > 0 ? "neutral" : "warning"} className="w-fit">
            {usageText(usageCount, usageLabel)}
          </Badge>
        </div>
      )}
    </div>
  );
};
