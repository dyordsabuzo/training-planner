import { ReactNode } from "react";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDumbbell, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { formatSessionDate } from "../../common/planSessions";

export const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const TONE = {
  primary: "bg-primary-50 text-primary dark:bg-primary-800/30 dark:text-primary-300",
  success: "bg-success-50 text-success dark:bg-success-500/20 dark:text-success-500",
  accent: "bg-accent-50 text-accent dark:bg-accent-500/20 dark:text-accent",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  neutral: "bg-gray-100 text-text-muted-light dark:bg-gray-700/60 dark:text-text-muted-dark",
};
export type Tone = keyof typeof TONE;

export const StatusChip = ({
  tone,
  className = "",
  children,
}: {
  tone: Tone;
  className?: string;
  children: ReactNode;
}) => (
  <span className={`inline-block shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${TONE[tone]} ${className}`}>
    {children}
  </span>
);

// Weekday, day and month of a session, or an icon when it has no date.
export const DateTile = ({
  date,
  icon = faDumbbell,
  className = TONE.primary,
}: {
  date?: string;
  icon?: IconDefinition;
  className?: string;
}) => {
  const day = date ? dayjs(date) : null;
  return (
    <span
      className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 ${className}`}
      title={date ? formatSessionDate(date) : undefined}
    >
      {day ? (
        <>
          <span className="text-[10px] font-bold uppercase leading-none opacity-80">{day.format("ddd")}</span>
          <span className="text-lg font-bold leading-tight">{day.format("D")}</span>
          <span className="text-[10px] font-bold uppercase leading-none opacity-80">{day.format("MMM")}</span>
        </>
      ) : (
        <FontAwesomeIcon icon={icon} />
      )}
    </span>
  );
};

// Small uppercase heading over a group of rows, with an optional action.
export const SectionLabel = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="flex items-center justify-between gap-3 min-h-11">
    <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">
      {children}
    </h4>
    {action}
  </div>
);

// Icon tile, title and subtitle, with trailing badges or actions. The
// title area becomes a button when `onClick` is given; done rows are dimmed.
// `leading` sits before the title area (a checkbox), `tile` replaces the icon.
export const AgendaRow = ({
  icon,
  tone,
  title,
  subtitle,
  trailing,
  onClick,
  dimmed,
  leading,
  tile,
  selected,
}: {
  icon: IconDefinition;
  tone: Tone;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  dimmed?: boolean;
  leading?: ReactNode;
  tile?: ReactNode;
  selected?: boolean;
}) => {
  const body = (
    <>
      {tile ?? (
        <span className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${TONE[tone]}`}>
          <FontAwesomeIcon icon={icon} />
        </span>
      )}
      <span className="flex flex-col min-w-0">
        <span className="font-semibold truncate text-text-light dark:text-text-dark">{title}</span>
        {subtitle && (
          <span className="text-xs truncate text-text-muted-light dark:text-text-muted-dark">{subtitle}</span>
        )}
      </span>
    </>
  );
  return (
    <div
      className={`flex items-center justify-between gap-3 min-h-14 rounded-2xl px-2 py-1.5
        bg-gray-50 dark:bg-gray-800/40 ${dimmed ? "opacity-70" : ""} ${selected ? "ring-2 ring-primary" : ""}`}
    >
      {leading}
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className={`flex items-center gap-3 min-w-0 flex-1 min-h-11 text-left rounded-xl ${FOCUS}`}
        >
          {body}
        </button>
      ) : (
        <span className="flex items-center gap-3 min-w-0 flex-1">{body}</span>
      )}
      {trailing && <span className="flex items-center gap-1.5 shrink-0">{trailing}</span>}
    </div>
  );
};
