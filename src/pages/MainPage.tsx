import { useContext, useEffect } from "react";
import WrapperPage from "./WrapperPage";
import { useNavigate } from "react-router";
import AuthContext from "../context/AuthContext";

type Props = {
  listing?: string;
};

export const MainPage = ({ listing }: Props) => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const { user, userPermission } = authContext;

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <WrapperPage>
      <div className={`grid place-content-center pt-12 gap-2`}>
        <button
          type={"button"}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-6 px-2 rounded"
          onClick={() => {
            navigate("/training-planner/train");
          }}
        >
          START TRAINING
        </button>

        {userPermission?.role === "admin" && (
          <button
            type={"button"}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-6 px-4 rounded"
            onClick={() => {
              navigate("/training-planner/manage");
            }}
          >
            Manage Training Setup
          </button>
        )}
      </div>
    </WrapperPage>
  );
};
