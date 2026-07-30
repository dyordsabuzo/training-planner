import { UserListing } from "../management/UserListing";
import WrapperPage from "./WrapperPage";

const AdminPage = () => {
  return (
    <WrapperPage className="max-w-4xl">
      <div className="w-full flex flex-col gap-4 pt-4">
        <h1 className="px-2 text-2xl font-bold text-text-light dark:text-text-dark">
          Administration
        </h1>

        <div className="w-full px-2">
          <UserListing />
        </div>
      </div>
    </WrapperPage>
  );
};

export default AdminPage;
