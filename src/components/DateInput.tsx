import React, {useState} from "react";
import DatePicker from "react-datepicker";

type InputProps = {
    label: string
    value: Date
    required?: boolean
    readonly?: boolean
    placeholder: string
    changeValue: (value: Date) => void
    className?: string
}

const DateInput: React.FC<InputProps> = ({
                                             label,
                                             value,
                                             required,
                                             readonly,
                                             placeholder,
                                             changeValue,
                                             className
                                         }) => {
    const [fieldValue, setFieldValue] = useState<Date>(value)

    return (
        <div className={`w-full ${className}`}>
            <label htmlFor={label} className={`block mb-1 text-sm font-medium 
                    text-gray-900 text-gray-900`}>
                {label}
            </label>
            <DatePicker onChange={(date: Date) => {
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
            />

        </div>
    )
}

export default DateInput;