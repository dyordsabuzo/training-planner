import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";

type InputProps = {
  label: string;
  value: Dayjs | null;
  required?: boolean;
  readonly?: boolean;
  placeholder: string;
  changeValue: (value: Dayjs) => void;
  className?: string;
};

export const DateInput = ({
  label,
  value,
  required,
  readonly,
  changeValue,
  className,
}: InputProps) => {
  const [fieldValue, setFieldValue] = useState<Dayjs | null>(value);

  const changeValueHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = dayjs(e.target.value);
    if (date.isValid()) {
      changeValue(date);
      setFieldValue(date);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <label
        htmlFor={label}
        className="block mb-1 text-sm font-medium text-text-light dark:text-text-dark"
      >
        {label}
      </label>
      <input
        type="date"
        id={label}
        className={`
          ${readonly ? "bg-gray-200 dark:bg-gray-800" : "bg-white dark:bg-surface-dark"}
          border border-gray-300 dark:border-gray-600 text-text-light dark:text-text-dark
          text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-primary
          block min-h-11 p-2.5 w-full`}
        value={fieldValue ? fieldValue.format("YYYY-MM-DD") : ""}
        required={required}
        readOnly={readonly}
        onChange={changeValueHandler}
      />
    </div>
  );
};
