import { useEffect, useState } from "react";
import { Button, Modal } from "@dyordsabuzo/ui-components";
import { DecimalIncrementDecrement } from "../../components/others/DecimalIncrementDecrement";

type Props = {
  isOpen: boolean;
  exerciseName: string;
  targetWeight: string;
  onConfirm: (weight: number) => void;
  onClose: () => void;
};

// Asked before set 1 of each exercise so the weight is set up front rather
// than adjusted after the fact.
export const TargetWeightPrompt = ({
  isOpen,
  exerciseName,
  targetWeight,
  onConfirm,
  onClose,
}: Props) => {
  const [weight, setWeight] = useState(Number(targetWeight) || 0);

  useEffect(() => {
    if (isOpen) {
      setWeight(Number(targetWeight) || 0);
    }
  }, [isOpen, exerciseName, targetWeight]);

  return (
    <Modal title={`Target weight — ${exerciseName}`} isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <DecimalIncrementDecrement
          label="Weight"
          unit="kg"
          nonZero
          fullWidth
          value={weight}
          updateValue={setWeight}
        />
        <div className="flex justify-end">
          <Button label="Start set 1" onClick={() => onConfirm(weight)} />
        </div>
      </div>
    </Modal>
  );
};
