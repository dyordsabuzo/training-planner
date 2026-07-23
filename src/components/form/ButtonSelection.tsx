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
          className={`block mb-1 text-sm font-medium 
                    text-gray-900 dark:text-gray-900`}
        >
          {label}
        </label>
      )}
      <div
        className={`
          flex border border-black-600 w-fit rounded-md
          divide-x divide-slate-100
        `}
      >
        {options.map((option) => (
          <Button
            key={option}
            className={`
              ${current === option ? "border border-3 border-green-700 text-white bg-green-500 hover:bg-green-700 rounded-md" : "text-black bg-white"}
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
