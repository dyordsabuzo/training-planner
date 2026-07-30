import { useEffect, useRef, useState } from "react";
import { faChevronDown, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  label?: string;
  options: string[];
  selected: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

// Closed-selection dropdown for picking exactly one value from a fixed list
// (a single-select counterpart to MultiSelect) — selecting an option closes
// the dropdown immediately, unlike MultiSelect's toggle-and-stay-open.
export const SingleSelect = ({
  label,
  options,
  selected,
  onChange,
  placeholder = "Select an option",
  className,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectOption = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const sortedOptions = [...options].sort((a, b) => a.localeCompare(b));

  return (
    <div className={`w-full ${className ?? ""}`} ref={containerRef}>
      {label && (
        <label className="block mb-1 text-xs font-medium uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className="min-h-11 w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-left
            border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
        >
          <span
            className={`flex-1 text-sm truncate ${
              selected
                ? "text-text-light dark:text-text-dark"
                : "text-text-muted-light dark:text-text-muted-dark"
            }`}
          >
            {selected || placeholder}
          </span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`text-xs text-text-muted-light dark:text-text-muted-dark shrink-0
              transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <ul
            role="listbox"
            className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border
              border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark shadow-lg py-1"
          >
            {options.length === 0 && (
              <li className="px-3 py-2 text-sm text-text-muted-light dark:text-text-muted-dark italic">
                No options available
              </li>
            )}
            {sortedOptions.map((option) => {
              const isSelected = option === selected;
              return (
                <li key={option} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => selectOption(option)}
                    className="min-h-11 w-full flex items-center justify-between gap-2 px-3 text-sm text-left
                      text-text-light dark:text-text-dark
                      hover:bg-gray-50 dark:hover:bg-gray-800
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  >
                    {option}
                    {isSelected && (
                      <FontAwesomeIcon icon={faCheck} className="text-primary dark:text-primary-300" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
