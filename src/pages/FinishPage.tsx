import Button from "../components/Button";
import React from "react";
import WrapperPage from "./WrapperPage";

type Props = {
    wrapSession: () => void
}
const FinishPage: React.FC<Props> = ({wrapSession}) => {
    return (
        <WrapperPage>
            <div className={`flex flex-col gap-4`}>
                <Button className={`py-8`} label={"FINISH"} clickHandler={(flag) => wrapSession()}/>
            </div>
        </WrapperPage>
    )
}

export default FinishPage;