import { Button } from "../../components/form/Button";
import { ConfirmDeleteButton } from "../../forms/ConfirmDeleteButton";
import React, { useContext, useEffect, useReducer, useState } from "react";
import { useNavigate } from "react-router";
import SessionContext from "../../context/SessionContext";
import WrapperPage from "../WrapperPage";
import { SummaryPage } from "../SummaryPage";
import { Loading } from "../helpers/Loading";
import { UnwrappedRestTimer } from "../timer/UnwrappedRestTimer";
import { SessionProgress } from "../others/SessionProgress";
import { ExerciseDetails } from "./ExerciseDetails";

type State = {
  exerciseCounter: number;
  exerciseSet: number;
  supersetCounter: number;
  supersetRest: boolean;
  supersetComplete: boolean;
};

type Action =
  | { type: "reset" }
  | { type: "update"; payload: any }
  | { type: "continue"; payload?: any };

const pluralize = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

const initialState = {
  exerciseCounter: 0,
  exerciseSet: 0,
  supersetCounter: 0,
  supersetRest: false,
  supersetComplete: false,
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
      let { exerciseSet, supersetRest, supersetComplete } = state;

      if (exerciseCounter % action.payload.exerciseLength === 0) {
        supersetComplete = exerciseSet + 1 >= action.payload.targetSet;
        if (!supersetComplete) {
          supersetRest = true;
        }
      }

      return {
        ...state,
        ...action.payload,
        exerciseSet,
        exerciseCounter,
        supersetRest,
        supersetComplete,
      };
    default:
      return state;
  }
};

export const ExercisePage = () => {
  const sessionContext = useContext(SessionContext);
  const { sessionData, updateUserData } = sessionContext as any;
  const navigate = useNavigate();

  const [exerciseState, dispatch] = useReducer(reducer, initialState);

  const [actualSupersetData, setActualSupersetData] = useState<any>({});
  const [supersetData, setSupersetData] = useState<any>({});
  const [exerciseData, setExerciseData] = useState<any>({});

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
      setTargetRep(superset.targetRep);
      setSupersetData(superset);
    }

    return () => {};
  }, [exerciseState.supersetCounter, sessionData]);

  useEffect(() => {
    if (exerciseData.targetWeight) {
      setTargetWeight(exerciseData.targetWeight);
      setTargetRep(exerciseData.exercise?.targetRep || exerciseData.targetRep);
    }
  }, [exerciseData]);

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
      <SummaryPage currentSuperset={supersetData} supersetIndex={supersetIndex} />
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

  if (Object.keys(supersetData).length === 0) {
    return <Loading />;
  }

  const allSupersets = Object.values(sessionData.supersets);
  const exerciseLength = supersetData.exercises.length;
  const exerciseLabel =
    exerciseLength > 1
      ? `Exercise ${(exerciseState.exerciseCounter % exerciseLength) + 1} of ${exerciseLength}`
      : undefined;

  return (
    <WrapperPage
      className="max-w-[25rem] sm:max-w-xl lg:max-w-4xl"
      outerClassName="pb-8 px-2"
    >
      <div className="lg:flex lg:gap-6 lg:items-start">
        <div className="flex-1 flex flex-col gap-4">
          <div
            className="min-h-[70vh] sm:min-h-[30rem] lg:min-h-[34rem]
              flex flex-col
              gap-4 shadow-md
              rounded-lg mx-4 mt-8 lg:mx-0
              bg-primary
              relative"
          >
            <div className="flex flex-col pt-4 pl-4">
              <span className="text-white/80 text-xs font-semibold uppercase tracking-wide">
                {[sessionData.session, sessionData.week]
                  .filter((s: string) => typeof s === "string" && s.trim() !== "")
                  .join(" · ")}
              </span>
              <span className="text-white text-lg font-bold">
                {supersetData.name}
              </span>
              {typeof sessionData.annotation === "string" &&
                sessionData.annotation.trim() !== "" && (
                  <span className="text-white/80 text-xs">
                    {sessionData.annotation}
                  </span>
                )}
            </div>
            <div className="w-full flex-1 flex flex-col rounded-tl-3xl bg-white dark:bg-surface-dark">
              <div
                className="self-end flex items-center gap-2 text-white text-sm font-semibold
                  bg-success-600 rounded-l-full mt-3 py-2 pl-5 pr-4"
                aria-live="polite"
              >
                <span>Set</span>
                <span className="text-xl font-bold leading-none">
                  {exerciseState.exerciseSet + 1}
                </span>
                <span>of {parseInt(supersetData.targetSet)}</span>
              </div>
              {exerciseState.supersetRest && (
                <div className="flex-1 flex flex-col">
                  <UnwrappedRestTimer
                    length={parseInt(supersetData.rest) || 120}
                    stateLabel={`Completed ${pluralize(exerciseState.exerciseSet, "set")} of ${parseInt(supersetData.targetSet)}`}
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
                  exerciseLabel={exerciseLabel}
                  videoLink={exerciseData.exercise?.videoLink}
                  completeExercise={handleCompleteExercise}
                  updateSupersetData={(data: any) => {
                    setSupersetData({
                      ...supersetData,
                      ...data,
                    });
                    if ("targetWeight" in data) {
                      setTargetWeight(String(data.targetWeight));
                    } else if ("targetRep" in data) {
                      setTargetRep(String(data.targetRep));
                    }
                  }}
                />
              )}
            </div>
          </div>
          <div className="mx-4 lg:mx-0">
            <ConfirmDeleteButton
              label="Cancel session"
              onDelete={() => {
                sessionContext.wrapSession();
                navigate("/training-planner/train");
              }}
            />
          </div>
        </div>

        <aside
          className="hidden lg:flex lg:flex-col lg:w-72 shrink-0 mt-8
            border border-gray-200 dark:border-gray-700 rounded-md p-4
            bg-white dark:bg-surface-dark shadow-sm text-text-light dark:text-text-dark"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark mb-3">
            Session progress
          </span>
          <SessionProgress
            supersets={allSupersets}
            doneUpToIndex={exerciseState.supersetCounter - 1}
            activeIndex={exerciseState.supersetCounter}
          />
        </aside>
      </div>
    </WrapperPage>
  );
};
