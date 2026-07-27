import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
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
import SidebarContext from "../context/SidebarContext";
import { AUTH_ROUTES } from "./authRoutes";

const AppShell = () => {
  const authContext = useContext(AuthContext);
  const { user } = authContext;
  const { isCollapsed } = useContext(SidebarContext);
  const location = useLocation();
  const isAuthRoute = AUTH_ROUTES.includes(location.pathname);

  return (
    <>
      <Navigation />
      <div
        className={`transition-[padding] duration-200 ease-in-out ${
          isAuthRoute ? "" : isCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
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
            path={"/training-planner/train/:sessionId"}
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
      </div>
    </>
  );
};

export const AllRoutes = () => {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
};
