import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDumbbell } from "@fortawesome/free-solid-svg-icons";
import SessionContext from "../context/SessionContext";
import { SummaryPage } from "./SummaryPage";
import { ExercisePage } from "./train/ExercisePage";
import SourceDataContext from "../context/SourceDataContext";
import WrapperPage from "./WrapperPage";

import { Loading } from "./helpers/Loading";
import { EmptyState } from "../management/EmptyState";
import { getCurrentWeekNumber } from "../common/planWeek";
import { Button } from "@dyordsabuzo/ui-components";
import { MoodCheckIn, MoodValue } from "../components/others/MoodCheckIn";

const sortWeekKeys = (keys: string[]) =>
  [...keys].sort((a, b) => {
    const [textA, numA] = a.split(" ");
    const [textB, numB] = b.split(" ");

    if (textA !== textB) {
      return textA.localeCompare(textB);
    }
    return Number(numA) - Number(numB);
  });

const stepLabelClassName =
  "text-xs font-medium uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark";

const chipClassName = (isSelected: boolean, isCurrent = false) =>
  `relative min-h-11 px-3 rounded-lg text-sm font-medium border transition-colors
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
   ${
     isSelected
       ? "border-primary bg-primary text-white"
       : isCurrent
         ? "border-primary text-primary dark:text-primary-200"
         : "border-gray-300 dark:border-gray-600 text-text-light dark:text-text-dark hover:border-primary hover:bg-primary-50 dark:hover:bg-primary-800/20"
   }`;

const SessionPage = () => {
  const sessionContext = useContext(SessionContext);
  const sourceDataContext = useContext(SourceDataContext);
  const { sourceData } = sourceDataContext as any;
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const [sessionData, setSessionData] = useState<any>({});
  const [isContextInitialised, setIsContextInitialised] = useState(false);
  const [moodBefore, setMoodBefore] = useState<MoodValue>({});

  useEffect(() => {
    if (!isContextInitialised) {
      sessionContext.setIsSessionOn(true);
      sourceDataContext.initialise();
      setIsContextInitialised(true);
    }
    return () => {};
  }, [isContextInitialised, sessionContext, sourceDataContext]);

  // A session URL only makes sense while its workout is active in memory —
  // e.g. after a hard refresh there's nothing to resume, so bounce back to setup.
  useEffect(() => {
    if (sessionId && !sessionContext.sessionData) {
      navigate("/training-planner/train", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, sessionContext.sessionData]);

  const plans = sourceData?.plans ?? {};
  const planNames = Object.keys(plans);
  const selectedPlanData: any = sessionData.plan ? plans[sessionData.plan] : null;

  const completedWeeks: string[] = useMemo(() => {
    if (!sessionData.plan) {
      return [];
    }
    const userdata: any = Object.values(sourceData?.userdata ?? {})[0];
    if (userdata && sessionData.plan in userdata) {
      return Object.keys(userdata[sessionData.plan]);
    }
    return [];
  }, [sessionData.plan, sourceData?.userdata]);

  const weekOptions = useMemo(() => {
    if (!selectedPlanData) {
      return [];
    }
    return sortWeekKeys(Object.keys(selectedPlanData.weeks ?? {})).filter(
      (w) => !completedWeeks.includes(w)
    );
  }, [selectedPlanData, completedWeeks]);

  const sessionOptions: string[] = selectedPlanData
    ? [...(selectedPlanData.sessions ?? [])].sort()
    : [];

  const currentWeekIndex = selectedPlanData ? getCurrentWeekNumber(selectedPlanData) : null;

  const selectPlan = (plan: string) => {
    setSessionData({ plan });
  };

  const selectWeek = (week: string) => {
    const weekData: any = selectedPlanData.weeks[week];
    setSessionData((prev: any) => ({
      ...prev,
      week,
      annotation: weekData.annotation,
      targetRep: weekData.targetRep,
      targetSet: weekData.targetSet,
      targetTime: weekData.targetTime,
    }));
  };

  const selectSession = (session: string) => {
    let supersets = {};
    const sessionSupersets = sourceData.sessions[session].supersets;

    sessionSupersets.forEach((s: string) => {
      let { targetRep, targetSet, annotation } = sessionData;
      let { sessions, rest, tags, ...superset } = sourceData.supersets[s];
      let exercises = superset.exercises.map((e: string) => {
        const exercise = sourceData.exercises[e];
        return {
          exercise,
          targetWeight: exercise.targetWeight || 0,
        };
      });

      if (exercises.length < 2) {
        exercises.push({});
      }

      if (superset.targetRep) {
        targetRep = superset.targetRep;
      }
      if (superset.targetSet) {
        targetSet = superset.targetSet;
      }

      supersets = {
        ...supersets,
        [superset.name]: {
          ...superset,
          exercises,
          targetRep,
          targetSet,
          annotation,
          rest,
        },
      };
    });

    setSessionData((prev: any) => ({ ...prev, session, supersets }));
  };

  // Skip trivial choices: auto-select the plan/session when there's only one option.
  useEffect(() => {
    if (!sessionData.plan && planNames.length === 1) {
      selectPlan(planNames[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planNames.join(","), sessionData.plan]);

  useEffect(() => {
    if (selectedPlanData && !sessionData.week && weekOptions.length > 0) {
      const currentWeekKey = `Week ${(currentWeekIndex ?? -1) + 1}`;
      selectWeek(weekOptions.includes(currentWeekKey) ? currentWeekKey : weekOptions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlanData, weekOptions.join(","), sessionData.week]);

  useEffect(() => {
    if (sessionData.week && !sessionData.session && sessionOptions.length === 1) {
      selectSession(sessionOptions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData.week, sessionOptions.join(","), sessionData.session]);

  if (sessionContext.sessionData && !sessionContext.isRunning) {
    return <SummaryPage />;
  }

  if (sessionContext.isRunning) {
    return <ExercisePage />;
  }

  if (!sourceData.plans) {
    return <Loading />;
  }

  if (planNames.length === 0) {
    return (
      <WrapperPage>
        <EmptyState message="No training plans assigned yet. Contact your administrator to get access." />
      </WrapperPage>
    );
  }

  return (
    <WrapperPage className="max-w-[25rem] sm:max-w-xl">
      <div className="flex flex-col gap-6 pt-8">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-text-light dark:text-text-dark">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-800/40 text-primary dark:text-primary-300">
              <FontAwesomeIcon icon={faDumbbell} />
            </span>
            Start a workout
          </h1>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
            Pick a plan, week, and session to begin.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className={stepLabelClassName}>Training program</span>
          {planNames.length === 1 ? (
            <span className="text-base font-semibold text-text-light dark:text-text-dark">
              {planNames[0]}
            </span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {planNames.map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => selectPlan(plan)}
                  className={chipClassName(sessionData.plan === plan)}
                >
                  {plan}
                </button>
              ))}
            </div>
          )}
        </div>

        {sessionData.plan && (
          <div className="flex flex-col gap-2">
            <span className={stepLabelClassName}>Week</span>
            {weekOptions.length === 0 ? (
              <EmptyState message="All weeks in this plan are already completed." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {weekOptions.map((week) => {
                  const weekData: any = selectedPlanData.weeks[week];
                  return (
                    <button
                      key={week}
                      type="button"
                      title={weekData.annotation || undefined}
                      onClick={() => selectWeek(week)}
                      className={chipClassName(
                        sessionData.week === week,
                        currentWeekIndex === weekData.weekNumber
                      )}
                    >
                      {week}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {sessionData.week && (
          <div className="flex flex-col gap-2">
            <span className={stepLabelClassName}>Session</span>
            {sessionOptions.length === 1 ? (
              <span className="text-base font-semibold text-text-light dark:text-text-dark">
                {sessionOptions[0]}
              </span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sessionOptions.map((session) => (
                  <button
                    key={session}
                    type="button"
                    onClick={() => selectSession(session)}
                    className={chipClassName(sessionData.session === session)}
                  >
                    {session}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {sessionData.session && (
          <MoodCheckIn
            title="How are you feeling before this session?"
            value={moodBefore}
            onChange={setMoodBefore}
          />
        )}

        <Button
          type="button"
          className="min-h-11 py-3 text-base"
          label="Start session"
          disabled={!sessionData.session}
          onClick={() =>
            sessionContext.initialiseSession({ ...sessionData, moodBefore })
          }
        />
      </div>
    </WrapperPage>
  );
};

export default SessionPage;
