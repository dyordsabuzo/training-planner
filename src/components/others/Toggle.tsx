import React, { useState } from "react";

type Props = {
  label: string;
  value: boolean;
  toggle: (value: boolean) => void;
};

export const Toggle = ({ label, value, toggle }: Props) => {
  return (
    <label
      htmlFor={label}
      className={`relative flex items-center gap-2 mb-1 text-sm font-medium
        text-gray-900 text-gray-900`}
    >
      {label}
      <div
        className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer ${
          value ? "bg-green-400" : "bg-gray-300"
        }`}
        onClick={() => {
          toggle(!value);
        }}
      >
        <div
          className={`bg-white w-6 h-6 rounded-full shadow-md transform duration-300 ease-in-out ${
            value ? "translate-x-6" : ""
          }`}
        ></div>
      </div>
    </label>
  );
};
