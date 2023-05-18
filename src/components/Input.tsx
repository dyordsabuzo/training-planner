type InputProps = {
    label: string
    value: string
    required?: boolean
    readonly?: boolean
    placeholder: string
    changeValue: (value: string) => void
}

const Input: React.FC<InputProps> = ({label, value, required, readonly, placeholder, changeValue}) => {
    return (
        <div className={`w-full`}>
            <label htmlFor={label} className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {label}
            </label>
            <input type="text" id={label}
                   className={`
                        ${readonly ? "bg-gray-200" : "bg-white"}
                        border border-gray-300 text-gray-900 text-sm rounded-lg 
                        focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 
                        dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 
                        dark:focus:border-blue-500`}
                   placeholder={placeholder}
                   value={value}
                   required={required}
                   readOnly={readonly}
                   onChange={(e) => changeValue(e.target.value)}
            />
        </div>
    )
}

export default Input;