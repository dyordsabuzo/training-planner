import { WatchVideo } from "../../components/others/WatchVideo";
import { Widget } from "../../components/others/Widget";
import { Button } from "../../components/form/Button";

type Props = {
  name: string;
  videoLink?: string;
  type: string;
  targetWeight: string;
  targetRep: string;
  targetTime?: string;
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
  updateSupersetData,
  completeExercise,
}: Props) => {
  return (
    <div className="h-full flex flex-col justify-between gap-4">
      <div className="flex flex-col items-center gap-3 leading-none pt-4 px-4">
        <span className="text-center font-semibold text-3xl w-full break-words text-wrap text-text-light dark:text-text-dark">
          {name}
        </span>
        {videoLink && <WatchVideo videoLink={videoLink} />}
      </div>

      {type !== "Time-based" && (
        <div className="grid grid-cols-2 gap-4 relative">
          <Widget
            label={"Target Weight"}
            value={targetWeight}
            unit={"kg"}
            onValueChange={(v: any) => {
              updateSupersetData({ targetWeight: v });
            }}
          />
          <Widget
            label={"Target Rep"}
            value={targetRep}
            unit={"reps"}
            onValueChange={(v: any) => {
              updateSupersetData({ targetRep: v });
            }}
          />
        </div>
      )}
      {type === "Time-based" && (
        <button
          type="button"
          className="grid grid-cols-1 gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          onClick={() => console.log("time based")}
        >
          <Widget label={"Target Time"} value={targetTime} unit={"secs"} />
        </button>
      )}
      <Button
        className="col-span-2 min-h-11 m-2"
        onClick={completeExercise}
        label="DONE"
      />
    </div>
  );
};
