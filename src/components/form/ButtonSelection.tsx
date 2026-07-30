type Props = {
  label?: string;
  options: string[];
  selection: string;
  onSelect: (value: string) => void;
};

export const ButtonSelection = ({
  label,
  options,
  selection,
  onSelect,
}: Props) => {
  const activeIndex = Math.max(options.indexOf(selection), 0);

  return (
    <div>
      {label && (
        <label
          htmlFor={label}
          className="block mb-1 text-xs font-normal uppercase tracking-wide text-text-muted-light/70 dark:text-text-muted-dark/70"
        >
          {label}
        </label>
      )}
      <div
        role="radiogroup"
        aria-label={label}
        className="relative inline-flex w-fit rounded-full overflow-hidden
          border border-gray-300 dark:border-gray-600
          bg-gray-100 dark:bg-gray-800"
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 rounded-full bg-primary
            transition-transform duration-200 ease-in-out"
          style={{
            width: `${100 / options.length}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selection === option}
            onClick={() => onSelect(option)}
            className={`relative flex-1 py-1.5 px-4 rounded-full text-sm font-medium
              whitespace-nowrap transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10
              ${
                selection === option
                  ? "text-white"
                  : "text-text-light dark:text-text-dark hover:text-primary dark:hover:text-primary-300"
              }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};
