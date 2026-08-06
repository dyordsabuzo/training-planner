import React, { useContext, useState } from "react";

import { FormButtons } from "./FormButtons";
import SourceDataContext from "../context/SourceDataContext";
import { AppUser } from "../context/UserManagementContext";
import { Modal, Input, ButtonSelection, MultiSelect } from "@dyordsabuzo/ui-components";

type Props = {
  existingIds: string[];
  closeForm: () => void;
  onSave: (data: AppUser) => void;
};

// Repairs a Firebase Auth account that has no users/{uid} Firestore doc at
// all — e.g. created directly in the console, or the browser was closed
// before the app finished auto-provisioning it on first login. The admin
// supplies the UID (copied from Firebase Console → Authentication → Users)
// since looking up an Auth account by email requires the Admin SDK, which
// this client-only app doesn't have.
export const AddUserForm = ({ existingIds, closeForm, onSave }: Props) => {
  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;
  const planEntries = Object.entries(sourceData.plans ?? {}) as [string, any][];
  const planIdByName = Object.fromEntries(planEntries.map(([name, plan]) => [name, plan.id]));

  const [uid, setUid] = useState("");
  const [uidError, setUidError] = useState<string>();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("user");
  const [planNames, setPlanNames] = useState<string[]>([]);

  const roleLabel = role === "admin" ? "Admin" : "User";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedUid = uid.trim();

    if (!trimmedUid) {
      setUidError("Firebase Auth UID is required.");
      return;
    }
    if (existingIds.includes(trimmedUid)) {
      setUidError("A user with this ID already exists — edit them from the list instead.");
      return;
    }
    setUidError(undefined);

    const planIds = planNames.map((name) => planIdByName[name]).filter(Boolean);
    onSave({ id: trimmedUid, email, firstName, lastName, role, plans: planIds });
  };

  return (
    <Modal title="Add missing user" isOpen={true} onClose={closeForm}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-xs text-text-muted-light/70 dark:text-text-muted-dark/70">
          Use this when a Firebase Auth account has no profile doc yet — e.g.
          it was created directly in the console, or the app never finished
          provisioning it. Copy the UID from Firebase Console → Authentication.
        </p>

        <Input
          label="Firebase Auth UID"
          required
          value={uid}
          placeholder="e.g. aBc123XyZ..."
          error={uidError}
          changeValue={setUid}
        />
        <Input label="Email" value={email} placeholder="Email" changeValue={setEmail} />
        <Input label="First name" value={firstName} placeholder="First name" changeValue={setFirstName} />
        <Input label="Last name" value={lastName} placeholder="Last name" changeValue={setLastName} />

        <ButtonSelection
          label="Role"
          options={["User", "Admin"]}
          selection={roleLabel}
          onSelect={(value) => setRole(value === "Admin" ? "admin" : "user")}
        />

        <MultiSelect
          label={"Granted plans"}
          selected={planNames}
          options={Object.keys(sourceData.plans ?? {})}
          onChange={setPlanNames}
          placeholder="Select plans"
        />

        <FormButtons onCancel={closeForm} />
      </form>
    </Modal>
  );
};
