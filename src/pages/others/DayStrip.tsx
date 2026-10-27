import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { DayStatus, weekDays } from "../../common/dayAgenda";
import { useMediaQuery } from "../../common/useMediaQuery";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const DOT: Record<NonNullable<DayStatus>, string> = {
  done: "bg-success-500",
  planned: "bg-primary",
  overdue: "bg-amber-500",
};

// "October 2026", or "Oct – Nov 2026" when the days cross a month.
const rangeLabel = (first: Dayjs, last: Dayjs) => {
  if (first.isSame(last, "month")) return first.format("MMMM YYYY");
  if (first.isSame(last, "year"))
    return `${first.format("MMM")} – ${last.format("MMM YYYY")}`;
  return `${first.format("MMM YYYY")} – ${last.format("MMM YYYY")}`;
};

// One week of day panels on phones, two from md up so wide screens don't
// leave big gaps between capsules; the parent owns which day is selected.
export const DayStrip = ({
  selected,
  onSelect,
  statusFor,
}: {
  selected: Dayjs;
  onSelect: (day: Dayjs) => void;
  statusFor: (day: Dayjs) => DayStatus;
}) => {
  const [anchor, setAnchor] = useState(selected);
  // Which way the last week change went, so the panels slide in from that side.
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const goTo = (day: Dayjs) => {
    if (!weekDays(day)[0].isSame(weekDays(anchor)[0], "day")) {
      setDirection(day.isAfter(anchor) ? "right" : "left");
    }
    setAnchor(day);
  };
  // Two weeks need about 736px to keep capsules 44px+ wide, which md gives.
  const weeks = useMediaQuery("(min-width: 768px)") ? 2 : 1;
  const days = Array.from({ length: weeks }, (_, i) =>
    weekDays(anchor.add(i, "week")),
  ).flat();
  const isVisible = (day: Dayjs) => days.some((d) => d.isSame(day, "day"));
  const today = dayjs();
  const navButton = `flex items-center justify-center w-11 h-11 rounded-full border border-gray-200 dark:border-gray-700
    text-text-muted-light dark:text-text-muted-dark hover:text-primary hover:border-primary-200 dark:hover:border-primary-700
    transition-colors ${FOCUS}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-text-light dark:text-text-dark flex-1">
          {rangeLabel(days[0], days[days.length - 1])}
        </h2>
        {!(isVisible(today) && selected.isSame(today, "day")) && (
          <button
            type="button"
            onClick={() => {
              if (!isVisible(today)) goTo(today);
              onSelect(today);
            }}
            className={`min-h-11 px-4 rounded-full bg-primary-50 dark:bg-primary-800/30 text-sm text-primary dark:text-primary-300 font-semibold
              hover:bg-primary-100 dark:hover:bg-primary-800/50 transition-colors ${FOCUS}`}
          >
            Today
          </button>
        )}
        <button
          type="button"
          aria-label={weeks === 1 ? "Previous week" : "Previous two weeks"}
          onClick={() => goTo(anchor.subtract(weeks, "week"))}
          className={navButton}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <button
          type="button"
          aria-label={weeks === 1 ? "Next week" : "Next two weeks"}
          onClick={() => goTo(anchor.add(weeks, "week"))}
          className={navButton}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>

      {/* Capsules are capped at 56px wide and centred in their column, so they
          keep the same shape from a 360px phone to desktop (44px+ wide).
          Keyed by week so each change remounts the row and replays the slide. */}
      <div className="overflow-x-clip">
        <div
          key={days[0].format("YYYY-MM-DD")}
          className={`grid ${
            weeks === 2 ? "grid-cols-[repeat(14,minmax(0,1fr))]" : "grid-cols-7"
          } gap-1.5 justify-items-center ${
            direction === "right"
              ? "motion-safe:animate-slide-from-right"
              : direction === "left"
                ? "motion-safe:animate-slide-from-left"
                : ""
          }`}
        >
          {days.map((day) => {
            const isSelected = day.isSame(selected, "day");
            const isToday = day.isSame(today, "day");
            const status = statusFor(day);
            return (
              <button
                key={day.format("YYYY-MM-DD")}
                type="button"
                aria-pressed={isSelected}
                aria-label={day.format("dddd, MMMM D")}
                onClick={() => onSelect(day)}
                className={`flex flex-col items-center justify-center gap-1.5 w-full max-w-[3.5rem] h-[4.75rem] rounded-full border
                transition-all duration-200 ${FOCUS} focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background-dark ${
                  isSelected
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/30"
                    : `bg-surface-light dark:bg-surface-dark shadow-sm hover:border-primary-200 dark:hover:border-primary-700 ${
                        isToday
                          ? "border-primary-300 dark:border-primary-600 text-primary dark:text-primary-300"
                          : "border-gray-100 dark:border-gray-700 text-text-light dark:text-text-dark"
                      }`
                }`}
              >
                <span
                  className={`text-[0.65rem] font-semibold uppercase tracking-wide ${
                    isSelected
                      ? "text-white/80"
                      : "text-text-muted-light dark:text-text-muted-dark"
                  }`}
                >
                  {day.format("dd")}
                </span>
                <span className="text-lg font-bold leading-none">
                  {day.format("D")}
                </span>
                <span
                  aria-hidden
                  className={`w-1.5 h-1.5 rounded-full ${status ? DOT[status] : "bg-transparent"} ${
                    isSelected && status ? "ring-2 ring-white/80" : ""
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
