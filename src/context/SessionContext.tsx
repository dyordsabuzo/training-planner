import { createContext, ReactNode, useState } from "react";

const SessionContext = createContext({
  sessionData: null,
  isRunning: false,
  isSessionOn: false,
  setIsSessionOn: (flag: boolean) => {},
  setIsRunning: (flag: boolean) => {},
  initialiseSession: (data: any) => {},
  setSessionData: (data: any) => {},
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

  const initialiseSession = (data: any) => {
    setSessionData(data);
  };

  const wrapSession = () => {
    setSessionData(null);
    setIsRunning(false);
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
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
