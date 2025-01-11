import React from "react";
import "./App.css";
import { SessionContextProvider } from "./context/SessionContext";
import { SourceDataContextProvider } from "./context/SourceDataContext";
import { BrowserRouter, Route, Routes } from "react-router";
import Navigation from "./components/navigation/Navigation";
import { MainPage } from "./pages/MainPage";
import ErrorPage from "./pages/ErrorPage";
import ListingPage from "./pages/ListingPage";
import SessionPage from "./pages/SessionPage";
import { AuthContextProvider } from "./context/AuthContext";
import { Home } from "./pages/Home";
import { Login } from "./pages/auth/Login";
import { Logout } from "./pages/auth/Logout";
import { Signup } from "./pages/auth/Signup";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { PasswordReset } from "./pages/auth/PasswordReset";

function App() {
  return (
    <div className={`w-full`}>
      <AuthContextProvider>
        <SessionContextProvider>
          <SourceDataContextProvider>
            <BrowserRouter>
              <Navigation />
              <Routes>
                <Route
                  path={"/"}
                  element={<Home />}
                  errorElement={<ErrorPage />}
                />
                <Route
                  path={"/training-planner"}
                  element={<MainPage />}
                  errorElement={<ErrorPage />}
                />
                <Route
                  path={"/training-planner/manage"}
                  element={<ListingPage list={"exercises"} />}
                  errorElement={<ErrorPage />}
                />
                <Route
                  path={"/training-planner/train"}
                  element={<SessionPage />}
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
          </SourceDataContextProvider>
        </SessionContextProvider>
      </AuthContextProvider>
    </div>
  );
}

export default App;
