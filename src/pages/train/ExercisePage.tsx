import { Input } from "../../components/form/Input";
import { Button } from "../../components/form/Button";
import React, { useContext, useEffect, useReducer, useState } from "react";
import SessionContext from "../../context/SessionContext";
import { RestTimer } from "../timer/RestTimer";
import { WorkTimer } from "../timer/WorkTimer";
import SupersetCompletePage from "../SupersetCompletePage";
import FinishPage from "../FinishPage";
import WrapperPage from "../WrapperPage";
import { Widget } from "../../components/others/Widget";
import { SummaryPage } from "../SummaryPage";
import { Loading } from "../helpers/Loading";
import { UnwrappedRestTimer } from "../timer/UnwrappedRestTimer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlayCircle } from "@fortawesome/free-solid-svg-icons";
import { WatchVideo } from "../../components/others/WatchVideo";
import { ExerciseDetails } from "./ExerciseDetails";

type State = {
  exerciseCounter: number;
  exerciseSet: number;
  supersetCounter: number;
  supersetRest: boolean;
  supersetComplete: boolean;
  supersetTimer: boolean;
};

type Action =
  | { type: "reset" }
  | { type: "update"; payload: any }
  | { type: "continue"; payload?: any };

const initialState = {
  exerciseCounter: 0,
  exerciseSet: 0,
  supersetCounter: 0,
  supersetRest: false,
  supersetComplete: false,
  supersetTimer: false,
};

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case "reset":
      return {
        ...initialState,
        supersetCounter: state.supersetCounter + 1,
      };
    case "update":
      let { exerciseCounter: ecounter, exerciseSet: eset } = state;

      if (
        "supersetRest" in state &&
        ecounter % action.payload.exerciseLength === 0
      ) {
        eset++;
      }

      return {
        ...state,
        ...action.payload,
        exerciseSet: eset,
        supersetComplete: eset >= action.payload.targetSet,
      };
    case "continue":
      const exerciseCounter = state.exerciseCounter + 1;
      let { exerciseSet, supersetRest, supersetComplete, supersetTimer } =
        state;

      if (exerciseCounter % action.payload.exerciseLength === 0) {
        supersetComplete = exerciseSet + 1 >= action.payload.targetSet;
        if (!supersetComplete) {
          supersetRest = true;
        }
      }

      supersetTimer = false;

      return {
        ...state,
        ...action.payload,
        exerciseSet,
        exerciseCounter,
        supersetRest,
        supersetComplete,
        supersetTimer,
      };
    default:
      return state;
  }
};

export const ExercisePage = () => {
  const sessionContext = useContext(SessionContext);
  const { sessionData, updateUserData } = sessionContext as any;

  const [exerciseState, dispatch] = useReducer(reducer, initialState);

  const [actualSupersetData, setActualSupersetData] = useState<any>({});
  const [supersetData, setSupersetData] = useState<any>({});
  const [exerciseData, setExerciseData] = useState<any>({});

  const [actualWeight, setActualWeight] = useState<string>("");
  const [actualRep, setActualRep] = useState<string>("");

  const [targetWeight, setTargetWeight] = useState<string>("0");

  const [targetRep, setTargetRep] = useState<string>("0");

  const completeExercise = () => {
    const targetSet = parseInt(supersetData.targetSet);
    const exerciseLength = supersetData.exercises.length;

    dispatch({
      type: "continue",
      payload: {
        targetSet,
        exerciseLength,
      },
    });
  };

  const handleCompleteExercise = () => {
    // TODO: Last set of the exercise is not saved!!!
    completeExercise();

    const exercise = exerciseData.exercise.name;
    const superset = supersetData.name;
    const actualSuperset = actualSupersetData?.[superset] || {};
    const actualExercise = actualSuperset[exercise] || {};

    setActualSupersetData({
      ...actualSupersetData,
      [superset]: {
        ...actualSuperset,
        [exercise]: {
          ...actualExercise,
          [exerciseState.exerciseSet + 1]: {
            // actualRep,
            // actualWeight,
            // actualTime
            targetRep,
            targetWeight,
            // targetTime,
          },
        },
      },
    });
  };

  // const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   completeExercise();

  //   const exercise = exerciseData.exercise.name;
  //   const superset = supersetData.name;
  //   const actualSuperset = actualSupersetData?.[superset] || {};
  //   const actualExercise = actualSuperset[exercise] || {};

  //   console.log("I am here");

  //   setActualSupersetData({
  //     ...actualSupersetData,
  //     [superset]: {
  //       ...actualSuperset,
  //       [exercise]: {
  //         ...actualExercise,
  //         [exerciseState.exerciseSet + 1]: {
  //           actualRep,
  //           actualWeight,
  //           // actualTime
  //         },
  //       },
  //     },
  //   });
  // };

  useEffect(() => {
    if (supersetData && Object.keys(supersetData).length) {
      const exerciseLength = supersetData.exercises.length;
      const exercise =
        supersetData.exercises[exerciseState.exerciseCounter % exerciseLength];

      setExerciseData(exercise);
    }

    return () => {};
  }, [exerciseState.exerciseCounter, supersetData]);

  useEffect(() => {
    let superset: any = Object.values(sessionData.supersets)[
      exerciseState.supersetCounter
    ];

    if (superset) {
      superset.exercises = superset.exercises.filter((e: any) => e.exercise);
      setActualRep(superset.targetRep);
      setTargetRep(superset.targetRep);
      setSupersetData(superset);
    }

    return () => {};
  }, [exerciseState.supersetCounter, sessionData]);

  useEffect(() => {
    if (exerciseData.targetWeight) {
      setActualWeight(exerciseData.targetWeight);
      setTargetWeight(exerciseData.targetWeight);
      setTargetRep(exerciseData.exercise?.targetRep || exerciseData.targetRep);
    }
  }, [exerciseData]);

  // useEffect(() => {
  //   setSessionData({
  //     ...sessionData,
  //     supersets: {
  //       ...sessionData.supersets,
  //       [supersetData.name]: {
  //         ...sessionData.supersets[supersetData.name],
  //         complete: true,
  //       },
  //     },
  //   });
  // }, [exerciseState.supersetComplete]);

  const supersetLength = Object.keys(sessionData.supersets).length;
  if (supersetLength > 0 && exerciseState.supersetCounter >= supersetLength) {
    if (actualSupersetData) {
      updateUserData(actualSupersetData);
      setActualSupersetData({});
    }

    const supersetIndex = Object.values(sessionData.supersets).indexOf(
      supersetData
    );

    return (
      <SummaryPage
        currentSuperset={supersetData}
        supersetIndex={supersetIndex}
        sessionComplete={true}
      />
    );
  }

  if (exerciseState.supersetComplete) {
    const supersetIndex = Object.values(sessionData.supersets).indexOf(
      supersetData
    );

    return (
      <SummaryPage
        currentSuperset={supersetData}
        nextSuperset={
          Object.values(sessionData.supersets)[
            exerciseState.supersetCounter + 1
          ] || null
        }
        supersetIndex={supersetIndex}
        nextPageHandler={() => dispatch({ type: "reset" })}
        actualSupersetData={actualSupersetData}
      />
    );
  }

  // if (exerciseState.supersetRest) {
  //   return (
  //     <RestTimer
  //       length={parseInt(supersetData.rest) || 120}
  //       stateLabel={`Completed ${exerciseState.exerciseSet} sets of ${parseInt(supersetData.targetSet)}`}
  //       toggleRest={(supersetRest: boolean) => {
  //         dispatch({
  //           type: "update",
  //           payload: { supersetRest },
  //         });
  //       }}
  //     />
  //   );
  // }

  if (exerciseState.supersetTimer) {
    return (
      <WorkTimer
        label={"WORK TIME"}
        length={exerciseData.targetTime || supersetData.targetTime || 0}
        toggleRest={(supersetRest: boolean) => {
          // dispatch({ type: "update", payload: { supersetTimer: false } });
          completeExercise();
        }}
      >
        <div className={`flex justify-center py-4 gap-2 font-bold text-lg`}>
          <span>{supersetData.name}: </span>
          <span>{exerciseData.exercise?.name}</span>
        </div>
      </WorkTimer>
    );
  }

  if (Object.keys(supersetData).length === 0) {
    return <Loading />;
  }

  return (
    <WrapperPage>
      <div
        className="min-h-[60vh] sm:min-h-[30rem]
          flex flex-col
          gap-4 shadow-md
          rounded-lg mx-4 mt-8
          bg-primary
          relative"
      >
        <div className="flex flex-col pt-4 pl-4">
          <span className="text-white text-xs font-base">
            {[sessionData.week, sessionData.annotation]
              .filter((s: string) => typeof s === "string" && s.trim() !== "")
              .join(" - ")}
          </span>
          <span className="text-white text-base font-bold">
            {supersetData.name}{" "}
          </span>
        </div>
        <div className="w-full h-full flex flex-col rounded-tl-3xl bg-white dark:bg-surface-dark">
          <div
            className="self-end
              flex items-center
              text-white text-sm font-bold bg-success-600 h-6
              rounded-l-xl mt-3 p-2 px-4"
            aria-live="polite"
          >
            <span>Set</span>
            <span className="text-3xl rounded-full bg-success-600 px-2 py-1">
              {exerciseState.exerciseSet + 1}
            </span>
            <span>of {parseInt(supersetData.targetSet)}</span>
          </div>
          {exerciseState.supersetRest && (
            <div className={`flex flex-col h-full`}>
              <UnwrappedRestTimer
                length={parseInt(supersetData.rest) || 120}
                stateLabel={`Completed ${exerciseState.exerciseSet} sets of ${parseInt(supersetData.targetSet)}`}
                toggleRest={(supersetRest: boolean) => {
                  const targetSet = parseInt(supersetData.targetSet);
                  const exerciseLength = supersetData.exercises.length;

                  dispatch({
                    type: "update",
                    payload: { supersetRest, targetSet, exerciseLength },
                  });
                }}
              />
            </div>
          )}
          {!exerciseState.supersetRest && (
            <ExerciseDetails
              name={exerciseData.exercise?.name}
              type={supersetData.type}
              targetWeight={targetWeight}
              targetRep={targetRep}
              targetTime={
                exerciseData.targetTime || supersetData.targetTime || "0"
              }
              videoLink={exerciseData.exercise?.videoLink}
              completeExercise={handleCompleteExercise}
              updateSupersetData={(data: any) => {
                setSupersetData({
                  ...supersetData,
                  ...data,
                });
                const { targetWeight: tWeight, targetRep: tRep } = data;
                if (targetWeight in data) {
                  setTargetWeight(tWeight);
                } else {
                  setTargetRep(tRep);
                }
              }}
            />
          )}
        </div>
      </div>
      <Button
        decoration="delete"
        className="min-h-11 mx-4"
        label="CANCEL SESSION"
        onClick={() => sessionContext.wrapSession()}
      />
    </WrapperPage>
  );
};
