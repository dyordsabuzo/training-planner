import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarWeek, faListCheck } from "@fortawesome/free-solid-svg-icons";
import { Card } from "../../components/others/Card";
import { Badge } from "../../components/others/Badge";
import { Button } from "../../components/form/Button";

type Props = {
  planName: string;
  totalWeeks: number;
  completedWeeks: number;
  currentWeekIndex: number | null;
  sessionsLogged: number;
  onContinue: () => void;
};

export const PlanProgressCard = ({
  planName,
  totalWeeks,
  completedWeeks,
  currentWeekIndex,
  sessionsLogged,
  onContinue,
}: Props) => {
  const percent =
    totalWeeks > 0 ? Math.min(100, Math.round((completedWeeks / totalWeeks) * 100)) : 0;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-base font-bold text-text-light dark:text-text-dark">
          {planName}
        </span>
        {currentWeekIndex !== null && (
          <Badge variant="primary">Week {currentWeekIndex + 1}</Badge>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-text-muted-light dark:text-text-muted-dark">
          <span>
            <FontAwesomeIcon icon={faCalendarWeek} className="mr-1" />
            {completedWeeks} of {totalWeeks} weeks done
          </span>
          <span>{percent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
        <FontAwesomeIcon icon={faListCheck} className="mr-1" />
        {sessionsLogged} {sessionsLogged === 1 ? "session" : "sessions"} logged
      </span>

      <Button label="Continue training" onClick={onContinue} className="min-h-11" />
    </Card>
  );
};
