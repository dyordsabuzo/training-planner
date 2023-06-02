type Props = {
    children?: React.ReactNode
}

const BaseListing: React.FC<Props> = ({children}) => {
    return (
        <div className={`w-[25rem] flex flex-col gap-2`}>
            {children}
        </div>
    )
}

export default BaseListing;