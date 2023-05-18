import Button from "../components/Button";
import {ExercisePairType, ExerciseType} from "../types/ExerciseType";
import React, {useContext} from "react";
import SessionContext from "../context/SessionContext";

const FinishPage = () => {
    const handleButtonClick = (flag: boolean) => {
        sessionContext.setIsRunning(true)
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
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