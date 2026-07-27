/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useEffect } from "react";
import AuthContext from "../../context/AuthContext";
import { useNavigate } from "react-router";

export const Logout = () => {
  const authContext = useContext(AuthContext);
  const { user, logoutUser } = authContext;

  const navigate = useNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    logoutUser();
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center text-text-light dark:text-text-dark">
      Logging out...
    </div>
  );
};
