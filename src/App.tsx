import React from "react";
import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionContextProvider } from "./context/SessionContext";
import { SourceDataContextProvider } from "./context/SourceDataContext";
import { UserManagementContextProvider } from "./context/UserManagementContext";
import { AuthContextProvider } from "./context/AuthContext";
import { ThemeContextProvider } from "./context/ThemeContext";
import { SidebarContextProvider } from "./context/SidebarContext";
import { AllRoutes } from "./routes/AllRoutes";

// Firestore reads aren't free and mutations already write straight into the
// query cache, so a background refetch-on-focus buys no extra correctness —
// only cost. A 5 minute staleTime means revisiting a page (Manage, Home, ...)
// serves cached data instantly instead of re-fetching every collection.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <div className={`w-full bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark min-h-screen`}>
      <QueryClientProvider client={queryClient}>
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
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </div>
  );
}

export default App;
