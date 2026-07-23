import { useState } from "react";

type Props = {
  value: number;
  label: string;
  labelDirection?: "row" | "col";
  unit?: string;
  nonZero?: boolean;
  updateValue: (value: number) => void;
};

export const IncrementDecrement = ({
  label,
  labelDirection,
  value,
  nonZero = false,
  unit,
  updateValue,
}: Props) => {
  const [v, setV] = useState(value);

  return (
    <div
      className={`
      flex 
      ${labelDirection === "col" ? "flex-col" : "flex-row"} 
      rounded-lg bg-transparent py-2
      `}
    >
      <span
        className={`pr-2 outline-none focus:outline-none text-center
                            hover:text-black focus:text-black  md:text-basecursor-default flex items-center 
                            text-gray-700 w-fit font-medium`}
      >
        {label}
      </span>

      <div className={`flex border border-1 rounded w-fit`}>
        <button
          type={"button"}
          className={`px-2 bg-gray-300 text-gray-600 hover:text-gray-700
                            hover:bg-gray-400 rounded 
                            cursor-pointer outline-none`}
          onClick={() => {
            const newV = v - 1;
            if (nonZero && newV < 0) {
              return;
            }

            setV(newV);
            updateValue(newV);
          }}
        >
          <span className="m-auto text-white">−</span>
        </button>
        <span
          className={`px-3 outline-none focus:outline-none text-center
                            hover:text-black focus:text-black  md:text-basecursor-default flex items-center 
                            text-gray-700 w-fit`}
        >
          {v}
          {unit}
        </span>
        <button
          type={"button"}
          className={`px-2 bg-blue-300 text-blue-600 hover:text-blue-700 
                            hover:bg-blue-400 rounded cursor-pointer`}
          onClick={() => {
            const newV = v + 1;
            setV(newV);
            updateValue(newV);
          }}
        >
          <span className="m-auto text-white">+</span>
        </button>
      </div>
    </div>
  );
};
