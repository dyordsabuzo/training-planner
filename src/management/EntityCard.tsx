import { ReactNode } from "react";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { toStringArray } from "../common/utils";
import { AgendaRow, StatusChip, Tone } from "../pages/others/AgendaRow";

type Props = {
  title: string;
  icon: IconDefinition;
  // Replaces the icon, e.g. a DateTile for a dated session.
  tile?: ReactNode;
  summary?: string;
  tags?: string[];
  unused?: boolean;
  onOpen?: () => void;
  actions?: ReactNode;
  selected?: boolean;
  onToggleSelect?: () => void;
};

// One colour per tag, so a tag reads the same everywhere.
const TAG_TONES: Tone[] = ["primary", "success", "accent"];

export const tagTone = (tag: string): Tone => {
  const hash = Array.from(tag).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return TAG_TONES[hash % TAG_TONES.length];
};

// Single source for usage wording, used by the grid column.
export const usageText = (count: number, label: string) =>
  count > 0 ? `Used by ${count} ${label}${count === 1 ? "" : "s"}` : "Unused";

export const summaryLine = (parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" · ");

// Row for the Exercise/Superset/Session listings. Clicking the title area
// opens the item for editing; the ⋮ menu and checkbox sit beside it.
export const EntityCard = ({
  title,
  icon,
  tile,
  summary,
  tags,
  unused = false,
  onOpen,
  actions,
  selected = false,
  onToggleSelect,
}: Props) => {
  // Some legacy records store tags as a comma-separated string rather than
  // a real array — normalize defensively regardless of what a caller passes.
  const firstTag = toStringArray(tags)[0];

  return (
    <AgendaRow
      icon={icon}
      tone={firstTag ? tagTone(firstTag) : "neutral"}
      tile={tile}
      selected={selected}
      leading={
        onToggleSelect && (
          // Full-size touch target; the margins give back its share of the row.
          <label className="flex items-center justify-center w-11 h-11 -mx-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              aria-label={`Select ${title}`}
              className="h-4 w-4 accent-primary"
            />
          </label>
        )
      }
      title={<span title={title}>{title}</span>}
      subtitle={
        (unused || summary) && (
          <>
            {unused && (
              <StatusChip tone="warning" className="mr-1.5">
                Unused
              </StatusChip>
            )}
            {summary}
          </>
        )
      }
      onClick={onOpen}
      trailing={actions}
    />
  );
};
