import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Navigation from "../components/navigation/Navigation";
import ErrorPage from "../pages/ErrorPage";
import ListingPage from "../pages/ListingPage";
import SessionPage from "../pages/SessionPage";
import { Login } from "../pages/auth/Login";
import { ForgotPassword } from "../pages/auth/ForgotPassword";
import { PasswordReset } from "../pages/auth/PasswordReset";
import { Logout } from "../pages/auth/Logout";
import { Signup } from "../pages/auth/Signup";
import { Home } from "../pages/Home";
import { MainPage } from "../pages/MainPage";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

export const AllRoutes = () => {
  const authContext = useContext(AuthContext);
  const { user } = authContext;

  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path={"/*"} element={<Home />} errorElement={<ErrorPage />} />
        <Route
          path={"/training-planner"}
          element={user ? <MainPage /> : <Navigate to="/" />}
          errorElement={<ErrorPage />}
        />
        <Route
          path={"/training-planner/manage"}
          element={
            user ? <ListingPage list={"exercises"} /> : <Navigate to="/" />
          }
          errorElement={<ErrorPage />}
        />
        <Route
          path={"/training-planner/train"}
          element={user ? <SessionPage /> : <Navigate to="/" />}
          errorElement={<ErrorPage />}
        />
        <Route
          path={"/login"}
          element={<Login />}
          errorElement={<ErrorPage />}
        />
        <Route
          path={"/signup"}
          element={<Signup />}
          errorElement={<ErrorPage />}
        />
        <Route
          path={"/forgot-password"}
          element={<ForgotPassword />}
          errorElement={<ErrorPage />}
        />
        <Route
          path={"/password-reset"}
          element={<PasswordReset />}
          errorElement={<ErrorPage />}
        />
        <Route
          path={"/logout"}
          element={<Logout />}
          errorElement={<ErrorPage />}
        />
      </Routes>
    </BrowserRouter>
  );
};
