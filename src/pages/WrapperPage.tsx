type Props = {
    children?: React.ReactNode
}

const WrapperPage: React.FC<Props> = ({children}) => {
    return (
        <div className={`grid place-content-center`}>
            <div className={`flex flex-col gap-2 p-2 min-w-[20rem]`}>
                {children}
            </div>
        </div>
    )
}

export default WrapperPage