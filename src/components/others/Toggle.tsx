type Props = {
  label: string;
  value: boolean;
  toggle: (value: boolean) => void;
};

export const Toggle = ({ label, value, toggle }: Props) => {
  return (
    <span className="flex items-center gap-2">
      <span className="text-sm font-medium text-text-light dark:text-text-dark">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => toggle(!value)}
        className={`min-h-11 w-14 flex items-center rounded-full p-1
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
          dark:focus-visible:ring-offset-surface-dark
          ${value ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
      >
        <span
          className={`bg-white w-6 h-6 rounded-full shadow-md transform duration-300 ease-in-out ${
            value ? "translate-x-6" : ""
          }`}
        />
      </button>
    </span>
  );
};
