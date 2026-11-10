import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { SessionStats } from "./SessionStats";

beforeAll(() => {
  window.scrollTo = vi.fn();
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});

const renderStats = (meta: any, onMarkFinished?: () => Promise<void>) =>
  render(
    <SessionStats
      title="Day 1"
      planName="Strength"
      week="Week 1"
      session="Day 1"
      logged={{ meta }}
      userdata={{}}
      onClose={() => {}}
      onMarkFinished={onMarkFinished}
    />
  );

const button = () => screen.queryByRole("button", { name: "Mark as finished" });

describe("SessionStats Mark as finished", () => {
  afterEach(cleanup);

  it("clears the label from an incomplete run", () => {
    const onMarkFinished = vi.fn().mockResolvedValue(undefined);
    renderStats({ incomplete: true }, onMarkFinished);
    fireEvent.click(button()!);
    expect(onMarkFinished).toHaveBeenCalledTimes(1);
  });

  it("says so when it can't save", async () => {
    renderStats({ incomplete: true }, vi.fn().mockRejectedValue(new Error("offline")));
    fireEvent.click(button()!);
    expect(await screen.findByText(/Couldn't save/)).toBeTruthy();
  });

  it("isn't offered on a finished run or someone else's", () => {
    renderStats({}, vi.fn());
    expect(button()).toBeNull();
    cleanup();
    renderStats({ incomplete: true });
    expect(button()).toBeNull();
  });
});
