import { Button } from "../components/form/Button";
import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router";
import SessionContext from "../context/SessionContext";
import WrapperPage from "./WrapperPage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { Celebration } from "./others/Celebration";
import { SessionProgress } from "./others/SessionProgress";
import { isTrainSessionPath } from "../routes/trainRoutes";

type Props = {
  currentSuperset?: any;
  nextSuperset?: any;
  actualSupersetData?: any;
  supersetIndex?: number;
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
  const navigate = useNavigate();
  const location = useLocation();
  const isSessionRoute = isTrainSessionPath(location.pathname);

  const handleButtonClick = () => {
    if (sessionComplete) {
      wrapSession();
      navigate("/training-planner/train");
    } else if (nextSuperset) {
      nextPageHandler();
    } else {
      setIsRunning(true);
      navigate(`/training-planner/train/${crypto.randomUUID()}`);
    }
  };

  const supersets = Object.values((sessionData as any).supersets) || [];
  const subtitle = [(sessionData as any).week, (sessionData as any).annotation]
    .filter((s: string) => typeof s === "string" && s.trim() !== "")
    .join(" · ");

  if (sessionComplete) {
    updateUserData(actualSupersetData);
  }

  return (
    <WrapperPage
      className="max-w-[25rem] sm:max-w-xl lg:max-w-2xl"
      outerClassName={isSessionRoute ? "pb-8 px-2" : "pb-20 px-2"}
    >
      <div className="w-full flex flex-col gap-4 pt-8 text-text-light dark:text-text-dark">
        {!currentSuperset && (
          <button
            type="button"
            className="min-h-11 self-start flex items-center gap-2 text-sm text-primary hover:text-primary-700 font-bold
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            onClick={() => {
              initialiseSession(null);
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back
          </button>
        )}

        {sessionComplete && <Celebration />}

        <div>
          <h1 className="text-2xl font-bold">{(sessionData as any).session}</h1>
          {subtitle && (
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className="border border-gray-200 dark:border-gray-700 rounded-md p-4
            bg-white dark:bg-surface-dark shadow-sm flex flex-col"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark mb-3">
            {supersets.length} {supersets.length === 1 ? "superset" : "supersets"}
          </span>
          <SessionProgress
            supersets={supersets}
            doneUpToIndex={currentSuperset ? supersetIndex : -1}
          />
        </div>

        {!sessionComplete && (
          <div
            className="flex justify-center text-primary/50 dark:text-primary-300/50 animate-bounce"
            aria-hidden="true"
          >
            <FontAwesomeIcon icon={faChevronDown} />
          </div>
        )}

        <Button
          label={
            nextSuperset
              ? "Next superset"
              : currentSuperset
                ? "Finish workout"
                : "Start workout"
          }
          onClick={handleButtonClick}
          className="min-h-11 w-full"
        />
      </div>
    </WrapperPage>
  );
};
