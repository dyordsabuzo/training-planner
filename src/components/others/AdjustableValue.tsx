import { useCallback, useState } from "react";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Modal } from "@dyordsabuzo/ui-components";
import { DecimalIncrementDecrement } from "./DecimalIncrementDecrement";
import { useScrollToTopOnClose } from "../../common/useScrollToTopOnClose";

type Props = React.ComponentProps<typeof DecimalIncrementDecrement>;

// Large read-only value for glancing at mid-exercise; tapping it opens the
// +/- editor in a modal so it can't be bumped by accident.
export const AdjustableValue = (props: Props) => {
  const { label, value, unit } = props;
  const [isEditing, setIsEditing] = useState(false);
  // Must be a stable reference: Modal re-runs its focus-first-element effect
  // whenever onClose changes, which would steal focus from the input on
  // every keystroke (each edit re-renders the parent).
  const close = useCallback(() => setIsEditing(false), []);
  useScrollToTopOnClose(isEditing);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        aria-label={`${label}: ${value}${unit ? ` ${unit}` : ""}. Tap to adjust`}
        className="w-full flex flex-col items-center gap-1 rounded-2xl border border-gray-300 dark:border-gray-600
          bg-white dark:bg-surface-dark py-3 active:scale-95 transition-transform
          hover:bg-gray-50 dark:hover:bg-gray-800
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="text-base font-bold uppercase tracking-wide text-text-light dark:text-text-dark">
          {label}
        </span>
        <span className="flex items-baseline gap-1 text-text-light dark:text-text-dark">
          <span className="text-5xl sm:text-6xl font-bold leading-none">{value}</span>
          {unit && unit.toLowerCase() !== label.toLowerCase() && (
            <span className="text-2xl font-bold text-text-light dark:text-text-dark">
              {unit}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 text-xs text-primary dark:text-primary-300">
          <FontAwesomeIcon icon={faPen} />
          Tap to adjust
        </span>
      </button>
      <Modal
        title={`Adjust ${label.toLowerCase()}`}
        titleClassName="text-2xl font-bold"
        isOpen={isEditing}
        onClose={close}
      >
        <div className="flex flex-col gap-4">
          <DecimalIncrementDecrement {...props} large />
          <Button label="Done" className="w-full" onClick={close} />
        </div>
      </Modal>
    </>
  );
};
