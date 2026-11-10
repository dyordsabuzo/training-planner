import { useContext, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router";
import { getDoc } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faDumbbell } from "@fortawesome/free-solid-svg-icons";
import SessionContext from "../context/SessionContext";
import SourceDataContext from "../context/SourceDataContext";
import { publicPlanRef } from "../common/publicPlansDb";
import { publicPlanSchema, publicSessionData, PublicSession } from "../common/publicPlans";
import { sortWeekKeys } from "../common/planSessions";
import { ExercisePage } from "./train/ExercisePage";
import { SummaryPage } from "./SummaryPage";
import { Loading } from "./helpers/Loading";
import { AgendaRow, SectionLabel } from "./others/AgendaRow";
import { chipClassName } from "./others/HeroTile";
import { EmptyState } from "../management/EmptyState";
import WrapperPage from "./WrapperPage";

// Public, no sign-in needed. Reads only the plan's public copy (publicPlans.ts)
// and runs it on the normal workout screens with `limitedRun` on.
const PublicPlanPage = () => {
  const { orgId, token } = useParams();
  const { pathname } = useLocation();
  const sourceDataContext = useContext(SourceDataContext);
  const [selected, setSelected] = useState<PublicSession | null>(null);
  const [chosenWeek, setChosenWeek] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const { data: plan, isLoading } = useQuery({
    queryKey: ["publicPlan", orgId, token],
    queryFn: async () => {
      const snapshot = await getDoc(publicPlanRef(orgId as string, token as string));
      const parsed = publicPlanSchema.safeParse(snapshot.data());
      return parsed.success ? parsed.data : null;
    },
    enabled: !!orgId && !!token,
    // Not kept between visits, so a revoked link stops working right away.
    gcTime: 0,
    // Phones refocus constantly; a republish mustn't restart a workout in progress.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const weeks = sortWeekKeys(Object.keys(plan?.weeks ?? {}));
  const week = plan?.open ? undefined : chosenWeek ?? weeks[0];
  // A publicly shared session (or one-session plan) has no list to choose from.
  const onlySession = plan?.open && plan.sessions.length === 1 ? plan.sessions[0] : null;
  const session = selected ?? onlySession;

  const sessionData: any = useMemo(
    () => (plan && session ? publicSessionData(plan, session, week) : null),
    [plan, session, week]
  );

  const leave = () => {
    setSelected(null);
    setIsRunning(false);
  };

  const context: any = {
    sessionData,
    isRunning,
    isSessionOn: false,
    exitPath: pathname,
    useSessionUrl: false,
    showBackButton: !onlySession,
    limitedRun: true,
    setIsSessionOn: () => {},
    setIsRunning,
    initialiseSession: leave,
    setSessionData: () => {},
    updateUserData: async () => {},
    saveProgress: async () => {},
    saveRun: async () => {},
    deleteRuns: async () => {},
    skipSession: async () => {},
    completeSession: async () => {},
    wrapSession: leave,
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!plan) {
    return (
      <WrapperPage>
        <EmptyState message="This public plan isn't available." />
      </WrapperPage>
    );
  }

  if (sessionData) {
    return (
      <SessionContext.Provider value={context}>
        {/* The exercise screen finds alternatives here; visitors have no library. */}
        <SourceDataContext.Provider
          value={{
            ...sourceDataContext,
            sourceData: { ...sourceDataContext.sourceData, exercises: plan.alternatives },
          }}
        >
          {isRunning ? <ExercisePage /> : <SummaryPage />}
        </SourceDataContext.Provider>
      </SessionContext.Provider>
    );
  }

  return (
    <WrapperPage className="max-w-[32rem] sm:max-w-xl" outerClassName="pb-8 px-2">
      <div className="flex flex-col gap-4 pt-8 text-text-light dark:text-text-dark">
        <div>
          <h1 className="text-2xl font-bold pr-24 lg:pr-0">{plan.name}</h1>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
            Public plan. No account needed, and nothing is saved.
          </p>
        </div>

        {weeks.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionLabel>Week</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {weeks.map((name) => (
                <button key={name} type="button" onClick={() => setChosenWeek(name)} className={chipClassName(week === name)}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <SectionLabel>Sessions</SectionLabel>
          {plan.sessions.map((item) => (
            <AgendaRow
              key={item.name}
              icon={faDumbbell}
              tone="primary"
              title={item.name}
              subtitle={`${item.units.length} ${item.units.length === 1 ? "block" : "blocks"}`}
              onClick={() => setSelected(item)}
              trailing={
                <FontAwesomeIcon icon={faChevronRight} className="text-xs text-text-muted-light dark:text-text-muted-dark" />
              }
            />
          ))}
        </div>
      </div>
    </WrapperPage>
  );
};

export default PublicPlanPage;
