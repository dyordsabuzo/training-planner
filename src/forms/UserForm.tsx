import React, { useContext, useState } from "react";
import { Modal } from "../components/others/Modal";
import { DetailField } from "./DetailField";
import { Input } from "../components/form/Input";
import { Toggle } from "../components/others/Toggle";
import { MultiSelect } from "../components/form/MultiSelect";
import { FormButtons } from "./FormButtons";
import { useEntityForm } from "./useEntityForm";
import SourceDataContext from "../context/SourceDataContext";
import AuthContext from "../context/AuthContext";
import { AppUser } from "../context/UserManagementContext";
import { getDisplayName } from "../common/utils";

type Props = {
  data: AppUser;
  closeForm: () => void;
  onSave: (data: AppUser) => void;
};

// Admin-only: edit an existing registered user's profile, role, and granted
// plan access. Email/first/last name here only edit the Firestore *cache*
// of that data (used for display) — not the person's real Firebase Auth
// login credential — which makes this the tool for backfilling a doc that's
// missing fields (e.g. one created before auto-provisioning existed).
// There's no "delete" here — removing a Firebase Auth account requires the
// Admin SDK, which this client-only app doesn't have.
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

  const [email, setEmail] = useState(data.email ?? "");
  const [firstName, setFirstName] = useState(data.firstName ?? "");
  const [lastName, setLastName] = useState(data.lastName ?? "");
  const [role, setRole] = useState(data.role ?? "user");
  const [planNames, setPlanNames] = useState<string[]>(toPlanNames(data.plans ?? []));

  const authContext = useContext(AuthContext);
  const isSelf = authContext.getUid() === data.id;

  const resetFields = () => {
    setEmail(data.email ?? "");
    setFirstName(data.firstName ?? "");
    setLastName(data.lastName ?? "");
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
    onSave({ ...data, email, firstName, lastName, role, plans: planIds });
    setIsEditing(false);
  };

  const roleLabel = role === "admin" ? "Admin" : "User";

  return (
    <Modal
      title={getDisplayName(data.firstName, data.lastName, data.email)}
      isOpen={true}
      onClose={closeForm}
      headerAction={headerAction}
    >
      {!isEditing ? (
        <div className="flex flex-col gap-4">
          <DetailField label="Email" value={data.email} />
          <DetailField label="First name" value={data.firstName} />
          <DetailField label="Last name" value={data.lastName} />
          <DetailField label="Role" value={roleLabel} />
          <DetailField label="Granted plans" tags={planNames} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" value={email} placeholder="Email" changeValue={setEmail} />
          <Input label="First name" value={firstName} placeholder="First name" changeValue={setFirstName} />
          <Input label="Last name" value={lastName} placeholder="Last name" changeValue={setLastName} />

          {isSelf ? (
            <div>
              <DetailField label="Role" value={roleLabel} />
              <p className="mt-1 text-xs text-text-muted-light/70 dark:text-text-muted-dark/70">
                You can't change your own role.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Toggle
                label="Admin access"
                value={role === "admin"}
                toggle={(value) => setRole(value ? "admin" : "user")}
              />
              <span className="text-sm font-medium text-text-light dark:text-text-dark">
                {roleLabel}
              </span>
            </div>
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
