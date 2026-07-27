import { forwardRef, useState } from "react";

type Props = {
  label?: string;
  type?: string;
  value: string;
  required?: boolean;
  readonly?: boolean;
  placeholder?: string;
  className?: string;
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
      changeValue,
    },
    ref
  ) => {
    const [fieldValue, setFieldValue] = useState(value);

    const changeValueHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      changeValue(e.target.value);
      setFieldValue(e.target.value);
    };

    return (
      <div className={`w-full ${className}`} ref={ref}>
        <label
          htmlFor={label}
          className="block mb-1 text-sm font-medium text-text-light dark:text-text-dark"
        >
          {label}
        </label>
        <input
          type={type}
          id={label}
          className={`
                          ${readonly ? "bg-gray-200 dark:bg-gray-800" : "bg-white dark:bg-surface-dark"}
                          border border-gray-300 dark:border-gray-600 text-text-light dark:text-text-dark
                          text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-primary
                          block min-h-11 p-2.5 dark:placeholder-gray-400 w-full`}
          placeholder={placeholder}
          value={fieldValue}
          required={required}
          readOnly={readonly}
          onChange={changeValueHandler}
        />
      </div>
    );
  }
);
