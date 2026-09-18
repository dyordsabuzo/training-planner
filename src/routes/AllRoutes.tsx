import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import Navigation from "../components/navigation/Navigation";
import ErrorPage from "../pages/ErrorPage";
import ListingPage from "../pages/ListingPage";
import AdminPage from "../pages/AdminPage";
import ProfilePage from "../pages/ProfilePage";
import SessionPage from "../pages/SessionPage";
import SimulateSessionPage from "../pages/SimulateSessionPage";
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
  const { user, userPermission, isPreviewingAsUser, setPreviewAsUser } = authContext;
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
        {isPreviewingAsUser && !isAuthRoute && (
          <div className="bg-primary text-white text-sm px-4 py-2 flex flex-wrap items-center justify-center gap-2 text-center">
            <span>Previewing the app as a normal user.</span>
            <button
              type="button"
              onClick={() => setPreviewAsUser(false)}
              className="underline font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
            >
              Exit preview
            </button>
          </div>
        )}
        <Routes>
          <Route
            path={"/*"}
            element={user ? <Home /> : <Navigate to="/login" />}
            errorElement={<ErrorPage />}
          />
          <Route
            path={"/training-planner"}
            element={user ? <MainPage /> : <Navigate to="/login" />}
            errorElement={<ErrorPage />}
          />
          <Route
            path={"/training-planner/manage"}
            element={
              !user ? (
                <Navigate to="/login" />
              ) : userPermission?.role === "admin" ? (
                <ListingPage />
              ) : (
                <Navigate to="/" />
              )
            }
            errorElement={<ErrorPage />}
          />
          <Route
            path={"/training-planner/manage/:tab"}
            element={
              !user ? (
                <Navigate to="/login" />
              ) : userPermission?.role === "admin" ? (
                <ListingPage />
              ) : (
                <Navigate to="/" />
              )
            }
            errorElement={<ErrorPage />}
          />
          <Route
            path={"/training-planner/manage/simulate/:sessionName"}
            element={
              !user ? (
                <Navigate to="/login" />
              ) : userPermission?.role === "admin" ? (
                <SimulateSessionPage />
              ) : (
                <Navigate to="/" />
              )
            }
            errorElement={<ErrorPage />}
          />
          <Route
            path={"/training-planner/admin"}
            element={
              !user ? (
                <Navigate to="/login" />
              ) : userPermission?.role === "admin" ? (
                <AdminPage />
              ) : (
                <Navigate to="/" />
              )
            }
            errorElement={<ErrorPage />}
          />
          <Route
            path={"/training-planner/profile"}
            element={user ? <ProfilePage /> : <Navigate to="/login" />}
            errorElement={<ErrorPage />}
          />
          <Route
            path={"/training-planner/train"}
            element={user ? <SessionPage /> : <Navigate to="/login" />}
            errorElement={<ErrorPage />}
          />
          <Route
            path={"/training-planner/train/:sessionId"}
            element={user ? <SessionPage /> : <Navigate to="/login" />}
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
