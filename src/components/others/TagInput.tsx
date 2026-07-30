import React, { useState } from "react";
import { toStringArray } from "../../common/utils";

type Props = {
  label?: string;
  list: string[];
  options: string[];
  placeholder?: string;
  updateList: (value: string[]) => void;
  className?: string;
};

export const TagInput = ({
  label = "",
  list,
  options,
  placeholder = "",
  updateList,
  className,
}: Props) => {
  const [tagList, setTagList] = useState(toStringArray(list));
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", "Tab", ","].includes(e.key)) {
      e.preventDefault();
      if (!inputValue) {
        return;
      }

      if (!inputValue.length) {
        return;
      }

      if (tagList.includes(inputValue)) {
        return;
      }

      const newList = [...tagList, inputValue];
      setTagList(newList);
      updateList(newList);
      setInputValue("");
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label !== "" && (
        <label
          htmlFor={label}
          className="block mb-1 text-xs font-normal uppercase tracking-wide text-text-muted-light/70 dark:text-text-muted-dark/70"
        >
          {label}
        </label>
      )}
      <div
        className={`w-full bg-white dark:bg-surface-dark rounded border border-gray-300 dark:border-gray-600
                    focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-200
                    text-base outline-none py-1 px-3 leading-8 transition-colors duration-200
                    ease-in-out`}
      >
        <div className={`flex flex-wrap gap-1`}>
          {tagList.map((item: string) => (
            <span
              className={`flex flex-wrap pl-2 w-fit bg-primary-100 dark:bg-primary-800 dark:text-text-dark items-center text-sm
                        rounded-md my-1 mr-1`}
              key={item}
            >
              {item}
              <button
                type={"button"}
                aria-label={`Remove ${item}`}
                className="w-6 h-8 inline-block align-middle text-gray-500 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                onClick={(e) => {
                  const newList = tagList.filter((element) => element !== item);
                  setTagList(newList);
                  updateList(newList);
                }}
              >
                <svg
                  className="w-6 h-6 fill-current mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.78 14.36a1 1 0 0 1-1.42 1.42l-2.82-2.83-2.83 2.83a1 1 0 1 1-1.42-1.42l2.83-2.82L7.3 8.7a1 1 0 0 1 1.42-1.42l2.83 2.83 2.82-2.83a1 1 0 0 1 1.42 1.42l-2.83 2.83 2.83 2.82z"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          id={label}
          className="focus:border-0 focus:outline-none bg-transparent text-text-light dark:text-text-dark text-sm w-full"
          placeholder={placeholder || `Enter ${label.toLowerCase()} to add`}
          value={inputValue}
          onKeyDown={handleKeyDown}
          onChange={handleInputChange}
          list={`${label}-tags`}
        />

        <datalist id={`${label}-tags`}>
          {options.map((option: string) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </datalist>
      </div>
    </div>
  );
};
