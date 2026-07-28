import { WatchVideo } from "../../components/others/WatchVideo";
import { Widget } from "../../components/others/Widget";
import { IncrementDecrement } from "../../components/others/IncrementDecrement";
import { Button } from "../../components/form/Button";

type Props = {
  name: string;
  videoLink?: string;
  type: string;
  targetWeight: string;
  targetRep: string;
  targetTime?: string;
  exerciseLabel?: string;
  transitionKey?: string | number;
  updateSupersetData: (value: any) => void;
  completeExercise: () => void;
};

export const ExerciseDetails = ({
  name,
  videoLink,
  type,
  targetWeight,
  targetRep,
  targetTime = "0",
  exerciseLabel,
  transitionKey,
  updateSupersetData,
  completeExercise,
}: Props) => {
  return (
    <div className="flex-1 flex flex-col justify-between gap-4">
      <div
        key={transitionKey ?? name}
        className="flex-1 flex flex-col gap-4 animate-exercise-enter"
      >
        <div className="flex flex-col items-center gap-3 leading-none pt-4 px-4">
          {exerciseLabel && (
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
              {exerciseLabel}
            </span>
          )}
          <span className="text-center font-semibold text-3xl w-full break-words text-wrap text-text-light dark:text-text-dark">
            {name}
          </span>
          {videoLink && <WatchVideo videoLink={videoLink} />}
        </div>

        {type !== "Time-based" && (
          <div className="grid grid-cols-2 gap-2 px-3 sm:gap-6 sm:px-6">
            <IncrementDecrement
              label="Weight"
              labelDirection="col"
              unit="kg"
              nonZero
              fullWidth
              value={Number(targetWeight) || 0}
              updateValue={(v: number) => {
                updateSupersetData({ targetWeight: v });
              }}
            />
            <IncrementDecrement
              label="Reps"
              labelDirection="col"
              unit="reps"
              nonZero
              fullWidth
              value={Number(targetRep) || 0}
              updateValue={(v: number) => {
                updateSupersetData({ targetRep: v });
              }}
            />
          </div>
        )}
        {type === "Time-based" && (
          <div className="grid grid-cols-1 gap-2 px-4 sm:px-6">
            <Widget
              label={"Target Time"}
              value={targetTime}
              unit={"secs"}
              editable={false}
            />
          </div>
        )}
      </div>
      <Button
        className="col-span-2 min-h-11 mx-4 mb-2 sm:mx-6"
        onClick={completeExercise}
        label="Done"
      />
    </div>
  );
};
