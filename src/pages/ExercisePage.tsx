import Input from "../components/Input";
import React, { useContext, useEffect, useReducer, useState } from "react";
import SessionContext from "../context/SessionContext";
import RestPage from "./RestPage";
import SupersetCompletePage from "./SupersetCompletePage";
import FinishPage from "./FinishPage";
import WrapperPage from "./WrapperPage";
import Widget from "../components/Widget";

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
      return {
        ...state,
        ...action.payload,
      };
    case "continue":
      const exerciseCounter = state.exerciseCounter + 1;
      let { exerciseSet, supersetRest, supersetComplete } = state;

      if (exerciseCounter % action.payload.exerciseLength === 0) {
        exerciseSet++;
        supersetRest = true;
      }

      supersetComplete = exerciseSet >= action.payload.targetSet;

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

const ExercisePage = () => {
  const sessionContext = useContext(SessionContext);
  const sessionData: any = sessionContext.sessionData;

  const [exerciseState, dispatch] = useReducer(reducer, initialState);

  const [supersetData, setSupersetData] = useState<any>({});
  const [exerciseData, setExerciseData] = useState<any>({});

  const [actualWeight, setActualWeight] = useState<string>("");
  const [actualRep, setActualRep] = useState<string>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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

  useEffect(() => {
    if (supersetData && Object.keys(supersetData).length) {
      const exerciseLength = supersetData.exercises.length;
      const exercise =
        supersetData.exercises[exerciseState.exerciseCounter % exerciseLength];
      console.log(exercise);
      setExerciseData(exercise);
    }

    return () => {};
  }, [exerciseState.exerciseCounter, supersetData]);

  useEffect(() => {
    const superset: any = Object.values(sessionData.supersets)[
      exerciseState.supersetCounter
    ];
    if (superset) {
      setActualRep(superset.targetRep);
      setSupersetData(superset);
    }

    return () => {};
  }, [exerciseState.supersetCounter, sessionData]);

  if (
    exerciseState.supersetCounter >= Object.keys(sessionData.supersets).length
  ) {
    return (
      <FinishPage
        wrapSession={() => {
          sessionContext.wrapSession();
        }}
      />
    );
  }

  if (exerciseState.supersetComplete) {
    return (
      <SupersetCompletePage
        superset={supersetData.name}
        nextSuperset={
          Object.values(sessionData.supersets)[
            exerciseState.supersetCounter + 1
          ] || null
        }
        nextPageHandler={(flag) => dispatch({ type: "reset" })}
      />
    );
  }

  if (exerciseState.supersetRest) {
    return (
      <RestPage
        length={parseInt(supersetData.rest)}
        toggleRest={(supersetRest: boolean) => {
          dispatch({
            type: "update",
            payload: { supersetRest },
          });
        }}
      />
    );
  }

  if (Object.keys(supersetData).length === 0) {
    return <div>Loading</div>;
  }

  return (
    <WrapperPage>
      <div
        className={`h-[45vh] 
                    grid place-content-center
                    gap-4 shadow-md 
                    border rounded-lg mx-4 mt-8`}
      >
        <div className={`grid place-content-center pb-2`}>
          <span
            className={`grid place-content-center
                        text-xs bg-blue-200 font-bold
                        rounded-xl p-2`}
          >
            Exercise Set {exerciseState.exerciseSet + 1}
          </span>
          <div className={`leading-none py-4`}>
            <span className={`grid place-content-center text-3xl`}>
              {exerciseData.name}
            </span>
            <span className={`grid place-content-center text-sm font-light`}>
              {sessionData.week} - {supersetData.annotation}
            </span>
          </div>
          <span
            className={`grid place-content-center
                        text-xs bg-green-200 font-bold
                        p-2 rounded-xl`}
          >
            {" "}
            {supersetData.name}{" "}
          </span>
        </div>
        <div className={`grid grid-cols-2 gap-4`}>
          <Widget
            label={"Target Weight"}
            value={exerciseData.targetWeight}
            unit={"kg"}
          />
          <Widget
            label={"Target Rep"}
            value={parseInt(exerciseData.targetRep) || supersetData.targetRep}
            unit={"reps"}
          />
        </div>
        {exerciseData.videoLink && (
          <div className={`flex justify-center mb-2`}>
            <a
              className="no-underline text-white bg-blue-500 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
              target="_blank"
              rel="noreferrer"
              href={exerciseData.videoLink}
            >
              Watch video
            </a>
          </div>
        )}
      </div>
      <form className={`grid grid-cols-2 gap-4 p-4`} onSubmit={handleSubmit}>
        <Input
          label={"Actual Weight"}
          required
          value={actualWeight || "0"}
          placeholder={"Weight in kg"}
          changeValue={setActualWeight}
        />

        <Input
          label={"Actual Rep"}
          required
          value={actualRep}
          placeholder={"Actual rep"}
          changeValue={setActualRep}
        />

        <button
          type={"submit"}
          className="col-span-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded"
        >
          DONE
        </button>

        <button
          type={"button"}
          className="col-span-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-4 px-4 rounded"
          onClick={() => sessionContext.wrapSession()}
        >
          CANCEL SESSION
        </button>
      </form>
    </WrapperPage>
  );
};

export default ExercisePage;
