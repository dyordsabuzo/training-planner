import { useState } from "react"

type Props = {
    value: string
    label: string
    nonZero?: boolean
    updateValue: (value: string) => void
}

export const IncrementDecrement = ({label, value, nonZero = false, updateValue}:Props) => {
    const [v, setV] = useState(value);

    return (
        <div className="flex flex-row rounded-lg bg-transparent py-2">
            <span className={`pr-2 outline-none focus:outline-none text-center
                            hover:text-black focus:text-black  md:text-basecursor-default flex items-center 
                            text-gray-700 w-fit font-medium`}>
                {label}
            </span>

            <div className={`flex border border-1 rounded`}>
                <button type={"button"}
                        className={`px-2 bg-gray-300 text-gray-600 hover:text-gray-700
                            hover:bg-gray-400 rounded 
                            cursor-pointer outline-none`}
                        onClick={() => {
                            const newV = parseInt(v) - 1;
                            if (nonZero && newV < 0) {
                                return;
                            }

                            setV(newV.toString());
                            updateValue(newV.toString())
                        }}>
                    <span className="m-auto text-white font-bold">−</span>
                </button>
                <span
                    className={`px-3 outline-none focus:outline-none text-center
                            hover:text-black focus:text-black  md:text-basecursor-default flex items-center 
                            text-gray-700 w-fit`}>
                {v}
                   </span>
                <button type={"button"}
                        className={`px-2 bg-blue-300 text-blue-600 hover:text-blue-700 
                            hover:bg-blue-400 rounded cursor-pointer`}
                        onClick={() => {
                            const newV = parseInt(v) + 1;
                            setV(newV.toString());
                            updateValue(newV.toString())
                        }}>
                    <span className="m-auto text-white font-bold">+</span>
                </button>
            </div>
        </div>
    )
}
