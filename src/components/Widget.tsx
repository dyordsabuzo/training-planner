type Props = {
    label: string
    value: string
    unit: string
}

const Widget: React.FC<Props> = ({label, value, unit}) => {
    return (
        <div className={`grid place-content-center`}>
            <div className={`text-xs uppercase font-extralight`}>
                {label}
            </div>
            <div className={`flex gap-1 text-2xl leading-none`}>
                <span>{value}</span>
                <span>{unit}</span>
            </div>
        </div>
    )
}

export default Widget
