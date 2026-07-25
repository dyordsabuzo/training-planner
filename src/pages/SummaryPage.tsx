import { Button } from "../components/form/Button";
// import {ExerciseType} from "../types/ExerciseType";
import React, { useContext } from "react";
import SessionContext from "../context/SessionContext";
import WrapperPage from "./WrapperPage";
import { ExerciseSuperset } from "../types/Exercise";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { Celebration } from "./others/Celebration";

type Props = {
  currentSuperset?: any;
  nextSuperset?: any;
  actualSupersetData?: any;
  supersetIndex?: number;
  sessionComplete?: boolean;
  nextPageHandler?: () => void;
};

export const SummaryPage = ({
  currentSuperset = null,
  nextSuperset = null,
  actualSupersetData = null,
  supersetIndex = 0,
  nextPageHandler = () => {},
}: Props) => {
  const sessionComplete = currentSuperset && !nextSuperset;
  const {
    sessionData,
    wrapSession,
    updateUserData,
    initialiseSession,
    setIsRunning,
  } = useContext(SessionContext);

  const handleButtonClick = () => {
    if (sessionComplete) {
      wrapSession();
    } else if (nextSuperset) {
      nextPageHandler();
    } else {
      setIsRunning(true);
    }
  };

  const supersets = Object.values((sessionData as any).supersets) || [];

  if (sessionComplete) {
    console.log(actualSupersetData);
    updateUserData(actualSupersetData);
  }

  return (
    <WrapperPage>
      <div className="w-full grid place-content-center gap-2 pt-12 text-text-light dark:text-text-dark">
        {sessionComplete && <Celebration />}
        <Button
          label={`${nextSuperset ? "NEXT" : currentSuperset ? "FINISH" : "BEGIN"}`}
          onClick={handleButtonClick}
          className="min-h-11 w-full"
        />

        <div className="flex gap-2">
          <div className="flex flex-col pt-4 gap-1">
            {supersets.map((s: any, index: number) => (
              <div key={s.name} className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 border-2 border-gray-400 dark:border-gray-500 rounded-full flex items-center justify-center">
                  {currentSuperset && index <= supersetIndex && (
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="text-success-500 text-2xl"
                    />
                  )}
                </div>
                <div className="h-[5.5rem] max-w-xs border-1 border-dashed border-gray-400 dark:border-gray-500"></div>
              </div>
            ))}
            <div className="w-6 h-6 border border-gray-400 dark:border-gray-500 rounded-full">
              {supersets.length === supersetIndex + 1 && (
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-success-500 text-2xl"
                />
              )}
            </div>
          </div>
          <div className="w-full flex flex-col gap-2 divid-y">
            {supersets.map((superset: any, index: number) => (
              <div
                key={index}
                className={`w-full p-4 rounded-md flex flex-col gap-2
                  ${currentSuperset && index <= supersetIndex ? "bg-success-100 dark:bg-success-700/30" : ""}
                  `}
              >
                <span className="text-base font-bold">{superset.name}</span>
                <div className="flex flex-col gap-1">
                  {superset.exercises.map(
                    (item: ExerciseSuperset, index: number) => (
                      <span
                        key={index}
                        className={`
                          text-sm leading-none rounded-xl w-fit
                          ${item.exercise ? "text-text-light dark:text-text-dark" : "text-transparent"}
                        `}
                      >
                        {item.exercise?.name || "filler"}
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
            <span className="w-full p-4 rounded-md flex flex-col text-base font-bold">
              FINISH
            </span>
          </div>
        </div>

        {!currentSuperset && (
          <button
            type="button"
            className="min-h-11 flex items-center gap-2 text-base text-primary hover:text-primary-700 font-bold
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            onClick={() => {
              initialiseSession(null);
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back
          </button>
        )}
      </div>
    </WrapperPage>
  );
};
