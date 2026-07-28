import { useState } from "react";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "../components/form/Button";
import { Modal } from "../components/others/Modal";

type Props = {
  onDelete: () => void;
  label?: string;
  icon?: IconDefinition;
  decoration?: string;
  useModal?: boolean;
};

export const ConfirmDeleteButton = ({
  onDelete,
  label = "Delete",
  icon,
  decoration = "delete",
  useModal = false,
}: Props) => {
  const [confirming, setConfirming] = useState(false);

  const confirmMessage = "Are you sure? This can't be undone.";

  const confirmActions = (
    <div className={useModal ? "flex justify-end gap-2" : "flex gap-2"}>
      <Button
        label={"Cancel"}
        decoration="cancel"
        onClick={() => setConfirming(false)}
      />
      <Button
        label={`Yes, ${label.toLowerCase()}`}
        decoration="delete"
        onClick={onDelete}
      />
    </div>
  );

  if (useModal) {
    return (
      <>
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
        <Modal
          title={label}
          isOpen={confirming}
          onClose={() => setConfirming(false)}
        >
          <div className="flex flex-col gap-4">
            <span className="text-sm text-text-light dark:text-text-dark">
              {confirmMessage}
            </span>
            {confirmActions}
          </div>
        </Modal>
      </>
    );
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm text-danger">{confirmMessage}</span>
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
