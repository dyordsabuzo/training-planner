import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthContext from "../context/AuthContext";
import { AllRoutes } from "./AllRoutes";

vi.mock("../common/firebase", () => ({ callFunction: vi.fn(() => new Promise(() => {})) }));

beforeAll(() => {
  window.scrollTo = vi.fn();
});

const renderApp = (isAuthReady: boolean) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthContext.Provider value={{ isAuthReady, user: null, orgs: [] } as any}>
        <AllRoutes />
      </AuthContext.Provider>
    </QueryClientProvider>
  );

describe("AllRoutes while auth is restoring", () => {
  afterEach(cleanup);

  it("shows a loader, not the landing page", () => {
    renderApp(false);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Get started" })).toBeNull();
  });

  it("routes once auth is ready", () => {
    renderApp(true);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByRole("button", { name: "Get started" })).toBeTruthy();
  });
});
