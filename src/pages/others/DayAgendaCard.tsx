import dayjs, { Dayjs } from "dayjs";
import { ReactNode, useState } from "react";
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
import { DayAgenda, MissedSession, ScheduledSession, upNext } from "../../common/dayAgenda";
import { Checkin, checkinSummary } from "../../common/checkins";
import { HistoryRun } from "../../common/sessionStats";
import { EventOccurrence } from "../../common/recurringEvents";
import { AgendaRow, FOCUS, SectionLabel } from "./AgendaRow";
import { OUTLINE_PILL } from "./HeroTile";

// Longer catch-up lists start collapsed so they don't bury the rest of the page.
const CATCH_UP_VISIBLE_MAX = 3;

const START_PILL = `flex items-center gap-1.5 min-h-11 px-4 rounded-full bg-primary text-white text-sm font-semibold
  shadow-sm shadow-primary/30 hover:bg-primary-500 transition-colors ${FOCUS}`;

const COMPLETE_CHECK = `flex items-center justify-center w-11 h-11 shrink-0 rounded-full border border-gray-300
  dark:border-gray-600 text-text-muted-light dark:text-text-muted-dark hover:bg-success-50 hover:text-success
  dark:hover:bg-success-500/20 dark:hover:text-success-500 transition-colors ${FOCUS}`;

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
// a past day's check-in, the training (done last), today's catch-up list and
// the children (e.g. the events section). Today's next session is left to the
// Home hero. Without an agenda (no plans) training is left out.
export const DayAgendaCard = ({
  day,
  agenda,
  events = [],
  missed = [],
  checkin,
  onComplete,
  children,
}: {
  day: Dayjs;
  agenda?: DayAgenda;
  events?: EventOccurrence[];
  missed?: MissedSession[];
  checkin?: Checkin;
  // Marks a catch-up session complete without running it.
  onComplete?: (plan: string, session: string) => void;
  children?: ReactNode;
}) => {
  const navigate = useNavigate();
  const [catchUpOpen, setCatchUpOpen] = useState(false);
  const isToday = day.isSame(dayjs(), "day");
  const { scheduled, completed: runs } = agenda ?? { scheduled: [], completed: [] };
  const isRun = (s: ScheduledSession) => (run: HistoryRun) => run.plan === s.plan && run.session === s.session;
  const todo = scheduled.filter((s) => !s.done);
  // Today's next session is on the Home hero, so it isn't listed again.
  const next = isToday && agenda ? upNext(agenda) : undefined;
  const rest = todo.filter((s) => s !== next);
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
  const catchUpCollapsible = missed.length > CATCH_UP_VISIBLE_MAX;
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
          <SectionLabel
            action={
              catchUpCollapsible && (
                <button
                  type="button"
                  aria-expanded={catchUpOpen}
                  onClick={() => setCatchUpOpen((open) => !open)}
                  className={OUTLINE_PILL}
                >
                  {catchUpOpen ? "Hide" : "Show"}
                </button>
              )
            }
          >
            Catch up · {missed.length === 1 ? "1 missed session" : `${missed.length} missed sessions`}
          </SectionLabel>
          {(!catchUpCollapsible || catchUpOpen) && missed.map(({ plan, session, date }) => (
            <AgendaRow
              key={`${plan}/${session}`}
              icon={faTriangleExclamation}
              tone="warning"
              title={session}
              subtitle={`${plan} · was ${dayjs(date).format("ddd, MMM D")}`}
              onClick={() => open(plan, session)}
              trailing={
                <>
                  {onComplete && (
                    <button
                      type="button"
                      aria-label={`Mark ${session} complete`}
                      onClick={() => onComplete(plan, session)}
                      className={COMPLETE_CHECK}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </button>
                  )}
                  {startPill(plan, session)}
                </>
              }
            />
          ))}
        </section>
      )}

      {children}
    </Card>
  );
};
