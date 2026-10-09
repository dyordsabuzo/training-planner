
import { ConfirmDeleteButton } from "../../forms/ConfirmDeleteButton";
import React, { useContext, useEffect, useReducer, useState } from "react";
import { useNavigate } from "react-router";
import { faCircleXmark, faCompress } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SessionContext from "../../context/SessionContext";
import WrapperPage from "../WrapperPage";
import { SummaryPage } from "../SummaryPage";
import { Loading } from "../helpers/Loading";
import { UnwrappedRestTimer } from "../timer/UnwrappedRestTimer";
import { SessionProgress } from "../others/SessionProgress";
import { ExerciseDetails } from "./ExerciseDetails";
import { Button } from "@dyordsabuzo/ui-components";
import { unitId } from "../resolveSessionSupersets";
import {
  isMobileViewport,
  lockPortraitOrientation,
  resetPageZoom,
  unlockPortraitOrientation,
} from "../../common/utils";

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
  const { sessionData, saveProgress, exitPath } = sessionContext as any;
  const navigate = useNavigate();

  const [exerciseState, dispatch] = useReducer(reducer, initialState);

  const [actualSupersetData, setActualSupersetData] = useState<any>({});
  const [supersetData, setSupersetData] = useState<any>({});
  const [exerciseData, setExerciseData] = useState<any>({});

  const [targetWeight, setTargetWeight] = useState<string>("0");

  const [targetRep, setTargetRep] = useState<string>("0");
  const [targetDistance, setTargetDistance] = useState<string>("0");

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
    const superset = unitId(supersetData);
    const actualSuperset = actualSupersetData?.[superset] || {};
    const actualExercise = actualSuperset[exercise] || {};

    const nextActual = {
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
            ...(supersetData.targetDistance && { targetDistance }),
            targetWeight,
            // targetTime,
          },
        },
      },
    };
    setActualSupersetData(nextActual);
    // Saved per set so a run interrupted partway keeps what was logged.
    saveProgress?.(nextActual);
  };

  useEffect(() => {
    if (isMobileViewport()) {
      lockPortraitOrientation();
      return () => unlockPortraitOrientation();
    }

    return () => {};
  }, []);

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
      setTargetDistance(String(superset.targetDistance ?? "0"));
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
    // The finished run is saved by SummaryPage; this only resets local state.
    if (actualSupersetData) {
      setActualSupersetData({});
    }

    const supersetIndex = Object.values(sessionData.supersets).findIndex(
      (unit: any) => unitId(unit) === unitId(supersetData)
    );

    return (
      <SummaryPage currentSuperset={supersetData} supersetIndex={supersetIndex} />
    );
  }

  if (exerciseState.supersetComplete) {
    const supersetIndex = Object.values(sessionData.supersets).findIndex(
      (unit: any) => unitId(unit) === unitId(supersetData)
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

  // How far through the whole session this is, as a percentage: units fully
  // finished, plus how far into the current unit's sets.
  const totalUnits = allSupersets.length;
  const unitsDone = exerciseState.supersetCounter;
  const unitTargetSets = parseInt(supersetData.targetSet) || 0;
  const unitFraction = unitTargetSets > 0 ? Math.min(1, exerciseState.exerciseSet / unitTargetSets) : 0;
  const overallPercent =
    totalUnits > 0 ? Math.round((Math.min(totalUnits, unitsDone + unitFraction) / totalUnits) * 100) : 0;

  const exerciseLabel =
    exerciseLength > 1
      ? `Exercise ${(exerciseState.exerciseCounter % exerciseLength) + 1} of ${exerciseLength}`
      : undefined;

  // Swaps the exercise at the current slot for the chosen alternative. It
  // writes into supersetData.exercises (rather than just local component
  // state), so the substitution sticks for every remaining set of this
  // superset, not just the set in progress.
  const handleSelectAlternative = (altExercise: any) => {
    const index = exerciseState.exerciseCounter % exerciseLength;
    const newExercises = supersetData.exercises.map((item: any, i: number) =>
      i === index
        ? { exercise: altExercise, targetWeight: altExercise.targetWeight || 0 }
        : item
    );

    setSupersetData({
      ...supersetData,
      exercises: newExercises,
    });
  };

  return (
    <WrapperPage
      className="max-w-[26rem] sm:max-w-2xl lg:max-w-6xl"
      outerClassName="pb-8 px-2"
    >
      <button
        type="button"
        onClick={resetPageZoom}
        aria-label="Fit page to screen"
        title="Fit page to screen"
        className="lg:hidden fixed bottom-24 right-4 z-30 w-12 h-12 flex items-center justify-center
          rounded-full bg-primary dark:bg-primary-400 text-white shadow-lg
          active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <FontAwesomeIcon icon={faCompress} />
      </button>
      <div className="lg:flex lg:gap-6 lg:items-start">
        <div className="flex-1 flex flex-col gap-2">
          <div
            className="min-h-[70dvh] sm:min-h-[32rem] lg:min-h-[36rem]
              flex flex-col
              gap-4 shadow-md
              rounded-lg mx-2 mt-8 lg:mx-0
              bg-primary dark:bg-primary-400
              relative"
          >
            <div className="flex flex-col gap-[0.2px] pt-6 pl-4 pr-4">
              <span className="text-white/80 text-sm font-semibold uppercase tracking-wide">
                {[sessionData.session, sessionData.week]
                  .filter((s: string) => typeof s === "string" && s.trim() !== "")
                  .join(" · ")}
              </span>
              <span className="text-white text-xl sm:text-2xl font-bold uppercase line-clamp-2 break-words" title={supersetData.name}>
                {supersetData.name}
              </span>

              {typeof sessionData.annotation === "string" &&
                sessionData.annotation.trim() !== "" && (
                  <span className="text-white/80 text-sm">
                    {sessionData.annotation}
                  </span>
                )}

              <div className="mt-3 flex items-center gap-2">
                <div
                  role="progressbar"
                  aria-label="Session progress"
                  aria-valuenow={overallPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="flex-1 h-1.5 rounded-full bg-white/25 overflow-hidden"
                >
                  <div
                    className="h-full rounded-full bg-white transition-all duration-300"
                    style={{ width: `${overallPercent}%` }}
                  />
                </div>
                <span className="text-white/80 text-xs font-semibold shrink-0">
                  {unitsDone + 1} of {totalUnits} · {overallPercent}%
                </span>
              </div>
            </div>
            <div className="w-full flex-1 flex flex-col rounded-tl-3xl bg-white dark:bg-surface-dark">
              <div
                className="self-end flex items-center gap-2 text-white text-sm font-semibold
                  bg-primary dark:bg-primary-400 rounded-l-full mt-3 py-2 pl-5 pr-4"
                aria-live="polite"
              >
                <span>Set</span>
                <span className="relative h-6 w-6 overflow-hidden">
                  <span
                    key={exerciseState.exerciseSet}
                    className="absolute inset-0 flex items-center justify-center text-xl font-bold
                      leading-none animate-roll-down"
                  >
                    {exerciseState.exerciseSet + 1}
                  </span>
                </span>
                <span>of {parseInt(supersetData.targetSet)}</span>
              </div>
              {exerciseState.supersetRest && (
                <div className="flex-1 flex flex-col animate-slide-up">
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
                  targetDistance={supersetData.targetDistance ? targetDistance : undefined}
                  leftRight={!!supersetData.leftRight}
                  sideRest={supersetData.sideRest}
                  targetTime={
                    exerciseData.targetTime || supersetData.targetTime || "0"
                  }
                  exerciseLabel={exerciseLabel}
                  transitionKey={`${exerciseState.supersetCounter}-${exerciseState.exerciseCounter}`}
                  videoLink={exerciseData.exercise?.videoLink}
                  alternatives={exerciseData.exercise?.alternatives}
                  onSelectAlternative={handleSelectAlternative}
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
                    } else if ("targetDistance" in data) {
                      setTargetDistance(String(data.targetDistance));
                    }
                  }}
                />
              )}
            </div>
          </div>
          <div className="flex justify-end mx-2 lg:mx-0">
            <ConfirmDeleteButton
              label="Cancel session"
              icon={faCircleXmark}
              decoration="text-danger"
              useModal
              onDelete={() => {
                sessionContext.wrapSession();
                navigate(exitPath);
              }}
            />
          </div>
        </div>

        <aside
          className="hidden lg:flex lg:flex-col lg:w-80 shrink-0 mt-8
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
