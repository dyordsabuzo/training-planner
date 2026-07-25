type DropdownProps = {
    label: string,
    options: string[]
    required: boolean
    valueHandler: (value: string) => void
}

export const Dropdown = ({label, options, required, valueHandler}:DropdownProps) => {
    return (
        <div className="relative w-full">
            <label htmlFor={label} className="block mb-2 text-sm font-medium text-text-light dark:text-text-dark">
                {label}
            </label>
            <select
                id={label}
                className={`w-full min-h-11 p-2.5 text-text-light dark:text-text-dark
                    bg-white dark:bg-surface-dark border border-gray-300 dark:border-gray-600
                    rounded-md shadow-sm outline-none appearance-none
                    focus:ring-2 focus:ring-primary focus:border-primary`}
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
