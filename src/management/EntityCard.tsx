import { Badge } from "../components/others/Badge";
import { toStringArray } from "../common/utils";

type Props = {
  title: string;
  relatedLabel?: string;
  relatedItems?: string[];
  tags?: string[];
  usageCount?: number;
  usageLabel?: string;
  onClick: () => void;
};

// Shared presentational card for the Exercise/Superset/Session listings —
// surfaces relationship references and the (previously invisible) Tags
// field as chips, plus a "Used by N" badge computed from the relationship
// graph, so dependents are visible without switching to the Relationships
// tab. The whole card is clickable, opening a read-only detail view that
// has its own pencil icon to enter edit mode.
export const EntityCard = ({
  title,
  relatedLabel,
  relatedItems,
  tags,
  usageCount,
  usageLabel,
  onClick,
}: Props) => {
  // Some legacy records store these as a comma-separated string rather than
  // a real array — normalize defensively regardless of what a caller passes.
  const normalizedRelatedItems = toStringArray(relatedItems);
  const normalizedTags = toStringArray(tags);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="relative grow min-h-11 text-left border border-primary-200 dark:border-primary-700
        bg-white dark:bg-surface-dark text-text-light dark:text-text-dark
        p-4 rounded-md text-sm shadow-sm hover:shadow-md hover:border-primary transition-shadow
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer
        flex flex-col gap-2"
    >
      <span className="font-bold break-words min-w-0">{title}</span>

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
            <Badge key={tag} variant="primary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {!!usageCount && usageCount > 0 && usageLabel && (
        <Badge variant="neutral" className="w-fit">
          {`Used by ${usageCount} ${usageLabel}${usageCount === 1 ? "" : "s"}`}
        </Badge>
      )}
    </div>
  );
};
