import {useId, useState} from "react";

type CheckboxProps = {
    label: string
    checked?: boolean
    toggleSelection: (selection: string) => void
}

export const Checkbox = ({label, checked, toggleSelection}:CheckboxProps) => {
    const [selected, setSelected] = useState<boolean>(checked ?? true)
    const id = useId()

    const checkboxHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelected(!selected)
        toggleSelection(label)
    }

    return (
        <div className={`flex items-center min-h-11`}>
            <input checked={selected} id={id} type="checkbox" value=""
                   className={`w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary
                        dark:focus:ring-primary-400 dark:ring-offset-gray-800 focus:ring-2
                        dark:bg-gray-700 dark:border-gray-600`}
                   onChange={checkboxHandler}
            />
            <label htmlFor={id} className={`ml-2 text-sm text-text-light dark:text-text-dark`}>
                {label}
            </label>
        </div>
    )
}