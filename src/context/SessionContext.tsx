import { createContext, ReactNode, useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { saveToDB, SourceDbReferences } from "../common/utils";
import AuthContext from "./AuthContext";

const SessionContext = createContext({
  sessionData: null,
  isRunning: false,
  isSessionOn: false,
  exitPath: "/training-planner/train",
  useSessionUrl: true,
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
  const queryClient = useQueryClient();

  const saveSessionUserData = async (
    data: any,
    sessionInfo: { plan: string; week: string; session: string }
  ) => {
    const { plan, week, session } = sessionInfo;

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
      await saveToDB(SourceDbReferences.USERDATA, userData);
      // SourceDataContext caches userdata separately (used by SessionPage's
      // completedWeeks) — invalidate it so a just-finished/logged workout is
      // reflected immediately instead of waiting for a full page reload.
      queryClient.invalidateQueries({
        queryKey: ["sourceData", SourceDbReferences.USERDATA, user.uid],
      });
    }
  };

  const initialiseSession = (data: any) => {
    setSessionData(data);

    // Persist the pre-session mood check-in (if provided) right away, using
    // the freshly-passed session info — sessionData state isn't updated yet
    // at this point in the render cycle.
    if (data?.moodBefore) {
      saveSessionUserData({ mood: { before: data.moodBefore } }, data);
    }
  };

  const wrapSession = () => {
    setSessionData(null);
    setIsRunning(false);
  };

  const updateUserData = async (data: any) => {
    await saveSessionUserData(data, sessionData);
  };

  return (
    <SessionContext.Provider
      value={{
        sessionData,
        isRunning,
        isSessionOn,
        exitPath: "/training-planner/train",
        useSessionUrl: true,
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
