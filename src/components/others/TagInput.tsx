import React, { useState } from "react";

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
  const [tagList, setTagList] = useState(list || []);
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
          className={`block mb-1 text-sm font-medium 
                    text-gray-900 dark:text-gray-900`}
        >
          {label}
        </label>
      )}
      <div
        className={`w-full bg-white rounded border border-gray-300  
                    focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 
                    text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 
                    ease-in-out`}
      >
        <div className={`flex flex-wrap gap-1`}>
          {tagList.map((item: string) => (
            <span
              className={`flex flex-wrap pl-2 w-fit bg-indigo-100 items-center text-sm 
                        rounded-md my-1 mr-1`}
              key={item}
            >
              {item}
              <button
                type={"button"}
                className="w-6 h-8 inline-block align-middle text-gray-500 hover:text-gray-600 focus:outline-none"
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
          // className={`
          //  bg-white border border-gray-300 text-gray-900 text-sm rounded-lg
          //  focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700
          //  dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500
          //  dark:focus:border-blue-500 w-full`}
          className={`focus:border-0 focus:outline-none text-gray-700 text-sm w-full`}
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
