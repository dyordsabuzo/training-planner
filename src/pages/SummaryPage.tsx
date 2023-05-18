import Button from "../components/Button";
import {ExerciseType} from "../types/ExerciseType";
import React, {useContext} from "react";
import SessionContext from "../context/SessionContext";

const SummaryPage = () => {
    const handleButtonClick = (flag: boolean) => {
        sessionContext.setIsRunning(true)
    }

    const sessionContext = useContext(SessionContext)

    return (
        <div className={`flex flex-col gap-2 p-8 min-w-[30rem]`}>
            <div className={`flex flex-col gap-4`}>
                <Button label={"BEGIN"} clickHandler={handleButtonClick}/>
                {(sessionContext.sessionData as any).exerciseCombinations.map((pair: ExerciseType[], index: number) => (
                    <div key={index} className={`shadown-md p-4 border rounded-md flex flex-col gap-2`}>
                        <span className={`text-xl`}>Superset {index + 1}</span>
                        {pair.map((e: any) => (
                            <span key={e.exercise} className={`text-sm`}>{e.name}</span>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SummaryPage;