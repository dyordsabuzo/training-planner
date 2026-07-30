import { useState } from "react";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  label: string;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
};

// Custom disclosure replacing the native <details>/<summary> element, so the
// expand/collapse affordance matches the chevron-based pattern already used
// elsewhere in the app (e.g. SingleSelect/MultiSelect's dropdown chevron).
export const CollapsibleSection = ({
  label,
  defaultOpen = false,
  className,
  children,
}: Props) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 py-2 text-sm font-semibold text-text-light dark:text-text-dark
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
      >
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-xs text-text-muted-light dark:text-text-muted-dark transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
        {label}
      </button>

      {isOpen && <div className="flex flex-col gap-4 pt-2">{children}</div>}
    </div>
  );
};
