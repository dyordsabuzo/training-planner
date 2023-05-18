import React, {useContext, useState} from "react";
import MainPage from "./MainPage";
import SummaryPage from "./SummaryPage";
import ExercisePage from "./ExercisePage";
import RestPage from "./RestPage";
import SupersetCompletePage from "./SupersetCompletePage";
import {ExercisePairType, ExerciseType} from "../types/ExerciseType";
import {SessionType} from "../types/SessionType";
import SessionContext, {SessionContextProvider} from "../context/SessionContext";

const PageController = () => {
    const [sessionData, setSessionData] = useState<SessionType | null>(null);
    const handleExercisePage = (exercise: number) => {
        console.log('Handle exercise page');
    }

    const sessionContext = useContext(SessionContext)

    // if (sessionContext.sessionData && !sessionContext.isRunning) {
    //     return (
    //         <div className={`p-8 flex flex-col gap-8`}>
    //             <SummaryPage/>
    //         </div>
    //     )
    // }
    //
    // if (sessionContext.isRunning) {
    //     return (
    //         <div className={`p-8 flex flex-col gap-8`}>
    //             <ExercisePage/>
    //         </div>
    //     )
    // }

    return (
        <div className={`grid place-content-center`}>
            {!sessionContext.sessionData && <MainPage setSessionData={setSessionData}/>}
            {sessionContext.sessionData && !sessionContext.isRunning && <SummaryPage/>}
            {sessionContext.isRunning && <ExercisePage/>}
            {/*<RestPage length={120}/>*/}
            {/*<SupersetCompletePage superset={1}/>*/}
        </div>
    )
}

export default PageController;