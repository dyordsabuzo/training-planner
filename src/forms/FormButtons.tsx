
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { Button } from "@dyordsabuzo/ui-components";

type Props = {
  onCancel?: () => void;
  onDelete?: () => void;
};
export const FormButtons = ({ onCancel, onDelete }: Props) => {
  return (
    <div className={`flex justify-between gap-2 py-4`}>
      <div className={`flex gap-2`}>
        <Button label={"Save"} type="submit" decoration="save" />
        <Button label={"Cancel"} decoration="cancel" onClick={onCancel} />
      </div>
      {onDelete && <ConfirmDeleteButton onDelete={onDelete} />}
    </div>
  );
};
