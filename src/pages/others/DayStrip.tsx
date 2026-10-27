import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { DayStatus, weekDays } from "../../common/dayAgenda";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const DOT: Record<NonNullable<DayStatus>, string> = {
  done: "bg-success-500",
  planned: "bg-primary",
  overdue: "bg-amber-500",
};

// A week of day panels; the parent owns which day is selected.
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
  const days = weekDays(anchor);
  const today = dayjs();
  const navButton = `min-h-11 min-w-11 rounded-full text-primary font-semibold hover:bg-primary-50 dark:hover:bg-primary-800/20 ${FOCUS}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <h2 className="text-lg font-bold text-text-light dark:text-text-dark flex-1">
          {anchor.format("MMMM YYYY")}
        </h2>
        {!(days[0].isSame(weekDays(today)[0], "day") && selected.isSame(today, "day")) && (
          <button
            type="button"
            onClick={() => {
              setAnchor(today);
              onSelect(today);
            }}
            className={`min-h-11 px-3 rounded-full border border-primary-200 dark:border-primary-700 text-sm text-primary font-semibold
              hover:bg-primary-50 dark:hover:bg-primary-800/20 ${FOCUS}`}
          >
            Today
          </button>
        )}
        <button type="button" aria-label="Previous week" onClick={() => setAnchor(anchor.subtract(1, "week"))} className={navButton}>
          ‹
        </button>
        <button type="button" aria-label="Next week" onClick={() => setAnchor(anchor.add(1, "week"))} className={navButton}>
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
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
              className={`min-h-11 flex flex-col items-center gap-0.5 py-2 rounded-lg ${FOCUS} ${
                isSelected
                  ? "bg-primary text-white"
                  : `bg-white dark:bg-gray-800 text-text-light dark:text-text-dark hover:bg-primary-50 dark:hover:bg-primary-800/20 ${
                      isToday ? "ring-1 ring-primary" : ""
                    }`
              }`}
            >
              <span className={`text-xs ${isSelected ? "" : "text-text-muted-light dark:text-text-muted-dark"}`}>
                {day.format("dd").charAt(0)}
              </span>
              <span className="text-base font-bold">{day.format("D")}</span>
              <span
                aria-hidden
                className={`w-1.5 h-1.5 rounded-full ${status ? DOT[status] : "bg-transparent"} ${
                  isSelected && status ? "ring-1 ring-white" : ""
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
