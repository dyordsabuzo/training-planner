import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import SessionContext from "../context/SessionContext";
import SourceDataContext from "../context/SourceDataContext";
import { ExercisePage } from "./train/ExercisePage";
import { SummaryPage } from "./SummaryPage";
import { Loading } from "./helpers/Loading";
import { EmptyState } from "../management/EmptyState";
import WrapperPage from "./WrapperPage";
import { resolveSessionSupersets } from "./resolveSessionSupersets";

const MANAGE_SESSIONS_PATH = "/training-planner/manage/sessions";

// Runs the real ExercisePage/SummaryPage UI (rest timers, set logging,
// superset progression) for a single Manage session, but scoped to its own
// throwaway SessionContext value so nothing is persisted to Firestore and
// the app-wide "session in progress" state is left untouched.
const SimulateSessionPage = () => {
  const { sessionName } = useParams();
  const navigate = useNavigate();
  const sourceDataContext = useContext(SourceDataContext);
  const { sourceData } = sourceDataContext as any;

  const [simSessionData, setSimSessionData] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const sessionExists = !sessionName || Boolean(sourceData?.sessions?.[sessionName]);

  useEffect(() => {
    if (sourceData?.sessions && sessionName && sourceData.sessions[sessionName] && !simSessionData) {
      const supersets = resolveSessionSupersets(sourceData, sessionName, {
        targetSet: 3,
      });
      setSimSessionData({
        session: sessionName,
        annotation: "Simulation — nothing is saved",
        supersets,
      });
    }
  }, [sourceData, sessionName, simSessionData]);

  const exitSimulation = () => {
    setSimSessionData(null);
    navigate(MANAGE_SESSIONS_PATH);
  };

  const simulatedSessionContext = useMemo(
    () => ({
      sessionData: simSessionData,
      isRunning,
      isSessionOn: false,
      exitPath: MANAGE_SESSIONS_PATH,
      useSessionUrl: false,
      setIsSessionOn: () => {},
      setIsRunning,
      initialiseSession: exitSimulation,
      setSessionData: setSimSessionData,
      updateUserData: async () => {},
      // Cancel/finish handlers in ExercisePage/SummaryPage already navigate
      // to exitPath right after calling wrapSession, so this only needs to
      // clear local state — navigating here too would double-push history.
      wrapSession: () => setSimSessionData(null),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [simSessionData, isRunning]
  );

  if (!sourceData?.sessions) {
    return <Loading />;
  }

  if (!sessionExists) {
    return (
      <WrapperPage>
        <EmptyState message="This session no longer exists." />
      </WrapperPage>
    );
  }

  if (!simSessionData) {
    return <Loading />;
  }

  return (
    <SessionContext.Provider value={simulatedSessionContext}>
      {isRunning ? <ExercisePage /> : <SummaryPage />}
    </SessionContext.Provider>
  );
};

export default SimulateSessionPage;
