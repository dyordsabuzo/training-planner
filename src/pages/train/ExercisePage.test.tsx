import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import SessionContext from "../../context/SessionContext";
import { ExercisePage } from "./ExercisePage";

// Confetti needs a real canvas.
vi.mock("../others/Celebration", () => ({ Celebration: () => null }));

beforeAll(() => {
  window.scrollTo = vi.fn();
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as any;
});

const sessionData = () => ({
  session: "Day A",
  supersets: {
    "unit-0": {
      name: "Legs",
      kind: "group",
      type: "Rep-based",
      measured: true,
      targetSet: 3,
      targetRep: 8,
      rest: 60,
      exercises: [{ exercise: { name: "Squat" }, targetWeight: 60 }],
    },
  },
});

const renderRun = (limitedRun: boolean, data: any = sessionData()) =>
  render(
    <MemoryRouter>
      <SessionContext.Provider value={{ sessionData: data, exitPath: "/", limitedRun } as any}>
        <ExercisePage />
      </SessionContext.Provider>
    </MemoryRouter>
  );

describe("skipping the last group", () => {
  afterEach(cleanup);

  it("reaches the finish screen and saves the sets already logged", async () => {
    const saveRun = vi.fn();
    render(
      <MemoryRouter>
        <SessionContext.Provider value={{ sessionData: sessionData(), exitPath: "/", saveRun, saveProgress: vi.fn() } as any}>
          <ExercisePage />
        </SessionContext.Provider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Done" })[0]);
    // Past the rest timer, so the group is what's left to skip.
    fireEvent.click(screen.getByRole("button", { name: "Skip group" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /skip group|delete|confirm|yes/i }));
    expect(await screen.findByRole("button", { name: "Finish workout" })).toBeTruthy();
    expect(saveRun).toHaveBeenCalledTimes(1);
    expect(Object.keys(saveRun.mock.calls[0][0])).toEqual(["Legs"]);
  });
});

describe("rest timer", () => {
  afterEach(cleanup);

  it("counts the set just finished", () => {
    renderRun(false);
    fireEvent.click(screen.getAllByRole("button", { name: "Done" })[0]);
    expect(screen.getByText("Completed 1 set of 3")).toBeTruthy();
  });
});

describe("ExercisePage limited run", () => {
  afterEach(cleanup);

  it("removes skipping and every way to change targets", () => {
    renderRun(true);
    expect(screen.queryByRole("button", { name: /skip/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /adjust/i })).toBeNull();
    expect(screen.queryByText("Tap to adjust")).toBeNull();
    expect(screen.getByRole("button", { name: "Cancel session" })).toBeTruthy();
    expect(screen.getByText("60")).toBeTruthy();
    expect(screen.getByText("8")).toBeTruthy();
  });

  it("asks visitors to time their own rest, with no timer, until they continue", () => {
    const { container } = renderRun(true);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByRole("heading", { name: "Rest" })).toBeTruthy();
    expect(screen.getByText("Completed 1 set of 3")).toBeTruthy();
    expect(screen.getByText(/Time your own rest/)).toBeTruthy();
    expect(screen.queryByRole("timer")).toBeNull();
    expect(container.querySelector("svg circle")).toBeNull();
    expect(container.querySelector(".animate-slide-up")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByRole("heading", { name: "Rest" })).toBeNull();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Done" })).toBeTruthy();
  });

  it("fills a bar for each completed set", () => {
    renderRun(true);
    const bars = () => screen.getByRole("img", { name: /sets completed/ }).getAttribute("aria-label");
    expect(bars()).toBe("0 of 3 sets completed");
    expect(screen.getByRole("img", { name: /sets completed/ }).children).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(bars()).toBe("1 of 3 sets completed");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(bars()).toBe("1 of 3 sets completed");
  });

  it.each([undefined, "", 0])("runs 3 sets when sets are %j", (targetSet) => {
    const data = sessionData();
    data.supersets["unit-0"].targetSet = targetSet as any;
    renderRun(true, data);
    expect(screen.getByRole("img", { name: "0 of 3 sets completed" })).toBeTruthy();
    expect(screen.getByText("of 3")).toBeTruthy();
  });

  it("keeps the controls on a normal run", () => {
    renderRun(false);
    expect(screen.getByRole("button", { name: /Tap to adjust sets/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Skip exercise" })).toBeTruthy();
  });
});
