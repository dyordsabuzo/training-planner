import WrapperPage from "./WrapperPage";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import { Loading } from "./helpers/Loading";
import { useNavigate } from "react-router";

export const Home = () => {
  const authContext = useContext(AuthContext);
  const { user, userPermission, isLoading } = authContext;
  const { role, plans = [] } = userPermission || {};
  const navigate = useNavigate();

  if (isLoading) {
    return <Loading />;
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
              training program. Access to the training programs is restricted to
              users with an active subscription.
            </p>
            <p>
              Please contact the administrator at{" "}
              <a href="mailto:trainingplanner6@gmail.com">
                trainingplanner6@gmail.com
              </a>{" "}
              to get access to specific training program(s).
            </p>
          </>
        )}
        {plans?.length > 0 && (
          <p>
            Click on{" "}
            <span className="font-bold cursor-pointer text-blue-500">
              Train
            </span>{" "}
            in the menu bar to start your training program.
          </p>
        )}
        {!user && (
          <p>
            Please{" "}
            <span
              className="font-bold cursor-pointer text-blue-500"
              onClick={() => navigate("/login")}
            >
              login
            </span>{" "}
            to start your training program or{" "}
            <span
              className="font-bold cursor-pointer text-blue-500"
              onClick={() => navigate("/signup")}
            >
              sign up
            </span>{" "}
            to create an account.
          </p>
        )}
      </div>
    </WrapperPage>
  );
};
