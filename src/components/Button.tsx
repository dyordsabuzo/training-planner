type ButtonProps = {
    label: string,
    clickHandler: (flag: boolean) => void
}

const Button: React.FC<ButtonProps> = ({label, clickHandler}) => {
    return (
        <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-6 px-4 rounded"
            onClick={() => clickHandler(true)}>
            {label}
        </button>
    )
}

export default Button;