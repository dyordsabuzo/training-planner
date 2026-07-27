import WrapperPage from "./WrapperPage";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import { Loading } from "./helpers/Loading";
import { Link } from "react-router";

const linkClassName =
  "font-bold text-primary hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded";

export const Home = () => {
  const authContext = useContext(AuthContext);
  const { user, userPermission, isLoading } = authContext;
  const { role, plans = [] } = userPermission || {};

  if (isLoading) {
    return <Loading />;
  }

  if (role === "admin") {
    return (
      <WrapperPage>
        <div className="flex flex-col pt-6 w-full px-8 justify-left relative">
          <h1 className="text-2xl font-bold w-full">
            Welcome to Training Planner
          </h1>
          <p>
            You are logged in as an administrator. You can manage users and
            training programs.
          </p>
          <p>
            <Link to="/training-planner/manage" className={linkClassName}>
              Click here to start managing users and training programs.
            </Link>
          </p>
        </div>
      </WrapperPage>
    );
  }

  return (
    <WrapperPage>
      <div className="flex flex-col pt-6 w-full px-8 justify-left">
        <h1 className="text-2xl font-bold w-full">
          Welcome to Training Planner
        </h1>
        {user && plans.length === 0 && (
          <>
            <p>Thank you for signing up for Training Planner.</p>
            <p>
              In order to start training, you need to be assigned at least one
              training program.
            </p>
            <p>
              Please contact the administrator at{" "}
              <a href="mailto:trainingplanner6@gmail.com" className={linkClassName}>
                trainingplanner6@gmail.com
              </a>{" "}
              to get access to specific training program(s).
            </p>
          </>
        )}
        {plans?.length > 0 && (
          <p>
            Click on{" "}
            <Link to="/training-planner/train" className={linkClassName}>
              Train
            </Link>{" "}
            in the menu bar to start your training program.
          </p>
        )}
        {!user && (
          <p>
            Please{" "}
            <Link to="/login" className={linkClassName}>
              login
            </Link>{" "}
            to start your training program or{" "}
            <Link to="/signup" className={linkClassName}>
              sign up
            </Link>{" "}
            to create an account.
          </p>
        )}
      </div>
    </WrapperPage>
  );
};
