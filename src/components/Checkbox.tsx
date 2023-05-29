import {useState} from "react";

type CheckboxProps = {
    label: string
    checked?: boolean
    toggleSelection: (selection: string) => void
}

const Checkbox: React.FC<CheckboxProps> = ({label, checked, toggleSelection}) => {
    const [selected, setSelected] = useState<boolean>(checked ?? true)

    const checkboxHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelected(!selected)
        toggleSelection(label)
    }

    return (
        <div className={`flex items-center`}>
            <input checked={selected} id="default-checkbox" type="checkbox" value=""
                   className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500
                        dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 
                        dark:bg-gray-700 dark:border-gray-600`}
                   onChange={checkboxHandler}
            />
            <label htmlFor="default-checkbox" className={`ml-2 text-sm text-gray-900 dark:text-gray-300`}>
                {label}
            </label>
        </div>
    )
}

export default Checkbox