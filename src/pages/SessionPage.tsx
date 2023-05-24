import Dropdown from "../components/Dropdown";
import React, {useContext, useState} from "react";
import SessionContext from "../context/SessionContext";
import SummaryPage from "./SummaryPage";
import ExercisePage from "./ExercisePage";

const SessionPage = () => {
    const [week, setWeek] = useState<string>("")
    const [session, setSession] = useState<string>("")
    const sessionContext = useContext(SessionContext)

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        sessionContext.initialiseSession(parseInt(week), parseInt(session))
    }

    if (sessionContext.sessionData && !sessionContext.isRunning) {
        return <SummaryPage/>
    }

    if (sessionContext.isRunning) {
        return <ExercisePage/>
    }

    return (
        <div className={`flex flex-col gap-2 p-8 min-w-[30rem]`}>
            <form onSubmit={handleSubmit} className={`flex flex-col gap-8`}>
                <Dropdown label={"Week"} options={sessionContext.weeks} valueHandler={setWeek}
                          required/>
                <Dropdown label={"Session"} options={sessionContext.sessions} valueHandler={setSession} required/>
                {/*<Button label={"LOAD"} clickHandler={handleClick}/>*/}
                <button type={"submit"}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-6 px-4 rounded">
                    LOAD
                </button>
            </form>
        </div>
    )
}

export default SessionPage