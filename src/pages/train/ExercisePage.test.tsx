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
