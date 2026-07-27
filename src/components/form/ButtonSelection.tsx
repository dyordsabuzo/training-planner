import { useState } from "react";
import { Button } from "./Button";

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
  const [current, setCurrent] = useState<string>(selection);
  return (
    <div className={`flex flex-row gap-2 items-center`}>
      {label && (
        <label
          htmlFor={label}
          className="block mb-1 text-sm font-medium text-text-light dark:text-text-dark"
        >
          {label}
        </label>
      )}
      <div
        className={`
          flex border border-gray-300 dark:border-gray-600 w-fit rounded-md
          divide-x divide-gray-300 dark:divide-gray-600
        `}
      >
        {options.map((option) => (
          <Button
            key={option}
            className={`
              min-h-11 ${current === option ? "bg-primary hover:bg-primary-700 text-white" : "text-text-light dark:text-text-dark bg-white dark:bg-surface-dark"}
          `}
            decoration="selection"
            label={option}
            onClick={() => {
              setCurrent(option);
              onSelect(option);
            }}
          />
        ))}
      </div>
    </div>
  );
};
