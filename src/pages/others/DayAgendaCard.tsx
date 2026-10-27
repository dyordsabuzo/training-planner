import dayjs, { Dayjs } from "dayjs";
import { useNavigate } from "react-router";
import { Badge, Button, Card } from "@dyordsabuzo/ui-components";
import { DayAgenda, MissedSession } from "../../common/dayAgenda";
import { Checkin, checkinSummary } from "../../common/checkins";

const ROW = "flex items-center justify-between gap-3 min-h-11";

// What's scheduled and what was done on the day picked in the DayStrip.
// Today also lists every missed session; past days show their check-in.
export const DayAgendaCard = ({
  day,
  agenda,
  missed = [],
  checkin,
}: {
  day: Dayjs;
  agenda: DayAgenda;
  missed?: MissedSession[];
  checkin?: Checkin;
}) => {
  const navigate = useNavigate();
  const isToday = day.isSame(dayjs(), "day");
  const { scheduled, completed } = agenda;
  const hasUndone = scheduled.some((s) => !s.done) || (isToday && missed.length > 0);
  const checkinParts = isToday ? [] : checkinSummary(checkin);

  return (
    <Card className="flex flex-col gap-2">
      <h3 className="text-base font-bold text-text-light dark:text-text-dark">
        {isToday ? "Today" : day.format("ddd, MMM D")}
      </h3>

      {scheduled.length === 0 && completed.length === 0 && (
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Rest day — nothing scheduled.</p>
      )}

      {scheduled.map(({ plan, session, done, overdue, optional }) => (
        <div key={`${plan}/${session}`} className={ROW}>
          <div className="flex flex-col">
            <span className="font-semibold text-text-light dark:text-text-dark">{session}</span>
            <span className="text-xs text-text-muted-light dark:text-text-muted-dark">{plan}</span>
          </div>
          <span className="flex items-center gap-1 shrink-0">
            {optional && <Badge variant="neutral">Optional</Badge>}
            {done && <Badge variant="success">Done</Badge>}
            {overdue && <Badge variant="warning">Overdue</Badge>}
          </span>
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

      {isToday && missed.length > 0 && (
        <section
          aria-label="Missed sessions"
          className="flex flex-col gap-1 rounded-md bg-amber-50 dark:bg-amber-700/20 px-3 py-2"
        >
          <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">
            {missed.length === 1 ? "1 missed session" : `${missed.length} missed sessions`}
          </h4>
          <span className="text-xs text-amber-800 dark:text-amber-300">
            These were scheduled earlier and haven't been done yet.
          </span>
          {missed.map(({ plan, session, date }) => (
            <div key={`${plan}/${session}`} className={ROW}>
              <div className="flex flex-col">
                <span className="font-semibold text-text-light dark:text-text-dark">{session}</span>
                <span className="text-xs text-text-muted-light dark:text-text-muted-dark">{plan}</span>
              </div>
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                {dayjs(date).format("ddd, MMM D")}
              </span>
            </div>
          ))}
        </section>
      )}

      {checkinParts.length > 0 && (
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark border-t border-gray-200 dark:border-gray-700 pt-2">
          <span className="font-semibold text-text-light dark:text-text-dark">Check-in: </span>
          {checkinParts.join(" · ")}
        </p>
      )}

      {isToday && hasUndone && (
        <Button label="Start training" className="min-h-11 self-start" onClick={() => navigate("/training-planner/train")} />
      )}
    </Card>
  );
};
