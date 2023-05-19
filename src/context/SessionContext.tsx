import {createContext, ReactNode, useEffect, useState} from "react";
import useGoogleSheets from "use-google-sheets";
import {Sheet} from "use-google-sheets/dist/types";

const SessionContext = createContext({
    sessionData: null,
    isRunning: false,
    weeks: [],
    sessions: [],
    setIsRunning: (flag: boolean) => {
    },
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
    const {data, loading, error} = useGoogleSheets({
        apiKey: process.env.REACT_APP_GOOGLE_API_KEY!,
        sheetId: process.env.REACT_APP_GOOGLE_SHEETS_ID!,
    });

    const initialiseSession = (week: number, session: number) => {
        const filteredData = data[0].data.filter((d: any) => d.Week === week.toString() && d.Session === session.toString())
        console.log(filteredData, week, session)

        let exerciseCombinations: any[] = []
        let index = 0
        for (let i = 0, x = filteredData.length; i < x; i++) {
            if (i % 2 === 0) {
                if (i > 0) {
                    index = index + 1
                }
                exerciseCombinations[index] = []
            }
            exerciseCombinations[index].push({
                "exercise": (filteredData[i] as any)["Exercise Number"],
                "name": (filteredData[i] as any)["Exercise"],
                "targetWeight": 0,
                "targetRep": 8,
            })
        }
        setSessionData({week, session, exerciseCombinations: exerciseCombinations })
    }


    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error!</div>;
    }

    // if (data) {
    // //     const result = data[0].data.filter(d => (d as any).Date === "")
    // //     setSourceData(data[0].data)
    // //     const weeks = [...new Set(data[0].data.map((d: any) => d.Week))]
    //     console.log(data[0].data)
    // }

    return (
        <SessionContext.Provider
            value={{
                sessionData,
                isRunning,
                // @ts-ignore
                weeks: [...new Set(data[0].data.map((d: any) => d.Week))],
                // weeks: ["1", "2", "3"],
                // @ts-ignore
                sessions: [...new Set(data[0].data.map((d: any) => d.Session))],
                // sessions: ["1", "2", "3"],
                setIsRunning,
                initialiseSession
            }}>
            {children}
        </SessionContext.Provider>
    )
}