import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import SessionContext from "../../context/SessionContext";
import SourceDataContext from "../../context/SourceDataContext";
import { UnsavedRunBanner } from "./UnsavedRunBanner";

beforeAll(() => {
  window.scrollTo = vi.fn();
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});

const inProgress = { plan: "Strength", week: "Week 1", session: "Day 1", data: { Legs: { Squat: { 1: {}, 2: {} } } } };

const renderBanner = (session: any) =>
  render(
    <SourceDataContext.Provider
      value={{ sourceData: { plans: { Strength: {} }, userdata: { me: { inProgress } } } } as any}
    >
      <SessionContext.Provider value={{ sessionData: null, ...session }}>
        <UnsavedRunBanner />
      </SessionContext.Provider>
    </SourceDataContext.Provider>
  );

describe("UnsavedRunBanner", () => {
  afterEach(cleanup);

  it("saves the unfinished workout and confirms it", async () => {
    const recoverRun = vi.fn().mockResolvedValue(undefined);
    renderBanner({ recoverRun });
    expect(screen.getByText(/2 sets logged/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save to History" }));
    expect(recoverRun).toHaveBeenCalledWith(expect.objectContaining({ plan: "Strength", session: "Day 1", data: inProgress.data }));
    expect(await screen.findByText(/saved to History/)).toBeTruthy();
  });

  it("keeps the offer when saving fails", async () => {
    renderBanner({ recoverRun: vi.fn().mockRejectedValue(new Error("offline")) });
    fireEvent.click(screen.getByRole("button", { name: "Save to History" }));
    expect(await screen.findByText(/Couldn't save/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save to History" })).toBeTruthy();
  });

  it("only discards after confirming", () => {
    const discardProgress = vi.fn();
    renderBanner({ discardProgress });
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(discardProgress).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Yes, discard" }));
    expect(discardProgress).toHaveBeenCalledTimes(1);
  });

  it("stays out of the way during a run", () => {
    renderBanner({ sessionData: { session: "Day 1" } });
    expect(screen.queryByText(/Unsaved workout/)).toBeNull();
  });
});
