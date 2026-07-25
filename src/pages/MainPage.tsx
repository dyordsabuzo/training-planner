import { useContext, useEffect } from "react";
import WrapperPage from "./WrapperPage";
import { useNavigate } from "react-router";
import AuthContext from "../context/AuthContext";
import { Button } from "../components/form/Button";

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
        <Button
          className="py-6 px-2"
          label="START TRAINING"
          onClick={() => {
            navigate("/training-planner/train");
          }}
        />

        {userPermission?.role === "admin" && (
          <Button
            className="py-6 px-4"
            label="Manage Training Setup"
            onClick={() => {
              navigate("/training-planner/manage");
            }}
          />
        )}
      </div>
    </WrapperPage>
  );
};
