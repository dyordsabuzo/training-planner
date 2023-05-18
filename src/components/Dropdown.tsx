type DropdownProps = {
    label: string,
    options: string[]
    required: boolean
    valueHandler: (value: string) => void
}

const Dropdown: React.FC<DropdownProps> = ({label, options, required, valueHandler}) => {
    return (
        <div className="relative w-full">
            <label htmlFor={label} className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {label}
            </label>
            <select
                id={label}
                className={`w-full p-2.5 text-gray-500 bg-white border rounded-md shadow-sm outline-none 
                    appearance-none focus:border-indigo-600`}
                onChange={(e) => valueHandler(e.target.value)}
                required={required}>
                <option value={""}>Select {label}</option>
                {options.map(o => (
                    <option key={o} value={o}>{o}</option>
                ))}
            </select>
        </div>
    )
}

export default Dropdown;