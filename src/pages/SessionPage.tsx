import { Dropdown } from "../components/form/Dropdown";
import React, { useContext, useEffect, useState } from "react";
import SessionContext from "../context/SessionContext";
import { SummaryPage } from "./SummaryPage";
import { ExercisePage } from "./train/ExercisePage";
import SourceDataContext from "../context/SourceDataContext";
import WrapperPage from "./WrapperPage";
import { Button } from "../components/form/Button";

const SessionPage = () => {
  const sessionContext = useContext(SessionContext);
  const sourceDataContext = useContext(SourceDataContext);
  const { sourceData } = sourceDataContext as any;

  const [sessionData, setSessionData] = useState<any>({});
  const [weekOptions, setWeekOptions] = useState<string[]>([]);
  const [sessionOptions, setSessionOptions] = useState<string[]>([]);
  const [isContextInitialised, setIsContextInitialised] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sessionContext.initialiseSession(sessionData);
  };

  useEffect(() => {
    if (!isContextInitialised) {
      sessionContext.setIsSessionOn(true);
      sourceDataContext.initialise();
      setIsContextInitialised(true);
    }
    return () => {};
  }, [isContextInitialised, sessionContext, sourceDataContext]);

  if (sessionContext.sessionData && !sessionContext.isRunning) {
    return <SummaryPage />;
  }

  if (sessionContext.isRunning) {
    return <ExercisePage />;
  }

  return (
    <WrapperPage>
      <form onSubmit={handleSubmit} className={`flex flex-col gap-8 pt-12`}>
        <Dropdown
          label={"Training program"}
          options={Object.keys(sourceData.plans ?? {})}
          required
          valueHandler={(plan) => {
            let planData: any = Object.values(sourceData.plans).find(
              (value: any) => value.name === plan
            );

            // let completedWeeks = Object.values(sourceData.userdata[plan]);
            let userdata: any = Object.values(sourceData.userdata)[0];

            let completedWeeks: string[] = [];
            if (userdata && plan in userdata) {
              completedWeeks = Object.keys(userdata[plan]);
            }

            setWeekOptions(
              Object.keys(planData.weeks)
                .filter((e) => !completedWeeks.includes(e))
                .sort((a, b) => {
                  const [textA, numA] = a.split(" ");
                  const [textB, numB] = b.split(" ");

                  // Compare the text part first (alphabetical order)
                  if (textA !== textB) {
                    return textA.localeCompare(textB);
                  }

                  // Compare the numeric part (numerical order)
                  return Number(numA) - Number(numB);
                })
            );
            setSessionOptions(planData.sessions.sort());

            setSessionData({
              ...sessionData,
              plan,
            });
          }}
        />

        <Dropdown
          label={"Week"}
          options={weekOptions}
          required
          valueHandler={(week: string) => {
            let weekData: any = sourceData.plans[sessionData.plan].weeks[week];

            setSessionData({
              ...sessionData,
              week,
              annotation: weekData.annotation,
              targetRep: weekData.targetRep,
              targetSet: weekData.targetSet,
              targetTime: weekData.targetTime,
              overrides: weekData.overrides || {},
            });
            // setWeek(week)
          }}
        />

        <Dropdown
          label={"Session"}
          options={sessionOptions}
          required
          valueHandler={(session: string) => {
            let supersets = {};
            let sessionSupersets = sourceData.sessions[session].supersets;

            sessionSupersets.forEach((s: string) => {
              let {
                targetRep,
                targetSet,
                annotation,
                overrides: sessionOverrides,
              } = sessionData;
              let { sessions, rest, tags, ...superset } =
                sourceData.supersets[s];
              let exercises = superset.exercises.map((e: string) => {
                let exercise = sourceData.exercises[e];
                return {
                  exercise,
                  // targetRep: exercise.targetRep || targetRep,
                  // targetSet: exercise.targetSet || targetSet,
                  // rest: exercise.rest || rest,
                  targetWeight: exercise.targetWeight || 0,
                };
              });

              if (exercises.length < 2) {
                exercises.push({});
              }

              // // override if there is only 1 exercise
              // if (exercises.length === 1) {
              //   const exerciseRep = parseInt(exercises[0].targetRep);
              //   const exerciseSet = parseInt(exercises[0].targetSet);
              //   const exerciseRest = parseInt(exercises[0].rest);
              //   targetRep = exerciseRep || targetRep;
              //   targetSet = exerciseSet || targetSet;
              //   rest = exerciseRest || rest;
              // }

              // Does superset have overrides?
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

            setSessionData({
              ...sessionData,
              session,
              supersets,
            });
          }}
        />

        <Button type="submit" className="py-6 px-4" label="LOAD" />
      </form>
    </WrapperPage>
  );
};

export default SessionPage;
