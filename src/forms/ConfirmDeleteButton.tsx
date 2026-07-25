import { useState } from "react";
import { Button } from "../components/form/Button";

type Props = {
  onDelete: () => void;
  label?: string;
};

export const ConfirmDeleteButton = ({ onDelete, label = "Delete" }: Props) => {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm text-danger">
          Are you sure? This can't be undone.
        </span>
        <div className="flex gap-2">
          <Button label={"Yes, delete"} decoration="delete" onClick={onDelete} />
          <Button
            label={"Cancel"}
            decoration="cancel"
            onClick={() => setConfirming(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <Button label={label} decoration="delete" onClick={() => setConfirming(true)} />
  );
};
