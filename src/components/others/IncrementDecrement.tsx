import { useEffect, useState } from "react";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  value: number;
  label: string;
  labelDirection?: "row" | "col";
  unit?: string;
  nonZero?: boolean;
  fullWidth?: boolean;
  updateValue: (value: number) => void;
};

export const IncrementDecrement = ({
  label,
  labelDirection,
  value,
  nonZero = false,
  unit,
  fullWidth = false,
  updateValue,
}: Props) => {
  const [v, setV] = useState(value);
  const [inputText, setInputText] = useState(String(value));

  useEffect(() => {
    setV(value);
    setInputText(String(value));
  }, [value]);

  const clamp = (n: number) => (nonZero && n < 0 ? 0 : n);

  const commit = (n: number) => {
    const clamped = clamp(n);
    setV(clamped);
    setInputText(String(clamped));
    updateValue(clamped);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputText(raw);

    if (raw === "" || raw === "-") {
      return;
    }

    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      const clamped = clamp(parsed);
      setV(clamped);
      updateValue(clamped);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(inputText, 10);
    commit(Number.isNaN(parsed) ? 0 : parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const atFloor = nonZero && v <= 0;

  const containerDirectionClasses =
    labelDirection === "col"
      ? "flex-col items-center gap-1"
      : labelDirection === "row"
        ? "flex-row items-center gap-2"
        : "flex-col items-start gap-1";

  const labelClasses =
    labelDirection === "col"
      ? "text-center w-fit"
      : labelDirection === "row"
        ? "w-32 shrink-0"
        : "w-full text-left";

  return (
    <div
      className={`flex ${fullWidth ? "w-full" : ""} ${containerDirectionClasses}`}
    >
      <span
        className={`text-xs font-normal uppercase tracking-wide text-text-muted-light/70 dark:text-text-muted-dark/70 whitespace-nowrap ${labelClasses}`}
      >
        {label}
      </span>

      <div
        className={`inline-flex items-stretch min-h-11 ${fullWidth ? "w-full" : "w-fit"} rounded-full border
        border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark overflow-hidden`}
      >
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={atFloor}
          className="min-w-8 sm:min-w-11 flex items-center justify-center text-secondary dark:text-secondary-200
            hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10"
          onClick={() => commit(v - 1)}
        >
          <FontAwesomeIcon icon={faMinus} className="text-xs" />
        </button>

        <input
          type="number"
          inputMode="numeric"
          aria-label={label}
          value={inputText}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`${fullWidth ? "flex-1 min-w-4 sm:min-w-10" : "w-12"} text-center bg-transparent text-sm font-medium
            text-text-light dark:text-text-dark border-l ${unit ? "" : "border-r"} border-gray-200 dark:border-gray-700
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10
            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />

        {unit && (
          <span className="flex items-center shrink-0 whitespace-nowrap pl-0.5 pr-1 sm:pl-1 sm:pr-2 text-xs sm:text-sm text-text-muted-light dark:text-text-muted-dark border-r border-gray-200 dark:border-gray-700">
            {unit}
          </span>
        )}

        <button
          type="button"
          aria-label={`Increase ${label}`}
          className="min-w-8 sm:min-w-11 flex items-center justify-center text-secondary dark:text-secondary-200
            hover:bg-gray-100 dark:hover:bg-gray-700
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10"
          onClick={() => commit(v + 1)}
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
        </button>
      </div>
    </div>
  );
};
