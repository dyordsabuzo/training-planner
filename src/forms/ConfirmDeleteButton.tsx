import { useState } from "react";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "../components/form/Button";

type Props = {
  onDelete: () => void;
  label?: string;
  icon?: IconDefinition;
  decoration?: string;
};

export const ConfirmDeleteButton = ({
  onDelete,
  label = "Delete",
  icon,
  decoration = "delete",
}: Props) => {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm text-danger">
          Are you sure? This can't be undone.
        </span>
        <div className="flex gap-2">
          <Button
            label={`Yes, ${label.toLowerCase()}`}
            decoration="delete"
            onClick={onDelete}
          />
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
    <Button decoration={decoration} onClick={() => setConfirming(true)}>
      {icon ? (
        <span className="flex items-center gap-2">
          <FontAwesomeIcon icon={icon} />
          {label}
        </span>
      ) : (
        label
      )}
    </Button>
  );
};
