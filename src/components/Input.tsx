import {useState} from "react";

type InputProps = {
    label: string
    value: string
    required?: boolean
    readonly?: boolean
    placeholder: string
    changeValue: (value: string) => void
    className?: string
}

const Input: React.FC<InputProps> = ({label, value, required, readonly, placeholder, changeValue, className}) => {
    const [fieldValue, setFieldValue] = useState(value)

    const changeValueHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        changeValue(e.target.value)
        setFieldValue(e.target.value)
    }

    return (
        <div className={`w-full ${className}`}>
            <label htmlFor={label} className={`block mb-1 text-sm font-medium 
                    text-gray-900 dark:text-gray-900`}>
                {label}
            </label>
            <input type="text" id={label}
                   className={`
                        ${readonly ? "bg-gray-200" : "bg-white"}
                        border border-gray-300 text-gray-900 text-sm rounded-lg 
                        focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 
                        dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 
                        dark:focus:border-blue-500 w-full`}
                   placeholder={placeholder}
                   value={fieldValue}
                   required={required}
                   readOnly={readonly}
                   onChange={changeValueHandler}
            />
        </div>
    )
}

export default Input;