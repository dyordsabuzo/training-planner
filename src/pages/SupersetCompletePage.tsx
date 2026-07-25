import { Button } from "../components/form/Button";
import React from "react";
import WrapperPage from "./WrapperPage";
import { SummaryPage } from "./SummaryPage";

type SupersetCompletePageProps = {
  superset: any;
  nextSuperset: any;
  nextPageHandler: () => void;
};

const SupersetCompletePage: React.FC<SupersetCompletePageProps> = ({
  superset,
  nextSuperset,
  nextPageHandler,
}) => {
  return (
    <WrapperPage>
      <div className="grid place-content-center gap-3 pt-8">
        <Button className="min-h-11" label={"NEXT"} onClick={nextPageHandler} />
        <div className="grid place-content-center gap-2 shadow-md p-4 py-6 border border-gray-200 dark:border-gray-700 rounded-md bg-success-600">
          <span className="grid place-content-center text-lg text-white">
            {" "}
            SUPERSET COMPLETE{" "}
          </span>
          <span className="grid place-content-center text-2xl text-white font-semibold">
            {superset.name}
          </span>
        </div>
        {nextSuperset && (
          <div className="grid place-content-center gap-4 shadow-md p-4 py-6 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-surface-dark">
            <span className="grid place-content-center text-lg text-text-muted-light dark:text-text-muted-dark">
              {" "}
              NEXT SUPERSET{" "}
            </span>
            <span className="grid place-content-center text-2xl text-text-muted-light dark:text-text-muted-dark leading-none">
              {nextSuperset.name}
            </span>
            <div className="leading-none">
              {nextSuperset.exercises.map((exercise: any, index: number) => (
                <div
                  key={index}
                  className="grid place-content-center text-sm text-text-light dark:text-text-dark"
                >
                  {exercise.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </WrapperPage>
  );
};

export default SupersetCompletePage;
