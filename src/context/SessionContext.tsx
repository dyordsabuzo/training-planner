import { createContext, ReactNode, useContext, useState } from "react";
import { saveToDB, SourceDbReferences } from "../common/utils";
import AuthContext from "./AuthContext";

const SessionContext = createContext({
  sessionData: null,
  isRunning: false,
  isSessionOn: false,
  setIsSessionOn: (flag: boolean) => {},
  setIsRunning: (flag: boolean) => {},
  initialiseSession: (data: any) => {},
  setSessionData: (data: any) => {},
  updateUserData: (data: any) => {},
  wrapSession: () => {},
});

export default SessionContext;

type _Props = {
  children: ReactNode;
};

export const SessionContextProvider: React.FC<_Props> = ({ children }) => {
  const [sessionData, setSessionData] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSessionOn, setIsSessionOn] = useState(false);

  const authContext = useContext(AuthContext);
  const { user } = authContext;

  const initialiseSession = (data: any) => {
    setSessionData(data);
  };

  const wrapSession = () => {
    setSessionData(null);
    setIsRunning(false);
  };

  const updateUserData = async (data: any) => {
    const { plan, session, week } = sessionData;

    console.log(data);

    if (user) {
      const userData = {
        id: user.uid,
        [plan]: {
          [week]: {
            [session]: {
              ...data,
            },
          },
        },
      };
      console.log(userData);
      await saveToDB(SourceDbReferences.USERDATA, userData);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        sessionData,
        isRunning,
        isSessionOn,
        setIsSessionOn,
        setIsRunning,
        initialiseSession,
        setSessionData,
        wrapSession,
        updateUserData,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
