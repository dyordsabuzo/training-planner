import React, { useEffect } from "react";
import "./App.css";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionContextProvider } from "./context/SessionContext";
import { SourceDataContextProvider } from "./context/SourceDataContext";
import { UserManagementContextProvider } from "./context/UserManagementContext";
import { AuthContextProvider } from "./context/AuthContext";
import { AppSettingsContextProvider } from "./context/AppSettingsContext";
import { ThemeContextProvider } from "./context/ThemeContext";
import { SidebarContextProvider } from "./context/SidebarContext";
import { AllRoutes } from "./routes/AllRoutes";
import { unlockAudioContext } from "./common/utils";
import { CACHE_BUSTER, CACHE_MAX_AGE, queryClient, queryPersister } from "./common/queryCache";

function App() {
  useEffect(() => {
    // Mobile browsers (notably iOS Safari) start a new AudioContext
    // suspended until it's resumed inside a user-gesture handler — resume it
    // on the first tap anywhere in the app so later timer-triggered sounds
    // (rest-timer beep, workout-complete applause) are actually audible.
    document.addEventListener("pointerdown", unlockAudioContext, { once: true });
    return () => document.removeEventListener("pointerdown", unlockAudioContext);
  }, []);

  return (
    <div className={`w-full bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark min-h-screen`}>
      {/* Fetched data is kept on the device, so a reload or app restart shows
          it instantly — with no Firestore reads — even offline. */}
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: CACHE_MAX_AGE,
          buster: CACHE_BUSTER,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) =>
              query.queryKey[0] === "sourceData" && query.state.status === "success",
          },
        }}
      >
        <ThemeContextProvider>
          <SidebarContextProvider>
            <AuthContextProvider>
              <AppSettingsContextProvider>
                <SessionContextProvider>
                  <SourceDataContextProvider>
                    <UserManagementContextProvider>
                      <AllRoutes />
                    </UserManagementContextProvider>
                  </SourceDataContextProvider>
                </SessionContextProvider>
              </AppSettingsContextProvider>
            </AuthContextProvider>
          </SidebarContextProvider>
        </ThemeContextProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </PersistQueryClientProvider>
    </div>
  );
}

export default App;
