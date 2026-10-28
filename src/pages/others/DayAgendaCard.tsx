import dayjs, { Dayjs } from "dayjs";
import { ReactNode } from "react";
import { useNavigate } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBed,
  faCheck,
  faChevronRight,
  faDumbbell,
  faPlay,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { Badge, Card } from "@dyordsabuzo/ui-components";
import { DayAgenda, MissedSession, ScheduledSession } from "../../common/dayAgenda";
import { Checkin, checkinSummary } from "../../common/checkins";
import { HistoryRun } from "../../common/sessionStats";
import { EventOccurrence } from "../../common/recurringEvents";
import { AgendaRow, FOCUS, SectionLabel } from "./AgendaRow";

const START_PILL = `flex items-center gap-1.5 min-h-11 px-4 rounded-full bg-primary text-white text-sm font-semibold
  shadow-sm shadow-primary/30 hover:bg-primary-500 transition-colors ${FOCUS}`;

// Day progress as a ring; turns green once everything is done.
const ProgressRing = ({ done, total }: { done: number; total: number }) => {
  const r = 22;
  const circumference = 2 * Math.PI * r;
  const complete = done >= total;
  return (
    <div className="relative w-14 h-14 shrink-0" role="img" aria-label={`${done} of ${total} done`}>
      <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="6" className="stroke-gray-200 dark:stroke-gray-700" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - done / total)}
          className={`transition-[stroke-dashoffset] duration-500 ${complete ? "stroke-success-500" : "stroke-primary"}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-text-light dark:text-text-dark">
        {complete ? <FontAwesomeIcon icon={faCheck} className="text-success-500" /> : `${done}/${total}`}
      </span>
    </div>
  );
};

// The day picked in the DayStrip: a progress ring over training and events,
// a past day's check-in, today's next session as a hero with Start, the rest
// of the training (done last), today's catch-up list and the children (e.g.
// the events section). Without an agenda (no plans) training is left out.
export const DayAgendaCard = ({
  day,
  agenda,
  events = [],
  missed = [],
  checkin,
  children,
}: {
  day: Dayjs;
  agenda?: DayAgenda;
  events?: EventOccurrence[];
  missed?: MissedSession[];
  checkin?: Checkin;
  children?: ReactNode;
}) => {
  const navigate = useNavigate();
  const isToday = day.isSame(dayjs(), "day");
  const { scheduled, completed: runs } = agenda ?? { scheduled: [], completed: [] };
  const isRun = (s: ScheduledSession) => (run: HistoryRun) => run.plan === s.plan && run.session === s.session;
  const todo = scheduled.filter((s) => !s.done);
  // Today's first session to do becomes the "Up next" hero.
  const next = isToday ? todo[0] : undefined;
  const rest = next ? todo.slice(1) : todo;
  // Scheduled sessions done (with that day's run time, if any), then runs of
  // sessions not scheduled on this day.
  const done = [
    ...scheduled
      .filter((s) => s.done)
      .map((s) => {
        const run = runs.find(isRun(s));
        return { key: `${s.plan}/${s.session}`, ...s, week: run?.week, at: run?.completedAt };
      }),
    ...runs
      .filter((run) => !scheduled.some((s) => isRun(s)(run)))
      .map((run) => ({ key: `${run.plan}/${run.week}/${run.session}`, ...run, at: run.completedAt })),
  ];
  // Undone optional sessions don't count against the day; a missed event is
  // handled, so it counts as done.
  const total = scheduled.filter((s) => !s.optional || s.done).length + events.length;
  const doneCount =
    scheduled.filter((s) => s.done).length +
    events.filter((e) => e.status === "attended" || e.status === "missed").length;
  const summary =
    total === 0 ? "Nothing planned" : doneCount >= total ? "All done — great work" : `${total - doneCount} to go`;
  const checkinParts = isToday ? [] : checkinSummary(checkin);
  const showCatchUp = isToday && missed.length > 0;
  // Opens Train on this session (Ready, or View results / Run again once run).
  const open = (plan: string, session: string, week?: string) =>
    navigate("/training-planner/train", { state: { plan, session, week } });
  const startPill = (plan: string, session: string) => (
    <button type="button" onClick={() => open(plan, session)} className={START_PILL}>
      <FontAwesomeIcon icon={faPlay} className="text-xs" />
      Start
    </button>
  );

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="text-xl font-bold text-text-light dark:text-text-dark">
            {isToday ? "Today" : day.format("dddd, MMM D")}
          </h3>
          <span className="text-sm text-text-muted-light dark:text-text-muted-dark">{summary}</span>
        </div>
        {total > 0 && <ProgressRing done={doneCount} total={total} />}
      </div>

      {checkinParts.length > 0 && (
        <ul aria-label="Check-in" className="flex flex-wrap gap-1.5">
          {checkinParts.map((part) => (
            <li
              key={part}
              className="px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-800/30 text-xs font-semibold text-primary dark:text-primary-300"
            >
              {part}
            </li>
          ))}
        </ul>
      )}

      {next && (
        <div
          className="flex items-center gap-4 rounded-2xl p-4 text-white bg-gradient-to-br from-primary to-primary-400
            shadow-lg shadow-primary/30"
        >
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-white/70">Up next</span>
            <span className="text-lg font-bold truncate">{next.session}</span>
            <span className="text-sm text-white/80 truncate">
              {[next.plan, next.optional && "Optional", next.overdue && "Overdue"].filter(Boolean).join(" · ")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => open(next.plan, next.session)}
            className="flex items-center gap-2 min-h-12 px-5 rounded-full bg-white text-primary font-bold shadow-md
              hover:bg-primary-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <FontAwesomeIcon icon={faPlay} />
            Start
          </button>
        </div>
      )}

      {agenda && (rest.length > 0 || done.length > 0 || !next) && (
        <section aria-label="Training" className="flex flex-col gap-2">
          <SectionLabel>Training</SectionLabel>

          {!next && todo.length === 0 && done.length === 0 && (
            <AgendaRow
              icon={faBed}
              tone="neutral"
              title={showCatchUp ? "Nothing scheduled today" : "Rest day"}
              subtitle={showCatchUp ? "A good time to catch up below." : "No training scheduled — recover and recharge."}
            />
          )}

          {rest.map(({ plan, session, overdue, optional }) => (
            <AgendaRow
              key={`${plan}/${session}`}
              icon={faDumbbell}
              tone={overdue ? "warning" : "primary"}
              title={session}
              subtitle={plan}
              onClick={() => open(plan, session)}
              trailing={
                <>
                  {optional && <Badge variant="neutral">Optional</Badge>}
                  {overdue && <Badge variant="warning">Overdue</Badge>}
                  {(isToday || overdue) && startPill(plan, session)}
                </>
              }
            />
          ))}

          {done.map(({ key, plan, session, week, at }) => (
            <AgendaRow
              key={key}
              icon={faCheck}
              tone="success"
              title={session}
              subtitle={plan}
              dimmed
              onClick={() => open(plan, session, week)}
              trailing={
                <>
                  {at && (
                    <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
                      {dayjs(at).format("HH:mm")}
                    </span>
                  )}
                  <FontAwesomeIcon icon={faChevronRight} className="text-xs text-text-muted-light dark:text-text-muted-dark" />
                </>
              }
            />
          ))}
        </section>
      )}

      {showCatchUp && (
        <section aria-label="Catch up" className="flex flex-col gap-2">
          <SectionLabel>
            Catch up · {missed.length === 1 ? "1 missed session" : `${missed.length} missed sessions`}
          </SectionLabel>
          {missed.map(({ plan, session, date }) => (
            <AgendaRow
              key={`${plan}/${session}`}
              icon={faTriangleExclamation}
              tone="warning"
              title={session}
              subtitle={`${plan} · was ${dayjs(date).format("ddd, MMM D")}`}
              onClick={() => open(plan, session)}
              trailing={startPill(plan, session)}
            />
          ))}
        </section>
      )}

      {children}
    </Card>
  );
};
