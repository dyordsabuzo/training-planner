import { useContext, useEffect } from "react";
import AuthContext from "../../context/AuthContext";
import { useNavigate } from "react-router";

export const Logout = () => {
  const authContext = useContext(AuthContext);
  const { logoutUser } = authContext;

  const navigate = useNavigate();

  useEffect(() => {
    logoutUser();
    navigate("/");
  }, []);

  return <div>Logout</div>;
};
