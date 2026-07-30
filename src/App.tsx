import React from "react";
import "./App.css";
import { SessionContextProvider } from "./context/SessionContext";
import { SourceDataContextProvider } from "./context/SourceDataContext";
import { UserManagementContextProvider } from "./context/UserManagementContext";
import { AuthContextProvider } from "./context/AuthContext";
import { ThemeContextProvider } from "./context/ThemeContext";
import { SidebarContextProvider } from "./context/SidebarContext";
import { AllRoutes } from "./routes/AllRoutes";

function App() {
  return (
    <div className={`w-full bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark min-h-screen`}>
      <ThemeContextProvider>
        <SidebarContextProvider>
          <AuthContextProvider>
            <SessionContextProvider>
              <SourceDataContextProvider>
                <UserManagementContextProvider>
                  <AllRoutes />
                </UserManagementContextProvider>
              </SourceDataContextProvider>
            </SessionContextProvider>
          </AuthContextProvider>
        </SidebarContextProvider>
      </ThemeContextProvider>
    </div>
  );
}

export default App;
