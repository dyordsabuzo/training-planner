import { Button } from "../components/form/Button";
// import {ExerciseType} from "../types/ExerciseType";
import React, { useContext, useState } from "react";
import SessionContext from "../context/SessionContext";
import WrapperPage from "./WrapperPage";
import { ExerciseSuperset } from "../types/Exercise";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCheck,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { Celebration } from "./others/Celebration";

type Props = {
  currentSuperset?: any;
  nextSuperset?: any;
  supersetIndex?: number;
  sessionComplete?: boolean;
  nextPageHandler?: () => void;
};

export const SummaryPage = ({
  currentSuperset = null,
  nextSuperset = null,
  supersetIndex = 0,
  nextPageHandler = () => {},
}: Props) => {
  const sessionComplete = currentSuperset && !nextSuperset;

  const handleButtonClick = () => {
    if (sessionComplete) {
      sessionContext.wrapSession();
    } else if (nextSuperset) {
      nextPageHandler();
    } else {
      sessionContext.setIsRunning(true);
    }
  };

  const sessionContext = useContext(SessionContext);
  const supersets =
    Object.values((sessionContext.sessionData as any).supersets) || [];

  return (
    <WrapperPage>
      <div className={`grid place-content-center gap-2 pt-12`}>
        {sessionComplete && <Celebration />}
        <Button
          label={`${nextSuperset ? "NEXT" : currentSuperset ? "FINISH" : "BEGIN"}`}
          onClick={handleButtonClick}
          className={`py-4`}
        />

        <div className={`flex gap-2`}>
          <div className={`flex flex-col pt-4 gap-1`}>
            {supersets.map((s: any, index: number) => (
              <div key={s.name} className={`flex flex-col items-center gap-1`}>
                <div
                  className={`w-6 h-6 border-2 border-gray rounded-full flex items-center justify-center`}
                >
                  {currentSuperset && index <= supersetIndex && (
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className={`text-green-500 text-2xl`}
                    />
                  )}
                </div>
                <div className="h-[5.5rem] max-w-xs border-1 border-dashed"></div>
              </div>
            ))}
            <div className={`w-6 h-6 border border-gray rounded-full`}>
              {supersets.length === supersetIndex + 1 && (
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className={`text-green-500 text-2xl`}
                />
              )}
            </div>
          </div>
          <div className={`w-full flex flex-col gap-2 divid-y`}>
            {supersets.map((superset: any, index: number) => (
              <div
                key={index}
                className={`w-full p-4 rounded-md flex flex-col gap-2
                  ${currentSuperset && index <= supersetIndex ? "bg-green-300" : ""}
                  `}
              >
                <span className={`text-base font-bold`}>{superset.name}</span>
                <div className={`flex flex-col gap-1`}>
                  {superset.exercises.map((item: ExerciseSuperset) => (
                    <span
                      key={item.exercise.name}
                      // className={`text-sm leading-none bg-green-500 text-white rounded-xl p-2 w-fit`}
                      className={`text-sm leading-none text-gray-700 rounded-xl w-fit`}
                    >
                      {item.exercise.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <span
              className={`w-full p-4 rounded-md flex flex-col text-base font-bold`}
            >
              FINISH
            </span>
          </div>
        </div>

        {!currentSuperset && (
          <div
            className={`flex items-center gap-2 text-base text-blue-500 hover:text-blue-700 cursor-pointer font-bold`}
            onClick={() => {
              sessionContext.initialiseSession(null);
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back
          </div>
        )}
      </div>
    </WrapperPage>
  );
};
