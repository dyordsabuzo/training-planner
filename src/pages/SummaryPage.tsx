import Button from "../components/Button";
// import {ExerciseType} from "../types/ExerciseType";
import React, {useContext} from "react";
import SessionContext from "../context/SessionContext";
import WrapperPage from "./WrapperPage";

const SummaryPage = () => {
    const handleButtonClick = (flag: boolean) => {
        sessionContext.setIsRunning(true)
    }

    const sessionContext = useContext(SessionContext)

    return (
        <WrapperPage>
            <div className={`grid place-content-center gap-2 pt-12`}>
                <Button label={"BEGIN"} clickHandler={handleButtonClick}
                        className={`py-4`}/>
                {/*{(sessionContext.sessionData as any).exerciseCombinations.map((pair: ExerciseType[], index: number) => (*/}
                {/*    <div key={index} className={`shadown-md p-4 border rounded-md flex flex-col gap-2`}>*/}
                {/*        <span className={`text-xl`}>Superset {index + 1}</span>*/}
                {/*        {pair.map((e: any) => (*/}
                {/*            <span key={e.exercise} className={`text-sm`}>{e.name}</span>*/}
                {/*        ))}*/}
                {/*    </div>*/}
                {/*))}*/}

                {Object.values((sessionContext.sessionData as any).supersets).map((superset: any) => (
                    <div key={superset.name} className={`shadown-md p-4 border rounded-md flex flex-col gap-2`}>
                        <span className={`text-xl`}>{superset.name}</span>
                        {superset.exercises.map((exercise: any) => (
                            <span key={exercise.name} className={`text-sm`}>
                                {exercise.name}
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        </WrapperPage>
    )
}

export default SummaryPage;