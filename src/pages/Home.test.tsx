import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router";
import dayjs from "dayjs";
import AuthContext from "../context/AuthContext";
import SourceDataContext from "../context/SourceDataContext";
import UserManagementContext from "../context/UserManagementContext";
import AppSettingsContext from "../context/AppSettingsContext";
import { OPEN_WEEK } from "../common/planCycle";
import { Home } from "./Home";

const today = dayjs().format("YYYY-MM-DD");
const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
const doneToday = { meta: { completedAt: dayjs().toISOString() } };

const LocationProbe = () => {
  const { pathname, state } = useLocation();
  return <output data-testid="location">{JSON.stringify({ pathname, state })}</output>;
};

const renderHome = (sessions: Record<string, any>, logged: Record<string, any> = {}, plans = ["p1"]) =>
  render(
    <AuthContext.Provider
      value={
        {
          user: { email: "sam@example.com" },
          userPermission: { role: "user", plans, firstName: "Sam" },
          orgs: [],
          suspendedOrgs: [],
          isLoading: false,
        } as any
      }
    >
      <AppSettingsContext.Provider value={{ adminEmail: "admin@example.com" } as any}>
        <UserManagementContext.Provider value={{} as any}>
          <SourceDataContext.Provider
            value={
              {
                sourceData: {
                  plans: { Mobility: { open: true, sessions: Object.keys(sessions) } },
                  sessions,
                  userdata: { uid: { Mobility: { [OPEN_WEEK]: logged } } },
                },
                checkins: {},
                events: [],
              } as any
            }
          >
            <MemoryRouter>
              <Home />
              <LocationProbe />
            </MemoryRouter>
          </SourceDataContext.Provider>
        </UserManagementContext.Provider>
      </AppSettingsContext.Provider>
    </AuthContext.Provider>
  );

describe("Home hero", () => {
  // DayStrip picks one or two weeks from the viewport.
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("offers today's next session and opens it on Train", () => {
    renderHome({ Flow: { date: today }, Stretch: { date: today } });
    expect(screen.getByText("Up next")).toBeTruthy();
    expect(screen.getAllByText("Flow")).toHaveLength(1);
    fireEvent.click(screen.getAllByRole("button", { name: "Start" })[0]);
    expect(JSON.parse(screen.getByTestId("location").textContent!)).toEqual({
      pathname: "/training-planner/train",
      state: { plan: "Mobility", session: "Flow" },
    });
  });

  it("puts all done ahead of missed sessions", () => {
    renderHome({ Flow: { date: today }, Old: { date: yesterday } }, { Flow: doneToday });
    expect(screen.getByText("All done today — great work")).toBeTruthy();
    expect(screen.queryByText(/to catch up/)).toBeNull();
  });

  it("puts missed sessions ahead of a rest day", () => {
    renderHome({ Old: { date: yesterday } });
    expect(screen.getByText("1 missed session to catch up")).toBeTruthy();
    expect(screen.queryByText(/^Rest day —.*recharge$/)).toBeNull();
  });

  it("falls back to a rest day", () => {
    renderHome({});
    expect(screen.getByText("Rest day — recover and recharge")).toBeTruthy();
  });

  it("stays on today when another day is selected", () => {
    renderHome({ Flow: { date: today } });
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    fireEvent.click(screen.getByRole("button", { name: new RegExp(dayjs().add(1, "week").format("MMMM D")) }));
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(dayjs().add(1, "week").format("dddd, MMM D"));
    expect(screen.getByText("Up next")).toBeTruthy();
  });

  it("is only a greeting with no plans", () => {
    renderHome({}, {}, []);
    expect(screen.getByRole("heading", { level: 1, name: /^Welcome back/ })).toBeTruthy();
    expect(screen.queryByText("Week streak")).toBeNull();
    expect(screen.queryByText(/Rest day —/)).toBeNull();
  });
});
