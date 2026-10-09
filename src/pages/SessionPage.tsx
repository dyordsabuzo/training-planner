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
import { resolveSession, sessionOrder } from "./resolveSessionSupersets";
import { OPEN_WEEK, getLastLoggedWeight, getWeightForRule } from "../common/planCycle";
import { completedRuns, CompletedRun } from "../common/sessionStats";
import { SessionStats } from "./others/SessionStats";
import { SessionStatusIcon } from "../components/others/SessionStatusIcon";
import {
  formatSessionDate,
  sortPlansByCreated,
  openPlanDoneSessions,
  sessionDueStatus,
  sortSessionsByDate,
} from "../common/planSessions";

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
  const [viewingRun, setViewingRun] = useState<CompletedRun | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [moodBefore, setMoodBefore] = useState<MoodValue>({});

  useEffect(() => {
    sessionContext.setIsSessionOn(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A session URL only makes sense while its workout is active in memory —
  // e.g. after a hard refresh there's nothing to resume, so bounce back to setup.
  useEffect(() => {
    if (sessionId && !sessionContext.sessionData) {
      navigate("/training-planner/train", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, sessionContext.sessionData]);

  const plans = sourceData?.plans ?? {};
  const planNames = sortPlansByCreated(plans).map(([name]) => name);
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
    if (!selectedPlanData || selectedPlanData.open) {
      return [];
    }
    return sortWeekKeys(Object.keys(selectedPlanData.weeks ?? {})).filter(
      (w) => !completedWeeks.includes(w)
    );
  }, [selectedPlanData, completedWeeks]);

  const isOpenPlan = !!selectedPlanData?.open;
  const sessionOptions: string[] = selectedPlanData
    ? isOpenPlan
      ? sortSessionsByDate(selectedPlanData.sessions ?? [], sourceData?.sessions)
      : [...(selectedPlanData.sessions ?? [])].sort()
    : [];
  const openDone = isOpenPlan
    ? openPlanDoneSessions(Object.values(sourceData?.userdata ?? {})[0], sessionData.plan)
    : [];

  const completedList = sessionData.plan
    ? completedRuns(Object.values(sourceData?.userdata ?? {})[0], sessionData.plan)
    : [];

  // Sets a plan, week and session in one step (used by the up-next card).
  const startSession = (planName: string, week: string, session: string) => {
    const plan: any = plans[planName];
    const weekData: any = plan?.open ? {} : plan?.weeks?.[week] ?? {};
    const userdata: any = Object.values(sourceData?.userdata ?? {})[0];
    const { targetRep, targetSet, targetTime, annotation, weightRule } = weekData;
    const supersets = resolveSession(sourceData, sourceData.sessions[session], {
      targetRep,
      targetSet,
      annotation,
      referenceWeight: (exerciseName: string) =>
        getLastLoggedWeight(userdata, planName, week, exerciseName) ?? undefined,
      ...(weightRule && {
        weightFor: (exerciseName: string, currentWeight: number) =>
          getWeightForRule(
            weightRule,
            getLastLoggedWeight(userdata, planName, week, exerciseName),
            currentWeight
          ),
      }),
    });
    setSessionData({
      plan: planName,
      week,
      session,
      targetRep,
      targetSet,
      targetTime,
      annotation,
      weightRule,
      supersets,
    });
    setPickerOpen(false);
  };

  // The next session to do: the first unfinished one in the selected plan.
  const upNext = (() => {
    const planName = sessionData.plan;
    if (!selectedPlanData || !planName) return null;
    if (isOpenPlan) {
      const session = sessionOptions.find((name) => !openDone.includes(name));
      return session
        ? { plan: planName, week: OPEN_WEEK, session, date: sourceData?.sessions?.[session]?.date }
        : null;
    }
    const currentKey = `Week ${(getCurrentWeekNumber(selectedPlanData) ?? -1) + 1}`;
    const week =
      sessionData.week && weekOptions.includes(sessionData.week)
        ? sessionData.week
        : weekOptions.includes(currentKey)
          ? currentKey
          : weekOptions[0];
    if (!week) return null;
    const userdata: any = Object.values(sourceData?.userdata ?? {})[0];
    const doneInWeek = Object.keys(userdata?.[planName]?.[week] ?? {});
    const session = sessionOptions.find((name) => !doneInWeek.includes(name));
    return session
      ? { plan: planName, week, session, date: sourceData?.sessions?.[session]?.date }
      : null;
  })();

  const showPicker = pickerOpen || (!sessionData.session && !upNext);

  // The completed run for the chosen week and session, if there is one.
  const selectedRun = sessionData.session
    ? completedList.find(
        (run) => run.session === sessionData.session && run.week === sessionData.week
      ) ?? null
    : null;

  // Date and size of a session, shown under its name in the picker.
  const sessionMeta = (session: string) => {
    const config = sourceData?.sessions?.[session];
    const count = (config?.groups?.length ?? 0) + (config?.supersets?.length ?? 0);
    return [
      config?.date ? formatSessionDate(config.date) : null,
      `${count} ${count === 1 ? "group" : "groups"}`,
    ]
      .filter(Boolean)
      .join(" · ");
  };

  const currentWeekIndex = selectedPlanData ? getCurrentWeekNumber(selectedPlanData) : null;

  const selectPlan = (plan: string) => {
    setSessionData({ plan });
    setPickerOpen(false);
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
      weightRule: weekData.weightRule,
    }));
  };

  const selectSession = (session: string) => {
    const { targetRep, targetSet, annotation, weightRule, plan, week } = sessionData;
    const userdata: any = Object.values(sourceData?.userdata ?? {})[0];
    const supersets = resolveSession(sourceData, sourceData.sessions[session], {
      targetRep,
      targetSet,
      annotation,
      // Group % targets are taken from the last weight logged for the exercise.
      referenceWeight: (exerciseName: string) =>
        getLastLoggedWeight(userdata, plan, week, exerciseName) ?? undefined,
      // Only cycle-driven weeks carry a weightRule; others keep stored weights.
      ...(weightRule && {
        weightFor: (exerciseName: string, currentWeight: number) =>
          getWeightForRule(
            weightRule,
            getLastLoggedWeight(userdata, plan, week, exerciseName),
            currentWeight
          ),
      }),
    });

    setSessionData((prev: any) => ({ ...prev, session, supersets }));
    setPickerOpen(false);
  };

  // Open plans have no weeks, so every run is logged under the OPEN_WEEK key.
  useEffect(() => {
    if (isOpenPlan && sessionData.week !== OPEN_WEEK) {
      setSessionData((prev: any) => ({ ...prev, week: OPEN_WEEK }));
    }
  }, [isOpenPlan, sessionData.week]);

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
    // Open plans always show their list, so the single session is still visible.
    if (!isOpenPlan && sessionData.week && !sessionData.session && sessionOptions.length === 1) {
      selectSession(sessionOptions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData.week, sessionOptions.join(","), sessionData.session, isOpenPlan]);

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
    <WrapperPage className="max-w-[32rem] sm:max-w-xl lg:max-w-4xl">
      <div className="flex flex-col gap-6 pt-4 sm:pt-8">
        <div>
          <h1 className="flex items-start gap-3 text-xl sm:text-2xl font-bold text-text-light dark:text-text-dark">
            <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-800/40 text-primary dark:text-primary-300">
              <FontAwesomeIcon icon={faDumbbell} />
            </span>
            Start a workout
          </h1>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
            {upNext && !showPicker && !sessionData.session
              ? "Ready when you are."
              : "Pick a plan, week, and session to begin."}
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            label="View history"
            decoration="cancel"
            className="text-xs"
            onClick={() => navigate("/training-planner/history")}
          />
        </div>

        {!showPicker && sessionData.session && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary-200 dark:border-primary-700 bg-white dark:bg-surface-dark p-4">
            <div className="flex min-w-0 flex-col">
              <span className="text-lg font-bold break-words">{sessionData.session}</span>
              <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                {[sessionData.plan, sessionData.week !== OPEN_WEEK ? sessionData.week : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            <Button label="Change" decoration="cancel" className="text-xs shrink-0" onClick={() => setPickerOpen(true)} />
          </div>
        )}

        {!showPicker && !sessionData.session && upNext && (
          <div className="flex flex-col gap-4 rounded-xl bg-primary-50 dark:bg-primary-800/30 p-5">
            <span className={stepLabelClassName}>Up next</span>
            <div className="flex flex-col gap-1">
              <span className="text-xl font-bold line-clamp-2 break-words" title={upNext.session}>
                {upNext.session}
              </span>
              <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
                {[
                  upNext.plan,
                  upNext.week !== OPEN_WEEK ? upNext.week : null,
                  upNext.date ? formatSessionDate(upNext.date) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            <Button
              label="Continue"
              className="min-h-11 py-3 text-base"
              onClick={() => startSession(upNext.plan, upNext.week, upNext.session)}
            />
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="self-center min-h-11 text-sm underline text-text-muted-light dark:text-text-muted-dark"
            >
              Choose a different session
            </button>
          </div>
        )}

        {showPicker && (
          <>
        {sessionData.plan && pickerOpen && (
          <Button
            label="Back"
            decoration="cancel"
            className="text-xs self-start"
            onClick={() => setPickerOpen(false)}
          />
        )}

        <div className="flex flex-col gap-2">
          <span className={stepLabelClassName}>Plan</span>
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

        {sessionData.plan && !isOpenPlan && (
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
            {sessionOptions.length === 0 ? (
              <div className="flex flex-col items-start gap-2">
                <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
                  This plan has no sessions yet.
                </span>
                <Button
                  label="Add sessions to this plan"
                  decoration="cancel"
                  className="text-xs"
                  onClick={() => navigate("/training-planner/manage/plans")}
                />
              </div>
            ) : !isOpenPlan && sessionOptions.length === 1 ? (
              <span className="text-base font-semibold text-text-light dark:text-text-dark">
                {sessionOptions[0]}
              </span>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {sessionOptions.map((session) => (
                  <button
                    key={session}
                    type="button"
                    onClick={() => selectSession(session)}
                    className={`flex items-center gap-3 w-full min-h-11 text-left rounded-lg border p-3 transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      sessionData.session === session
                        ? "border-primary bg-primary-50 dark:bg-primary-800/30"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark"
                    }`}
                  >
                    <div className="flex min-w-0 grow flex-col">
                      <span className="font-semibold line-clamp-2 break-words" title={session}>
                        {session}
                      </span>
                      <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                        {sessionMeta(session)}
                      </span>
                    </div>
                    {isOpenPlan && (
                      <SessionStatusIcon
                        date={sourceData?.sessions?.[session]?.date}
                        done={openDone.includes(session)}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

          </>
        )}

        {sessionData.session && (
          <MoodCheckIn
            title="How do you feel before starting? (optional)"
            value={moodBefore}
            onChange={setMoodBefore}
          />
        )}

        {sessionData.session && (
        <div className="sticky bottom-0 -mx-2 px-2 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 dark:bg-surface-dark/95 backdrop-blur">
        {selectedRun ? (
          <div className="flex gap-2">
            <Button
              type="button"
              className="min-h-11 py-3 text-base grow-[3]"
              label="View results"
              onClick={() => setViewingRun(selectedRun)}
            />
            <Button
              type="button"
              className="min-h-11 py-3 text-base grow"
              label="Run again"
              decoration="cancel"
              onClick={() =>
                sessionContext.initialiseSession({ ...sessionData, moodBefore })
              }
            />
          </div>
        ) : (
          <Button
            type="button"
            className="min-h-11 py-3 text-base"
            label="Start session"
            disabled={!sessionData.session}
            onClick={() =>
              sessionContext.initialiseSession({ ...sessionData, moodBefore })
            }
          />
        )}
        </div>
        )}
      </div>
      {viewingRun && (
        <SessionStats
          title={viewingRun.session}
          planName={sessionData.plan}
          week={viewingRun.week}
          session={viewingRun.session}
          logged={viewingRun.logged}
          order={sessionOrder(sourceData?.sessions?.[viewingRun.session], sourceData)}
          userdata={Object.values(sourceData?.userdata ?? {})[0]}
          onClose={() => setViewingRun(null)}
        />
      )}
    </WrapperPage>
  );
};

export default SessionPage;
