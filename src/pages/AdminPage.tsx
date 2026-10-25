import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import { UserListing } from "../management/UserListing";
import { AppSettingsForm } from "../management/AppSettingsForm";
import WrapperPage from "./WrapperPage";

const AdminPage = () => {
  // App-wide settings are for the platform admin; trainers manage their org's users.
  const { isSuperAdmin } = useContext(AuthContext);
  return (
    <WrapperPage className="max-w-4xl">
      <div className="w-full flex flex-col gap-4 pt-4">
        <h1 className="px-2 text-2xl font-bold text-text-light dark:text-text-dark">
          Administration
        </h1>

        {isSuperAdmin && (
          <div className="w-full px-2">
            <AppSettingsForm />
          </div>
        )}

        <div className="w-full px-2">
          <UserListing />
        </div>
      </div>
    </WrapperPage>
  );
};

export default AdminPage;
