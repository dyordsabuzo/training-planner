import WrapperPage from "../pages/WrapperPage";

type Props = {
    children?: React.ReactNode
}

const BaseListing: React.FC<Props> = ({children}) => {
    return (
        <WrapperPage>
            {children}
        </WrapperPage>
    )
}

export default BaseListing;