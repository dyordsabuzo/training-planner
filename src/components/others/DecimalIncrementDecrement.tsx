import { useEffect, useState } from "react";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  label: string;
  value: number;
  unit?: string;
  nonZero?: boolean;
  fullWidth?: boolean;
  // Amount +/- step by, and typed values round to. 0.5 suits most weights.
  step?: number;
  // Lowest allowed value; overrides nonZero's floor of 0 when set.
  min?: number;
  // Bigger, bolder value for reading at a glance mid-exercise. The unit moves
  // into the label to leave room for the number.
  large?: boolean;
  updateValue: (value: number) => void;
};

// Same look as ui-components' IncrementDecrement, but accepts decimals —
// that one always rounds to a whole number as you type, which doesn't work
// for weights like 72.5kg.
export const DecimalIncrementDecrement = ({
  label,
  value,
  unit,
  nonZero = false,
  fullWidth = false,
  step = 0.5,
  min,
  large = false,
  updateValue,
}: Props) => {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const floor = min ?? (nonZero ? 0 : undefined);
  const clamp = (n: number) => (floor !== undefined && n < floor ? floor : n);

  // Rounds off binary floating-point drift (e.g. 72.5 + 0.5 → 72.99999…9).
  const round = (n: number) => Math.round(n * 100) / 100;

  const commit = (n: number) => {
    const next = round(clamp(n));
    setText(String(next));
    updateValue(next);
  };

  const handleChange = (raw: string) => {
    // Lets intermediate states like "", "-", "7." pass through untouched,
    // so the field doesn't fight a half-typed decimal.
    if (!/^-?\d*\.?\d*$/.test(raw)) return;
    setText(raw);
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed)) updateValue(clamp(parsed));
  };

  const showUnitInLabel =
    large && unit && unit.toLowerCase() !== label.toLowerCase();
  const showUnitCell = unit && !large;

  const handleBlur = () => {
    const parsed = parseFloat(text);
    commit(Number.isNaN(parsed) ? floor ?? 0 : parsed);
  };

  return (
    <div className={`flex flex-col items-center gap-1 ${fullWidth ? "w-full" : ""}`}>
      <span className={`${large ? "text-base font-bold text-text-light dark:text-text-dark" : "text-xs font-normal text-text-muted-light/70 dark:text-text-muted-dark/70"} uppercase tracking-wide whitespace-nowrap text-center w-fit`}>
        {label}
        {showUnitInLabel && ` (${unit})`}
      </span>
      <div
        className={`inline-flex items-stretch ${large ? "min-h-20" : "min-h-11"} ${fullWidth ? "w-full" : "w-fit"} rounded-full border
          border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark overflow-hidden`}
      >
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={floor !== undefined && value <= floor}
          onClick={() => commit(value - step)}
          className={`${large ? "min-w-9 sm:min-w-11" : "min-w-8 sm:min-w-11"} flex items-center justify-center text-secondary dark:text-secondary-200
            hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10`}
        >
          <FontAwesomeIcon icon={faMinus} className={large ? "text-base" : "text-xs"} />
        </button>
        <input
          type="text"
          inputMode="decimal"
          aria-label={label}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className={`${fullWidth ? "flex-1 min-w-4 sm:min-w-10" : "w-12"} text-center bg-transparent ${large ? "text-3xl sm:text-5xl font-bold" : "text-sm font-medium"}
            text-text-light dark:text-text-dark border-l ${showUnitCell ? "" : "border-r"} border-gray-200 dark:border-gray-700
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10`}
        />
        {showUnitCell && (
          <span className="flex items-center shrink-0 whitespace-nowrap pl-0.5 pr-1 sm:pl-1 sm:pr-2 text-xs sm:text-sm text-text-muted-light dark:text-text-muted-dark border-r border-gray-200 dark:border-gray-700">
            {unit}
          </span>
        )}
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => commit(value + step)}
          className={`${large ? "min-w-9 sm:min-w-11" : "min-w-8 sm:min-w-11"} flex items-center justify-center text-secondary dark:text-secondary-200
            hover:bg-gray-100 dark:hover:bg-gray-700
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10`}
        >
          <FontAwesomeIcon icon={faPlus} className={large ? "text-base" : "text-xs"} />
        </button>
      </div>
    </div>
  );
};
