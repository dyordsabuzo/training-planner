import React, {useContext} from "react";
import MainPage from "./MainPage";
import SummaryPage from "./SummaryPage";
import ExercisePage from "./ExercisePage";
import SessionContext from "../context/SessionContext";

const PageController = () => {
    const sessionContext = useContext(SessionContext)

    return (
        <div className={`grid place-content-center`}>
            {!sessionContext.sessionData && <MainPage/>}
            {sessionContext.sessionData && !sessionContext.isRunning && <SummaryPage/>}
            {sessionContext.isRunning && <ExercisePage/>}
            {/*<RestPage length={120}/>*/}
            {/*<SupersetCompletePage superset={1}/>*/}
        </div>
    )
}

export default PageController;