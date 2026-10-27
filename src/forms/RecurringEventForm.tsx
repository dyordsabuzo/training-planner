import React, { useContext, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { DateInput, Input, Modal } from "@dyordsabuzo/ui-components";
import SourceDataContext from "../context/SourceDataContext";
import { FormButtons } from "./FormButtons";
import { EventInput, eventDay, eventInputErrors, RecurringEvent, WEEKDAY_LABELS } from "../common/recurringEvents";

type Props = {
  // Edits this event; creates a new one when absent.
  event?: RecurringEvent;
  closeForm: () => void;
};

// Monday first, matching the DayStrip.
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const RecurringEventForm = ({ event, closeForm }: Props) => {
  const { saveEvent, deleteEvent } = useContext(SourceDataContext);
  const [name, setName] = useState(event?.name ?? "");
  const [weekdays, setWeekdays] = useState<number[]>(event?.weekdays ?? []);
  const [startDate, setStartDate] = useState<Dayjs>(event ? dayjs(event.startDate) : dayjs());
  const [endDate, setEndDate] = useState<Dayjs>(event ? dayjs(event.endDate) : dayjs().add(3, "month"));
  const [startTime, setStartTime] = useState(event?.startTime ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [errors, setErrors] = useState<Partial<Record<keyof EventInput, string>>>({});
  const [saveError, setSaveError] = useState<string>();

  const toggleWeekday = (day: number) =>
    setWeekdays((days) => (days.includes(day) ? days.filter((d) => d !== day) : [...days, day]));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input: EventInput = {
      name,
      weekdays,
      startDate: startDate ? eventDay(startDate) : "",
      endDate: endDate ? eventDay(endDate) : "",
      startTime,
      location,
      notes,
    };
    const found = eventInputErrors(input);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    try {
      await saveEvent(input, event?.id);
      closeForm();
    } catch {
      setSaveError("Couldn't save the event. Try again.");
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    await deleteEvent(event.id);
    closeForm();
  };

  return (
    <Modal title={event ? "Regular event" : "Add regular event"} isOpen={true} onClose={closeForm}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name"
          required
          value={name}
          placeholder="e.g. On-water training"
          error={errors.name}
          changeValue={setName}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-medium uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark pb-2">
            Repeats on
          </legend>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_ORDER.map((day) => {
              const selected = weekdays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleWeekday(day)}
                  className={`min-h-11 min-w-11 px-2 rounded-md text-sm font-semibold border
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      selected
                        ? "bg-primary text-white border-primary"
                        : "border-gray-300 dark:border-gray-600 text-text-light dark:text-text-dark"
                    }`}
                >
                  {WEEKDAY_LABELS[day]}
                </button>
              );
            })}
          </div>
          {errors.weekdays && <span className="text-sm text-danger">{errors.weekdays}</span>}
        </fieldset>

        <DateInput label="Start date" value={startDate} placeholder="Start date" changeValue={setStartDate} />
        {errors.startDate && <span className="text-sm text-danger">{errors.startDate}</span>}
        <DateInput label="End date" value={endDate} placeholder="End date" changeValue={setEndDate} />
        {errors.endDate && <span className="text-sm text-danger">{errors.endDate}</span>}

        <Input
          label="Start time (optional)"
          type="time"
          value={startTime}
          error={errors.startTime}
          changeValue={setStartTime}
        />
        <Input label="Location (optional)" value={location} placeholder="Location" changeValue={setLocation} />
        <Input label="Notes (optional)" value={notes} placeholder="Notes" changeValue={setNotes} />

        {saveError && <span className="text-sm text-danger">{saveError}</span>}
        <FormButtons onCancel={closeForm} onDelete={event ? handleDelete : undefined} />
      </form>
    </Modal>
  );
};
