import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarCheck, faCheck, faPlus, faRotateLeft, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@dyordsabuzo/ui-components";
import { Attendance, EventOccurrence, RecurringEvent } from "../../common/recurringEvents";
import { AgendaRow, FOCUS, SectionLabel } from "./AgendaRow";

const ROUND = `flex items-center justify-center w-11 h-11 rounded-full transition-colors ${FOCUS}`;

// Recurring events section of the day agenda. Events on today or a past day
// can be confirmed when the handlers are given (left out in read-only
// "View as").
export const DayEvents = ({
  events,
  hasAnyEvents,
  onAttendance,
  onEditEvent,
  onAddEvent,
}: {
  events: EventOccurrence[];
  hasAnyEvents: boolean;
  onAttendance?: (eventId: string, value: Attendance | null) => void;
  onEditEvent?: (event: RecurringEvent) => void;
  onAddEvent?: () => void;
}) => {
  return (
    <section aria-label="Events" className="flex flex-col gap-2">
      <SectionLabel
        action={
          onAddEvent && (
            <button
              type="button"
              onClick={onAddEvent}
              className={`min-h-11 px-4 rounded-full bg-primary-50 dark:bg-primary-800/30 text-sm font-semibold
                text-primary dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-800/50 transition-colors ${FOCUS}`}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-1.5" />
              Add
            </button>
          )
        }
      >
        Events
      </SectionLabel>

      {!hasAnyEvents ? (
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
          Track your own regular training, like on-water sessions, and mark each one attended or missed.
        </p>
      ) : (
        events.length === 0 && (
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">No events on this day.</p>
        )
      )}

      {events.map(({ event, status }) => {
        const handled = status === "attended" || status === "missed";
        return (
          <AgendaRow
            key={event.id}
            icon={status === "attended" ? faCheck : faCalendarCheck}
            tone={status === "attended" ? "success" : status === "missed" ? "neutral" : "accent"}
            title={event.name}
            subtitle={[event.startTime, event.location].filter(Boolean).join(" · ")}
            onClick={onEditEvent && (() => onEditEvent(event))}
            dimmed={handled}
            trailing={
              <>
                {(status === "pending" || status === "overdue") &&
                  (onAttendance ? (
                    <>
                      <button
                        type="button"
                        aria-label={`Attended ${event.name}`}
                        title="Attended"
                        onClick={() => onAttendance(event.id, "attended")}
                        className={`${ROUND} bg-success text-white hover:bg-success-500 shadow-sm`}
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Missed ${event.name}`}
                        title="Missed"
                        onClick={() => onAttendance(event.id, "missed")}
                        className={`${ROUND} border border-gray-200 dark:border-gray-700 text-text-muted-light
                          dark:text-text-muted-dark hover:text-danger hover:border-danger`}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </>
                  ) : (
                    status === "overdue" && <Badge variant="warning">Unconfirmed</Badge>
                  ))}
                {status === "attended" && <Badge variant="success">Attended</Badge>}
                {status === "missed" && <Badge variant="neutral">Missed</Badge>}
                {handled && onAttendance && (
                  <button
                    type="button"
                    aria-label={`Undo ${event.name}`}
                    title="Undo"
                    onClick={() => onAttendance(event.id, null)}
                    className={`${ROUND} text-text-muted-light dark:text-text-muted-dark hover:text-primary`}
                  >
                    <FontAwesomeIcon icon={faRotateLeft} />
                  </button>
                )}
              </>
            }
          />
        );
      })}
    </section>
  );
};
