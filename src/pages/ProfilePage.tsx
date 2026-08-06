import { useContext, useState } from "react";
import WrapperPage from "./WrapperPage";
import AuthContext from "../context/AuthContext";

import { DetailField } from "../forms/DetailField";
import { Input, Button } from "@dyordsabuzo/ui-components";

const ProfilePage = () => {
  const { user, userPermission, updateProfile } = useContext(AuthContext);
  const [firstName, setFirstName] = useState(userPermission?.firstName ?? "");
  const [lastName, setLastName] = useState(userPermission?.lastName ?? "");
  const [justSaved, setJustSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateProfile({ firstName, lastName });
    setJustSaved(true);
  };

  return (
    <WrapperPage>
      <div className="w-full flex flex-col gap-4 pt-4">
        <h1 className="px-2 text-2xl font-bold text-text-light dark:text-text-dark">
          Profile
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-2">
          <DetailField label="Email" value={user?.email} />

          <Input
            label="First name"
            value={firstName}
            placeholder="First name"
            changeValue={(value) => {
              setFirstName(value);
              setJustSaved(false);
            }}
          />

          <Input
            label="Last name"
            value={lastName}
            placeholder="Last name"
            changeValue={(value) => {
              setLastName(value);
              setJustSaved(false);
            }}
          />

          <div className="flex items-center gap-3">
            <Button type="submit" label="Save" />
            {justSaved && (
              <span className="text-xs text-success-700 dark:text-success-500">
                Saved.
              </span>
            )}
          </div>
        </form>
      </div>
    </WrapperPage>
  );
};

export default ProfilePage;
