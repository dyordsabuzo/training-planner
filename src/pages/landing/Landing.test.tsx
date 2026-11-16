import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { callFunction } from "../../common/firebase";
import Navigation from "../../components/navigation/Navigation";
import { Landing } from "./Landing";

vi.mock("../../common/firebase", () => ({ callFunction: vi.fn() }));

const items = [
  {
    collection: "plans",
    id: "p1",
    orgId: "o1",
    name: "Summer Strength",
    tags: ["strength"],
    orgName: "Coach Co",
    summary: { weeks: 4, sessions: 3 },
  },
  { collection: "sessions", id: "s1", orgId: "o1", name: "Leg Day", tags: [], orgName: "Coach Co", summary: { exercises: 5 } },
];

const preview = {
  collection: "plans",
  name: "Summer Strength",
  open: false,
  weeks: [{ week: "Week 1" }],
  sessions: [{ name: "Day A", units: [{ name: "Legs", exercises: ["Squat", "Lunge"], sets: 4, reps: 8 }] }],
};

beforeEach(() => {
  // The preview Modal watches its size.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  vi.mocked(callFunction).mockImplementation(async (name: string) =>
    name === "listPublicCatalog" ? { items } : preview
  );
});

const renderAt = (path: string, element = <Landing />) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Navigation />
        <Routes>
          <Route path="/" element={element} />
          <Route path="/login" element={element} />
          <Route path="/training-planner/public/o1/tok" element={<p>public run page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

const sheet = () => screen.getByTestId("auth-sheet");

describe("Landing", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows no menus while signed out at /", () => {
    const { container } = renderAt("/");
    const [sidebar, bottomNav] = Array.from(container.querySelectorAll("nav"));
    expect(sidebar.classList.contains("lg:flex")).toBe(false);
    expect(bottomNav.parentElement!.classList.contains("max-h-0")).toBe(true);
  });

  it("slides the auth panel in from the mobile CTA, and back out", () => {
    renderAt("/");
    expect(sheet().classList.contains("translate-x-full")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    expect(sheet().classList.contains("translate-x-full")).toBe(false);
    expect(within(sheet()).getByRole("heading", { name: "Sign up" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(sheet().classList.contains("translate-x-full")).toBe(true);
  });

  it("opens the panel straight away on /login", () => {
    renderAt("/login", <Landing initialPanel="login" open />);
    expect(sheet().classList.contains("translate-x-full")).toBe(false);
    expect(within(sheet()).getByRole("heading", { name: "Log in" })).toBeTruthy();
  });

  it("switches between the Log in and Sign up tabs", () => {
    renderAt("/");
    const tabs = within(sheet()).getByRole("group", { name: "Log in or sign up" });
    fireEvent.click(within(tabs).getByRole("button", { name: "Sign up" }));
    expect(within(sheet()).getByRole("heading", { name: "Sign up" })).toBeTruthy();
    fireEvent.click(within(tabs).getByRole("button", { name: "Log in" }));
    expect(within(sheet()).getByRole("heading", { name: "Log in" })).toBeTruthy();
  });

  it("offers Google on both tabs", () => {
    renderAt("/");
    expect(within(sheet()).getByRole("button", { name: "Sign in with Google" })).toBeTruthy();
    fireEvent.click(within(sheet()).getByRole("button", { name: "Sign up" }));
    expect(within(sheet()).getByRole("button", { name: "Sign up with Google" })).toBeTruthy();
  });

  it("lists public items, previews one, and leads to sign-up", async () => {
    renderAt("/");
    fireEvent.click(await screen.findByRole("button", { name: /Summer Strength/ }));
    expect(screen.getByText("4 weeks · 3 sessions")).toBeTruthy();
    expect(await screen.findByText("Squat, Lunge")).toBeTruthy();
    expect(callFunction).toHaveBeenCalledWith("getPublicPreview", { orgId: "o1", collection: "plans", id: "p1" });

    fireEvent.click(screen.getByRole("button", { name: "Sessions" }));
    expect(screen.getByRole("button", { name: /Leg Day/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Sign up to use" }));
    expect(screen.queryByText("Squat, Lunge")).toBeNull();
    expect(sheet().classList.contains("translate-x-full")).toBe(false);
    expect(within(sheet()).getByRole("heading", { name: "Sign up" })).toBeTruthy();
  });

  it("starts the workout through its public link when there is one", async () => {
    vi.mocked(callFunction).mockImplementation(async (name: string) =>
      name === "listPublicCatalog" ? { items } : { ...preview, publicLinkToken: "tok" }
    );
    renderAt("/");
    fireEvent.click(await screen.findByRole("button", { name: /Summer Strength/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Start workout" }));
    expect(await screen.findByText("public run page")).toBeTruthy();
  });

  it("hides the catalog when the call fails", async () => {
    vi.mocked(callFunction).mockRejectedValue(new Error("nope"));
    renderAt("/");
    expect(await screen.findByRole("heading", { name: /Plan smarter/ })).toBeTruthy();
    await vi.waitFor(() => expect(screen.queryByLabelText("Loading public workouts")).toBeNull());
    expect(screen.queryByRole("region", { name: "Public workouts" })).toBeNull();
  });
});
