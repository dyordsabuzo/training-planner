import { useEffect, useState } from "react";
import { Button, Modal } from "@dyordsabuzo/ui-components";
import { DecimalIncrementDecrement } from "../../components/others/DecimalIncrementDecrement";
import { useScrollToTopOnClose } from "../../common/useScrollToTopOnClose";

export type Targets = {
  targetWeight: number;
  // Only one of these is set: distance groups use metres instead of reps.
  targetRep?: number;
  targetDistance?: number;
};

type Props = {
  isOpen: boolean;
  exerciseName: string;
  targetWeight: string;
  targetRep: string;
  // Set for distance groups; replaces reps with metres (as ExerciseDetails does).
  targetDistance?: string;
  onConfirm: (targets: Targets) => void;
  onClose: () => void;
};

// Asked before set 1 of each exercise so the targets are set up front rather
// than adjusted after the fact. Same large editors as the exercise page's
// tap-to-adjust modal.
export const TargetWeightPrompt = ({
  isOpen,
  exerciseName,
  targetWeight,
  targetRep,
  targetDistance,
  onConfirm,
  onClose,
}: Props) => {
  const isDistance = targetDistance !== undefined;
  const [weight, setWeight] = useState(Number(targetWeight) || 0);
  const [second, setSecond] = useState(
    Number(isDistance ? targetDistance : targetRep) || 1
  );
  useScrollToTopOnClose(isOpen);

  useEffect(() => {
    if (isOpen) {
      setWeight(Number(targetWeight) || 0);
      setSecond(Number(isDistance ? targetDistance : targetRep) || 1);
    }
  }, [isOpen, exerciseName, targetWeight, targetRep, targetDistance, isDistance]);

  return (
    <Modal
      title={`TARGETS`}
      titleClassName="text-xl font-bold"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <DecimalIncrementDecrement
          label="Weight"
          unit="kg"
          nonZero
          fullWidth
          large
          value={weight}
          updateValue={setWeight}
        />
        <DecimalIncrementDecrement
          label={isDistance ? "Distance" : "Reps"}
          unit={isDistance ? "m" : "reps"}
          step={1}
          min={1}
          fullWidth
          large
          value={second}
          updateValue={setSecond}
        />
        <div className="flex">
          <Button
            label="START"
            className="w-full"
            onClick={() =>
              onConfirm({
                targetWeight: weight,
                ...(isDistance ? { targetDistance: second } : { targetRep: second }),
              })
            }
          />
        </div>
      </div>
    </Modal>
  );
};
