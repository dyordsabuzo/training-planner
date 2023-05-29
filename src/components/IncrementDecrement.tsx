type Props = {
    value: string
    label: string
    updateValue: (value: string) => void
}
const IncrementDecrement: React.FC<Props> = ({label, value, updateValue}) => {

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
                            updateValue((parseInt(value) - 1).toString())
                        }}>
                    <span className="m-auto text-white font-bold">−</span>
                </button>
                <span
                    className={`px-3 outline-none focus:outline-none text-center
                            hover:text-black focus:text-black  md:text-basecursor-default flex items-center 
                            text-gray-700 w-fit`}>
                {value}
                   </span>
                <button type={"button"}
                        className={`px-2 bg-blue-300 text-blue-600 hover:text-blue-700 
                            hover:bg-blue-400 rounded cursor-pointer`}
                        onClick={() => {
                            let _v = parseInt(value) + 1
                            updateValue(_v.toString())
                        }}>
                    <span className="m-auto text-white font-bold">+</span>
                </button>
            </div>
        </div>
    )
}

export default IncrementDecrement