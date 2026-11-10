import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDoc } from "firebase/firestore";
import PublicPlanPage from "./PublicPlanPage";

vi.mock("firebase/firestore", async (original) => ({ ...(await original<object>()), getDoc: vi.fn() }));
vi.mock("../common/publicPlansDb", () => ({ publicPlanRef: () => ({}) }));

beforeAll(() => {
  window.scrollTo = vi.fn();
});

const session = (name: string) => ({
  name,
  units: [{ name: "Legs", exercises: [{ exercise: { name: "Squat" }, targetWeight: 0 }] }],
});

const renderPage = (data: any) => {
  vi.mocked(getDoc).mockResolvedValue({ data: () => data } as any);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/training-planner/public/org/token"]}>
        <Routes>
          <Route path="/training-planner/public/:orgId/:token" element={<PublicPlanPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("PublicPlanPage", () => {
  afterEach(cleanup);

  it("opens a shared session straight away, with no way back to an empty list", async () => {
    renderPage({ name: "Day A", open: true, sessions: [session("Day A")] });
    expect(await screen.findByRole("button", { name: "Start workout" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  it("lists the sessions of a plan", async () => {
    renderPage({ name: "Strength", open: true, sessions: [session("Day A"), session("Day B")] });
    expect(await screen.findByText("Day B")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Start workout" })).toBeNull();
  });

  it("shows a week picker on a weekly plan, even with one session", async () => {
    renderPage({ name: "Strength", open: false, weeks: { "Week 1": {}, "Week 2": {} }, sessions: [session("Day A")] });
    expect(await screen.findByRole("button", { name: "Week 2" })).toBeTruthy();
  });

  it("says when a link is no longer available", async () => {
    renderPage(undefined);
    expect(await screen.findByText(/isn't available/)).toBeTruthy();
  });
});
