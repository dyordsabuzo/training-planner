type Props = {
  label: string;
  value: boolean;
  toggle: (value: boolean) => void;
};

export const Toggle = ({ label, value, toggle }: Props) => {
  return (
    <div>
      <span className="block mb-1 text-xs font-normal uppercase tracking-wide text-text-muted-light/70 dark:text-text-muted-dark/70">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => toggle(!value)}
        className={`h-7 w-12 flex items-center rounded-full p-1
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
          dark:focus-visible:ring-offset-surface-dark
          ${value ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
      >
        <span
          className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out ${
            value ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
};
