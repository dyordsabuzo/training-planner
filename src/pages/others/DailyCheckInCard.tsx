import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Button, Card } from "@dyordsabuzo/ui-components";
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

// "How are you today?": a quick daily check-in on Home. Today only; once saved
// it shrinks to a summary with an Edit button.
export const DailyCheckInCard = ({
  checkin,
  onSave,
}: {
  checkin?: Checkin;
  onSave: (checkin: Checkin) => Promise<void>;
}) => {
  const saved = hasAnswers(checkin);
  // Unset until the user chooses; until then the card follows whether a
  // check-in has loaded.
  const [editing, setIsEditing] = useState<boolean | null>(null);
  const isEditing = editing ?? !saved;
  const [draft, setDraft] = useState<Checkin>(checkin ?? {});
  const [isSaving, setIsSaving] = useState(false);
  const set = (key: keyof Checkin) => (value?: number) =>
    setDraft((d) => ({ ...d, [key]: value }));

  if (saved && !isEditing) {
    return (
      <Card className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-bold text-text-light dark:text-text-dark">
            Today's check-in
          </span>
          <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
            {checkinSummary(checkin).join(" · ")}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft(checkin ?? {});
            setIsEditing(true);
          }}
          className={`min-h-11 px-4 shrink-0 rounded-full bg-primary-50 dark:bg-primary-800/30 text-sm text-primary dark:text-primary-300 font-semibold ${FOCUS}`}
        >
          Edit
        </button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-bold text-text-light dark:text-text-dark">
          How are you today?
        </h2>
        <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
          Answer any you like. Your assigned trainers can see this.
        </span>
      </div>
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
              setIsEditing(false);
            } finally {
              setIsSaving(false);
            }
          }}
        />
        {saved && (
          <Button
            label="Cancel"
            decoration="cancel"
            className="min-h-11"
            onClick={() => setIsEditing(false)}
          />
        )}
      </div>
    </Card>
  );
};
