import React, { useMemo, useState } from "react";
import { useParams } from "react-router";
import { getDoc } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import SessionContext from "../context/SessionContext";
import { getDocumentReference } from "../common/firebase";
import { SourceDbReferences } from "../common/utils";
import { ExercisePage } from "./train/ExercisePage";
import { SummaryPage } from "./SummaryPage";
import { Loading } from "./helpers/Loading";
import { EmptyState } from "../management/EmptyState";
import WrapperPage from "./WrapperPage";

const HOME_PATH = "/";

// Public, unauthenticated equivalent of SimulateSessionPage: fetches a single
// session doc directly (bypassing SourceDataContext, whose queries are all
// gated on a signed-in user) and reads the pre-resolved `sharedSnapshot`
// SessionForm generates when a session is marked shareable — never queries
// the supersets/exercises collections, since anonymous visitors have no
// access to them.
const SharedSessionPage = () => {
  const { sessionId } = useParams();
  const [isRunning, setIsRunning] = useState(false);

  const { data: session, isLoading } = useQuery({
    queryKey: ["sharedSession", sessionId],
    queryFn: async () => {
      const snapshot = await getDoc(
        getDocumentReference(SourceDbReferences.SESSIONS, sessionId as string)
      );
      return snapshot.exists() ? snapshot.data() : null;
    },
    enabled: !!sessionId,
  });

  const isShareable = !!session?.isShareable && !!session?.sharedSnapshot;

  const sharedSessionData: any = useMemo(
    () =>
      isShareable
        ? {
            session: session.name,
            annotation: "Shared workout — nothing is saved",
            supersets: session.sharedSnapshot,
          }
        : null,
    [isShareable, session]
  );

  const sharedSessionContext = useMemo(
    () => ({
      sessionData: sharedSessionData,
      isRunning,
      isSessionOn: false,
      exitPath: HOME_PATH,
      useSessionUrl: false,
      setIsSessionOn: () => {},
      setIsRunning,
      initialiseSession: () => setIsRunning(false),
      setSessionData: () => {},
      updateUserData: async () => {},
      wrapSession: () => setIsRunning(false),
    }),
    [sharedSessionData, isRunning]
  );

  if (isLoading) {
    return <Loading />;
  }

  if (!isShareable) {
    return (
      <WrapperPage>
        <EmptyState message="This shared link isn't available." />
      </WrapperPage>
    );
  }

  return (
    <SessionContext.Provider value={sharedSessionContext}>
      {isRunning ? <ExercisePage /> : <SummaryPage />}
    </SessionContext.Provider>
  );
};

export default SharedSessionPage;
