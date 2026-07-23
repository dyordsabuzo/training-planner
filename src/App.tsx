import React from "react";
import "./App.css";
import { SessionContextProvider } from "./context/SessionContext";
import { SourceDataContextProvider } from "./context/SourceDataContext";
import { AuthContextProvider } from "./context/AuthContext";
import { AllRoutes } from "./routes/AllRoutes";

function App() {
  return (
    <div className={`w-full`}>
      <AuthContextProvider>
        <SessionContextProvider>
          <SourceDataContextProvider>
            <AllRoutes />
          </SourceDataContextProvider>
        </SessionContextProvider>
      </AuthContextProvider>
    </div>
  );
}

export default App;
