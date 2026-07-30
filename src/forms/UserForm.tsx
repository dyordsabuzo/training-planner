import React, { useContext, useState } from "react";
import { Modal } from "../components/others/Modal";
import { DetailField } from "./DetailField";
import { ButtonSelection } from "../components/form/ButtonSelection";
import { MultiSelect } from "../components/form/MultiSelect";
import { FormButtons } from "./FormButtons";
import { useEntityForm } from "./useEntityForm";
import SourceDataContext from "../context/SourceDataContext";
import AuthContext from "../context/AuthContext";
import { AppUser } from "../context/UserManagementContext";

type Props = {
  data: AppUser;
  closeForm: () => void;
  onSave: (data: AppUser) => void;
};

// Admin-only: edit an existing registered user's role and granted plan
// access. There's no "add" or "delete" here — creating a Firebase Auth
// account or removing one both require the Admin SDK, which this
// client-only app doesn't have. Users must sign up themselves first.
export const UserForm = ({ data, closeForm, onSave }: Props) => {
  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  // `data.plans` (as stored on users/{uid} and as used by SourceDataContext's
  // access filter) is a list of plan doc IDs — but a human picks plans by
  // name. Resolve id<->name at this boundary: local state stays names (for
  // the MultiSelect and the view-mode display), and we convert back to ids
  // only when saving.
  const planEntries = Object.entries(sourceData.plans ?? {}) as [string, any][];
  const planIdByName = Object.fromEntries(planEntries.map(([name, plan]) => [name, plan.id]));
  const planNameById = Object.fromEntries(planEntries.map(([name, plan]) => [plan.id, name]));
  const toPlanNames = (planIds: string[]) => planIds.map((id) => planNameById[id] ?? id);

  const [role, setRole] = useState(data.role ?? "user");
  const [planNames, setPlanNames] = useState<string[]>(toPlanNames(data.plans ?? []));

  const authContext = useContext(AuthContext);
  const isSelf = authContext.getUid() === data.id;

  const resetFields = () => {
    setRole(data.role ?? "user");
    setPlanNames(toPlanNames(data.plans ?? []));
  };

  const { isEditing, setIsEditing, headerAction, handleCancel } = useEntityForm({
    type: "edit",
    resetFields,
    onDelete: () => {},
    closeForm,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const planIds = planNames.map((name) => planIdByName[name]).filter(Boolean);
    onSave({ ...data, role, plans: planIds });
    setIsEditing(false);
  };

  const roleLabel = role === "admin" ? "Admin" : "User";

  return (
    <Modal
      title={data.displayName || data.email || "User"}
      isOpen={true}
      onClose={closeForm}
      headerAction={headerAction}
    >
      {!isEditing ? (
        <div className="flex flex-col gap-4">
          <DetailField label="Email" value={data.email} />
          {data.displayName && <DetailField label="Name" value={data.displayName} />}
          <DetailField label="Role" value={roleLabel} />
          <DetailField label="Granted plans" tags={planNames} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DetailField label="Email" value={data.email} />

          {isSelf ? (
            <div>
              <DetailField label="Role" value={roleLabel} />
              <p className="mt-1 text-xs text-text-muted-light/70 dark:text-text-muted-dark/70">
                You can't change your own role.
              </p>
            </div>
          ) : (
            <ButtonSelection
              label="Role"
              options={["User", "Admin"]}
              selection={roleLabel}
              onSelect={(value) => setRole(value === "Admin" ? "admin" : "user")}
            />
          )}

          <MultiSelect
            label={"Granted plans"}
            selected={planNames}
            options={Object.keys(sourceData.plans ?? {})}
            onChange={setPlanNames}
            placeholder="Select plans"
          />

          <FormButtons onCancel={handleCancel} />
        </form>
      )}
    </Modal>
  );
};
