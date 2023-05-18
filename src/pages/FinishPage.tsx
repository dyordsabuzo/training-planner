import Button from "../components/Button";
import React, {useContext} from "react";
import SessionContext from "../context/SessionContext";

const FinishPage = () => {
    const handleButtonClick = (flag: boolean) => {
        sessionContext.setIsRunning(true)
    }

    const sessionContext = useContext(SessionContext)

    return (
        <div className={`flex flex-col gap-2 p-8 min-w-[30rem]`}>
            <div className={`flex flex-col gap-4`}>
                <Button label={"FINISH"} clickHandler={handleButtonClick}/>
            </div>

        </div>
    )
}

export default FinishPage;