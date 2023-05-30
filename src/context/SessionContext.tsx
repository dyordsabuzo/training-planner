import {createContext, ReactNode, useState} from "react";
// import useGoogleSheets from "use-google-sheets";
// import SourceDataContext from "./SourceDataContext";

const SessionContext = createContext({
    sessionData: null,
    isRunning: false,
    isSessionOn: false,
    setIsSessionOn: (flag: boolean) => {
    },
    setIsRunning: (flag: boolean) => {
    },
    initialiseSession: (data: any) => {
    },
})

export default SessionContext

type _Props = {
    children: ReactNode
}

export const SessionContextProvider: React.FC<_Props> = ({children}) => {
    const [sessionData, setSessionData] = useState<any>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [isSessionOn, setIsSessionOn] = useState(false)
    // const {data, loading, error} = useGoogleSheets({
    //     apiKey: process.env.REACT_APP_GOOGLE_API_KEY!,
    //     sheetId: process.env.REACT_APP_GOOGLE_SHEETS_ID!,
    // });

    const initialiseSession = (data: any) => {
        console.log(data)
        setSessionData(data)
    }


    // if (loading) {
    //     return <div>Loading...</div>;
    // }
    //
    // if (error) {
    //     return <div>Error!</div>;
    // }

    return (
        <SessionContext.Provider
            value={{
                sessionData,
                isRunning,
                isSessionOn,
                setIsSessionOn,
                setIsRunning,
                initialiseSession
            }}>
            {children}
        </SessionContext.Provider>
    )
}