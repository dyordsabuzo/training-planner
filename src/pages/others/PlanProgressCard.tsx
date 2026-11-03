import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@dyordsabuzo/ui-components";
import { FOCUS } from "./AgendaRow";

type Props = {
  planName: string;
  totalWeeks: number;
  completedWeeks: number;
  currentWeekIndex: number | null;
  sessionsLogged: number;
  // What completedWeeks/totalWeeks count: "weeks", or "sessions" for open plans.
  unitLabel?: string;
  onContinue: () => void;
};

export const PlanProgressCard = ({
  planName,
  totalWeeks,
  completedWeeks,
  currentWeekIndex,
  sessionsLogged,
  unitLabel = "weeks",
  onContinue,
}: Props) => {
  const percent =
    totalWeeks > 0 ? Math.min(100, Math.round((completedWeeks / totalWeeks) * 100)) : 0;

  // Same surface as Card, which can't take a click.
  return (
    <button
      type="button"
      onClick={onContinue}
      className={`flex flex-col gap-3 w-full min-h-11 p-4 text-left rounded-lg shadow-md bg-white dark:bg-surface-dark
        hover:bg-primary-50 dark:hover:bg-primary-800/20 transition-colors ${FOCUS}`}
    >
      <span className="flex items-center justify-between gap-2 w-full">
        <span className="min-w-0 text-base font-bold break-words text-text-light dark:text-text-dark">
          {planName}
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {currentWeekIndex !== null && (
            <Badge variant="primary">Week {currentWeekIndex + 1}</Badge>
          )}
          <FontAwesomeIcon icon={faChevronRight} className="text-xs text-text-muted-light dark:text-text-muted-dark" />
        </span>
      </span>

      <span className="flex flex-col gap-1 w-full">
        <span className="flex justify-between gap-2 text-xs text-text-muted-light dark:text-text-muted-dark">
          <span>
            {completedWeeks} of {totalWeeks} {unitLabel} done · {sessionsLogged}{" "}
            {sessionsLogged === 1 ? "session" : "sessions"} logged
          </span>
          <span>{percent}%</span>
        </span>
        <span className="block w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <span
            className="block h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </span>
      </span>
    </button>
  );
};
