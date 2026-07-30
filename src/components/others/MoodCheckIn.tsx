import {
  faFaceTired,
  faFaceFrown,
  faFaceMeh,
  faFaceSmile,
  faFaceLaughBeam,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export type MoodValue = {
  rating?: number;
  note?: string;
};

type Props = {
  title: string;
  value: MoodValue;
  onChange: (value: MoodValue) => void;
};

const RATINGS = [
  { value: 1, icon: faFaceTired, label: "Exhausted" },
  { value: 2, icon: faFaceFrown, label: "Low" },
  { value: 3, icon: faFaceMeh, label: "Okay" },
  { value: 4, icon: faFaceSmile, label: "Good" },
  { value: 5, icon: faFaceLaughBeam, label: "Great" },
];

export const MoodCheckIn = ({ title, value, onChange }: Props) => {
  return (
    <div
      className="border border-gray-200 dark:border-gray-700 rounded-md p-4
        bg-white dark:bg-surface-dark shadow-sm flex flex-col gap-3"
    >
      <span className="text-xs font-medium uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
        {title}
      </span>

      <div className="flex justify-between gap-1">
        {RATINGS.map((rating) => (
          <button
            key={rating.value}
            type="button"
            aria-label={rating.label}
            aria-pressed={value.rating === rating.value}
            onClick={() => onChange({ ...value, rating: rating.value })}
            className={`flex-1 flex flex-col items-center gap-1 min-h-11 py-2 rounded-lg text-xs font-medium
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
              ${
                value.rating === rating.value
                  ? "bg-primary-50 text-primary dark:bg-primary-800/30 dark:text-primary-200"
                  : "text-text-muted-light dark:text-text-muted-dark hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
          >
            <FontAwesomeIcon icon={rating.icon} className="text-xl" />
            {rating.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={value.note ?? ""}
        onChange={(e) => onChange({ ...value, note: e.target.value })}
        placeholder="Add a quick note (optional)"
        aria-label={`${title} note`}
        className="min-h-11 px-3 bg-white dark:bg-surface-dark
          border border-gray-300 dark:border-gray-600 text-text-light dark:text-text-dark
          text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
      />
    </div>
  );
};
