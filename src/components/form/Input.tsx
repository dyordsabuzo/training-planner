import { forwardRef, useState } from "react";

type Props = {
  label?: string;
  type?: string;
  value: string;
  required?: boolean;
  readonly?: boolean;
  placeholder?: string;
  className?: string;
  error?: string;
  changeValue: (value: string) => void;
};

export const Input = forwardRef<HTMLInputElement, Props>(
  (
    {
      label,
      type = "text",
      value,
      required,
      readonly,
      placeholder,
      className,
      error,
      changeValue,
    },
    ref
  ) => {
    const [isEditing, setIsEditing] = useState(false);
    const isReadOnly = readonly ?? !isEditing;

    const changeValueHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      changeValue(e.target.value);
    };

    return (
      <div className={`w-full ${className}`} ref={ref}>
        <label
          htmlFor={label}
          className="block mb-1 text-xs font-normal uppercase tracking-wide text-text-muted-light/70 dark:text-text-muted-dark/70"
        >
          {label}
        </label>
        <input
          type={type}
          id={label}
          className={`
                          ${
                            isReadOnly
                              ? "bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-gray-800/60"
                              : "bg-white dark:bg-surface-dark border-gray-300 dark:border-gray-600"
                          }
                          border text-text-light dark:text-text-dark
                          text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-primary
                          block min-h-11 p-2.5 dark:placeholder-gray-400 w-full
                          transition-colors duration-150
                          ${error ? "!border-danger focus:!ring-danger focus:!border-danger" : ""}`}
          placeholder={placeholder}
          value={value}
          required={required}
          readOnly={isReadOnly}
          aria-invalid={!!error}
          aria-describedby={error && label ? `${label}-error` : undefined}
          onFocus={() => setIsEditing(true)}
          onChange={changeValueHandler}
        />
        {error && (
          <p
            id={label ? `${label}-error` : undefined}
            className="mt-1 text-xs text-danger"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
