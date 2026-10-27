import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faCircleCheck,
  faHeartPulse,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@dyordsabuzo/ui-components";
import { RATINGS } from "../../components/others/MoodCheckIn";
import {
  Checkin,
  checkinSummary,
  hasAnswers,
  SORENESS_LABELS,
} from "../../common/checkins";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const DEFAULT_SLEEP = 7;

// Five pill options; tapping the chosen one again clears it.
const RatingRow = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value?: number;
  onChange: (value?: number) => void;
  options: {
    value: number;
    label: string;
    icon?: (typeof RATINGS)[number]["icon"];
  }[];
}) => (
  <div className="flex flex-col gap-1.5" role="group" aria-label={label}>
    <span className="text-xs font-semibold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
      {label}
    </span>
    <div className="grid grid-cols-5 gap-1.5">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            aria-label={`${label}: ${option.label}`}
            onClick={() => onChange(selected ? undefined : option.value)}
            className={`min-h-11 flex flex-col items-center justify-center gap-0.5 rounded-full border text-xs transition-colors ${FOCUS} ${
              selected
                ? "bg-primary border-primary text-white"
                : "border-gray-200 dark:border-gray-700 text-text-muted-light dark:text-text-muted-dark hover:border-primary-200 dark:hover:border-primary-700"
            }`}
          >
            {option.icon ? (
              <FontAwesomeIcon icon={option.icon} className="text-lg" />
            ) : (
              option.value
            )}
            <span className="sr-only sm:not-sr-only sm:text-[0.65rem]">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

const SleepStepper = ({
  value,
  onChange,
}: {
  value?: number;
  onChange: (value?: number) => void;
}) => {
  const step = (delta: number) =>
    onChange(Math.min(24, Math.max(0, (value ?? DEFAULT_SLEEP) + delta)));
  const button = `flex items-center justify-center w-11 h-11 rounded-full border border-gray-200 dark:border-gray-700
    text-text-muted-light dark:text-text-muted-dark hover:text-primary hover:border-primary-200 dark:hover:border-primary-700 ${FOCUS}`;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
        Hours slept
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Less sleep"
          onClick={() => step(-0.5)}
          className={button}
        >
          <FontAwesomeIcon icon={faMinus} />
        </button>
        <span
          aria-live="polite"
          className="min-w-[4rem] text-center text-lg font-bold text-text-light dark:text-text-dark"
        >
          {value === undefined ? "—" : `${value} h`}
        </span>
        <button
          type="button"
          aria-label="More sleep"
          onClick={() => step(0.5)}
          className={button}
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
        {value !== undefined && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className={`min-h-11 px-2 text-sm text-primary font-semibold underline rounded ${FOCUS}`}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

const FACES = RATINGS.map(({ value, icon, label }) => ({ value, icon, label }));
const SORENESS = SORENESS_LABELS.map((label, i) => ({ value: i + 1, label }));

// "How are you today?": an optional daily check-in on Home. It stays a slim
// row (with today's answers once saved) until tapped, then expands the
// questions in place. Today only.
export const DailyCheckInCard = ({
  checkin,
  onSave,
}: {
  checkin?: Checkin;
  onSave: (checkin: Checkin) => Promise<void>;
}) => {
  const saved = hasAnswers(checkin);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<Checkin>({});
  const [isSaving, setIsSaving] = useState(false);
  const set = (key: keyof Checkin) => (value?: number) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const open = () => {
    setDraft(checkin ?? {});
    setIsOpen(true);
  };

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        isOpen
          ? "border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark shadow-sm"
          : "border-dashed border-gray-300 dark:border-gray-600"
      }`}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="daily-checkin-questions"
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        className={`w-full min-h-11 flex items-center gap-3 px-4 py-2.5 rounded-2xl text-left
          hover:bg-primary-50/60 dark:hover:bg-primary-800/20 transition-colors ${FOCUS}`}
      >
        <span
          className={`flex items-center justify-center w-8 h-8 shrink-0 rounded-full ${
            saved
              ? "bg-success-50 dark:bg-success-700/20 text-success-700 dark:text-success-500"
              : "bg-primary-50 dark:bg-primary-800/30 text-primary dark:text-primary-300"
          }`}
        >
          <FontAwesomeIcon icon={saved ? faCircleCheck : faHeartPulse} />
        </span>
        <span className="flex flex-col min-w-0 grow">
          <span className="text-sm font-semibold text-text-light dark:text-text-dark">
            {saved ? "Today's check-in" : "How are you today?"}
          </span>
          <span className="text-xs text-text-muted-light dark:text-text-muted-dark truncate">
            {saved
              ? checkinSummary(checkin).join(" · ")
              : "Optional · takes a few seconds"}
          </span>
        </span>
        <span className="text-xs font-semibold text-primary dark:text-primary-300 shrink-0">
          {isOpen ? "Close" : saved ? "Edit" : "Check in"}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-xs text-text-muted-light dark:text-text-muted-dark transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          id="daily-checkin-questions"
          className="flex flex-col gap-4 px-4 pb-4 pt-1"
        >
          <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
            Answer any you like. Your assigned trainers can see this.
          </span>
          <RatingRow
            label="Mood"
            value={draft.mood}
            onChange={set("mood")}
            options={FACES}
          />
          <SleepStepper value={draft.sleepHours} onChange={set("sleepHours")} />
          <RatingRow
            label="Sleep quality"
            value={draft.sleepQuality}
            onChange={set("sleepQuality")}
            options={FACES}
          />
          <RatingRow
            label="Energy"
            value={draft.energy}
            onChange={set("energy")}
            options={FACES}
          />
          <RatingRow
            label="Soreness"
            value={draft.soreness}
            onChange={set("soreness")}
            options={SORENESS}
          />
          <div className="flex gap-2">
            <Button
              label={isSaving ? "Saving…" : "Save check-in"}
              className="min-h-11"
              disabled={isSaving || !hasAnswers(draft)}
              onClick={async () => {
                setIsSaving(true);
                try {
                  await onSave(draft);
                  setIsOpen(false);
                } finally {
                  setIsSaving(false);
                }
              }}
            />
            <Button
              label="Not now"
              decoration="cancel"
              className="min-h-11"
              onClick={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
