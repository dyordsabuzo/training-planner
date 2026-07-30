import { useState } from "react";
import { EditIconButton } from "./EditIconButton";

type Options = {
  type: string;
  resetFields: () => void;
  onDelete: () => void;
  closeForm: () => void;
};

// Extracts the view/edit toggle skeleton shared byte-for-byte across all 4
// entity forms (Exercise/Superset/Session/Plan): "add" starts already
// editing, "edit" starts read-only with a pencil icon to switch into edit
// mode, Cancel resets fields and returns to read-only rather than closing.
export const useEntityForm = ({ type, resetFields, onDelete, closeForm }: Options) => {
  const [isEditing, setIsEditing] = useState(type !== "edit");

  const handleCancel = () => {
    if (type === "edit") {
      resetFields();
      setIsEditing(false);
    } else {
      closeForm();
    }
  };

  const handleDelete = () => {
    onDelete();
    closeForm();
  };

  const headerAction =
    type === "edit" && !isEditing ? (
      <EditIconButton onClick={() => setIsEditing(true)} />
    ) : undefined;

  return { isEditing, setIsEditing, headerAction, handleCancel, handleDelete };
};
