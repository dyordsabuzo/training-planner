import React, { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

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
  placeholder,
  changeValue,
  className,
}: InputProps) => {
  const [fieldValue, setFieldValue] = useState<Dayjs | null>(value);

  return (
    <div className={`w-full ${className}`}>
      <label
        htmlFor={label}
        className={`block mb-1 text-sm font-medium 
                    text-gray-900 text-gray-900`}
      >
        {label}
      </label>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          defaultValue={dayjs(new Date())}
          value={fieldValue}
          onChange={(date) => {
            if (date) {
              changeValue(date);
              setFieldValue(date);
            }
          }}
          slotProps={{
            textField: {
              className: `
                            border border-gray-300 text-gray-900 text-sm rounded-lg
                            focus:ring-blue-500 focus:border-blue-500 block p-2.5
                            dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
                            dark:focus:ring-blue-500
                            dark:focus:border-blue-500 w-full`,
            },
          }}
        />
      </LocalizationProvider>

      {/* <DatePicker onChange={(date: Date) => {
                changeValue(date)
                setFieldValue(date)
            }} selected={fieldValue} onSelect={(date: Date) => {
                changeValue(date)
                setFieldValue(date)
            }}
                        className={`
                            border border-gray-300 text-gray-900 text-sm rounded-lg
                            focus:ring-blue-500 focus:border-blue-500 block p-2.5
                            dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
                            dark:focus:ring-blue-500
                            dark:focus:border-blue-500 w-full`}
            /> */}
    </div>
  );
};

// export default DateInput;
