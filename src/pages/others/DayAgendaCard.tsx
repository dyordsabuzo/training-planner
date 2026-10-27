import dayjs, { Dayjs } from "dayjs";
import { useNavigate } from "react-router";
import { Badge, Button, Card } from "@dyordsabuzo/ui-components";
import { DayAgenda } from "../../common/dayAgenda";

const ROW = "flex items-center justify-between gap-3 min-h-11";

// What's scheduled and what was done on the day picked in the DayStrip.
export const DayAgendaCard = ({ day, agenda }: { day: Dayjs; agenda: DayAgenda }) => {
  const navigate = useNavigate();
  const isToday = day.isSame(dayjs(), "day");
  const { scheduled, completed } = agenda;
  const hasUndone = scheduled.some((s) => !s.done);

  return (
    <Card className="flex flex-col gap-2">
      <h3 className="text-base font-bold text-text-light dark:text-text-dark">
        {isToday ? "Today" : day.format("ddd, MMM D")}
      </h3>

      {scheduled.length === 0 && completed.length === 0 && (
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Rest day — nothing scheduled.</p>
      )}

      {scheduled.map(({ plan, session, done, overdue }) => (
        <div key={`${plan}/${session}`} className={ROW}>
          <div className="flex flex-col">
            <span className="font-semibold text-text-light dark:text-text-dark">{session}</span>
            <span className="text-xs text-text-muted-light dark:text-text-muted-dark">{plan}</span>
          </div>
          {done && <Badge variant="success">Done</Badge>}
          {overdue && <Badge variant="warning">Overdue</Badge>}
        </div>
      ))}

      {completed.length > 0 && (
        <>
          <h4 className="text-sm font-bold text-text-muted-light dark:text-text-muted-dark pt-1">Completed</h4>
          {completed.map((run) => (
            <button
              key={`${run.plan}/${run.week}/${run.session}`}
              type="button"
              onClick={() => navigate("/training-planner/history")}
              className={`${ROW} text-left rounded-md hover:bg-primary-50 dark:hover:bg-primary-800/20
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
            >
              <div className="flex flex-col">
                <span className="font-semibold text-text-light dark:text-text-dark">{run.session}</span>
                <span className="text-xs text-text-muted-light dark:text-text-muted-dark">{run.plan}</span>
              </div>
              <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
                {dayjs(run.completedAt).format("HH:mm")}
              </span>
            </button>
          ))}
        </>
      )}

      {isToday && hasUndone && (
        <Button label="Start training" className="min-h-11 self-start" onClick={() => navigate("/training-planner/train")} />
      )}
    </Card>
  );
};
