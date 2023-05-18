import {createContext, ReactNode, useState} from "react";
import {SessionType} from "../types/SessionType";
import {ExerciseType} from "../types/ExerciseType";
import ExercisePage from "../pages/ExercisePage";

const SessionContext = createContext({
    sessionData: null,
    isRunning: false,
    setIsRunning: (flag: boolean) => {},
    initialiseSession: (week: number, session: number) => {
    },
})

export default SessionContext

type _Props = {
    children: ReactNode
}

export const SessionContextProvider: React.FC<_Props> = ({children}) => {
    const [sessionData, setSessionData] = useState<any>(null)
    const [isRunning, setIsRunning] = useState(false)

    const initialiseSession = (week: number, session: number) => {
        setSessionData({
            week, session, exerciseCombinations: [
                [
                    {
                        "exercise": 1,
                        "name": "Exercise 1",
                        "targetWeight": 0,
                        "targetRep": 8,
                    },
                    {
                        "exercise": 2,
                        "name": "Exercise 2",
                        "targetWeight": 0,
                        "targetRep": 8,
                    },
                ],
                [
                    {
                        "exercise": 3,
                        "name": "Exercise 3",
                        "targetWeight": 0,
                        "targetRep": 8,
                    },
                    {
                        "exercise": 4,
                        "name": "Exercise 4",
                        "targetWeight": 0,
                        "targetRep": 8,
                    },
                ],
                [
                    {
                        "exercise": 5,
                        "name": "Exercise 5",
                        "targetWeight": 0,
                        "targetRep": 8,
                    },
                    {
                        "exercise": 6,
                        "name": "Exercise 6",
                        "targetWeight": 0,
                        "targetRep": 8,
                    },
                ],
            ]
        })
    }

    return (
        <SessionContext.Provider
            value={{
                sessionData,
                isRunning,
                setIsRunning,
                initialiseSession,
            }}>
            {children}
        </SessionContext.Provider>
    )
}