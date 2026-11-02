import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SourceDataContext from "../context/SourceDataContext";
import { SessionForm } from "./SessionForm";

const session = {
  id: "s1",
  name: "Legs",
  tags: ["strength"],
  date: "2026-11-10",
  optional: false,
  isShareable: false,
  supersets: ["Squats"],
  groups: [],
};

const sourceData = {
  sessions: {
    Legs: { ...session, linkCount: 2 },
    Arms: { id: "s2", name: "Arms" },
  },
  supersets: {
    Squats: { id: "ss1", name: "Squats", exercises: [] },
    Lunges: { id: "ss2", name: "Lunges", exercises: [] },
  },
  exercises: {},
};

const setup = (data: any = session, type = "edit") => {
  const editSession = vi.fn(async (saved: any) => saved);
  const addSession = vi.fn();
  const closeForm = vi.fn();
  const tree = (formData: any, onClose = closeForm, source: any = sourceData) => (
    <SourceDataContext.Provider value={{ sourceData: source, editSession, addSession } as any}>
      <SessionForm data={formData} type={type} closeForm={onClose} />
    </SourceDataContext.Provider>
  );
  const view = render(tree(data));
  return { editSession, addSession, closeForm, tree, rerender: view.rerender };
};

const nameInput = () => screen.getByLabelText("Session name") as HTMLInputElement;
const tagInput = () =>
  screen.getByText("Tags").parentElement!.querySelector("input") as HTMLInputElement;
const rename = (value: string) => fireEvent.change(nameInput(), { target: { value } });
const elapse = (ms = 800) => act(() => vi.advanceTimersByTimeAsync(ms));

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    }
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("SessionForm autosave", () => {
  it("writes nothing when opened and closed without changes", async () => {
    const { editSession, closeForm } = setup();
    await elapse(2000);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(editSession).not.toHaveBeenCalled();
    expect(closeForm).toHaveBeenCalledOnce();
  });

  it("debounces changes into one save that keeps the id and cached fields", async () => {
    const { editSession } = setup();
    rename("Le");
    await elapse(400);
    rename("Leg");
    await elapse(400);
    rename("Leg day");
    expect(editSession).not.toHaveBeenCalled();
    await elapse();
    expect(editSession).toHaveBeenCalledOnce();
    expect(editSession.mock.calls[0][0]).toMatchObject({ id: "s1", name: "Leg day", linkCount: 2 });
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("shows Saving… until the write finishes", async () => {
    const { editSession } = setup();
    let finish: (saved: any) => void = () => {};
    editSession.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
    rename("Leg day");
    await elapse();
    expect(screen.getByRole("status")).toHaveTextContent("Saving…");
    await act(async () => finish({ id: "s1" }));
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("only lets the latest write update the status", async () => {
    const { editSession } = setup();
    const finish: ((saved: any) => void)[] = [];
    editSession.mockImplementation(() => new Promise((resolve) => finish.push(resolve)));
    rename("A");
    await elapse();
    rename("B");
    await elapse();
    await act(async () => finish[0](null));
    expect(screen.getByRole("status")).toHaveTextContent("Saving…");
    await act(async () => finish[1]({ id: "s1" }));
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("writes nothing when a change is undone before the debounce ends", async () => {
    const { editSession } = setup();
    rename("Leg day");
    await elapse(400);
    rename("Legs");
    await elapse(2000);
    expect(editSession).not.toHaveBeenCalled();
  });

  it("doesn't write again when only trailing whitespace changes", async () => {
    const { editSession } = setup();
    rename("Leg");
    await elapse();
    rename("Leg ");
    await elapse();
    expect(editSession).toHaveBeenCalledOnce();
    expect(editSession.mock.calls[0][0].name).toBe("Leg");
  });

  it.each([
    [
      "date",
      () => fireEvent.change(screen.getByLabelText("Date (optional)"), { target: { value: "2026-12-01" } }),
      { date: "2026-12-01" },
    ],
    [
      "cleared date",
      () => fireEvent.click(screen.getByRole("button", { name: "Clear date" })),
      { date: null },
    ],
    [
      "tags",
      () => fireEvent.click(screen.getByRole("button", { name: "Remove strength" })),
      { tags: [] },
    ],
    [
      "supersets",
      () => fireEvent.click(screen.getByRole("button", { name: /^Remove Squats/ })),
      null,
    ],
    [
      "optional",
      () => fireEvent.click(screen.getByRole("switch", { name: "Optional session?" })),
      { optional: true },
    ],
  ])("saves a change to %s", async (_field, change, expected) => {
    // Removing the only superset would leave nothing to save.
    const { editSession } = setup({ ...session, groups: [], supersets: ["Squats", "Lunges"] });
    change();
    await elapse();
    expect(editSession).toHaveBeenCalledOnce();
    expect(editSession.mock.calls[0][0]).toMatchObject(expected ?? { supersets: ["Lunges"] });
  });

  it("regenerates the shared snapshot from the form when shareable is turned on", async () => {
    const { editSession } = setup();
    fireEvent.click(screen.getByRole("switch", { name: "Shareable?" }));
    await elapse();
    const saved = editSession.mock.calls[0][0];
    expect(saved.isShareable).toBe(true);
    expect(saved.sharedOrder).toEqual(["Squats"]);
    expect(saved.sharedSnapshot).toHaveProperty("Squats");
  });

  it.each([
    ["empty", "   ", "Enter a session name."],
    ["duplicate", "arms", "A session with this name already exists."],
  ])("doesn't save a %s name", async (_case, value, message) => {
    const { editSession } = setup();
    rename(value);
    await elapse();
    expect(editSession).not.toHaveBeenCalled();
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Not saved");
  });

  it("doesn't save an incomplete group", async () => {
    const group = { id: "g1", name: "Heavy", exercises: ["Squat"], sets: 3, reps: 5 };
    const { editSession } = setup({ ...session, supersets: [], groups: [group] });
    rename("Leg day");
    await elapse();
    expect(editSession).toHaveBeenCalledOnce();

    cleanup();
    const incomplete = setup({ ...session, supersets: [], groups: [{ ...group, exercises: [] }] });
    rename("Leg day");
    await elapse();
    expect(incomplete.editSession).not.toHaveBeenCalled();
    expect(screen.getByText("Each group needs a name and at least one exercise.")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Not saved");
  });

  it("clears the error when an invalid change is undone, without writing", async () => {
    const { editSession } = setup();
    rename("");
    await elapse();
    rename("Legs");
    await elapse();
    expect(screen.queryByText("Enter a session name.")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(editSession).not.toHaveBeenCalled();
  });

  it("closes an invalid form without writing", async () => {
    const { editSession, closeForm } = setup();
    rename("");
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(editSession).not.toHaveBeenCalled();
    expect(closeForm).toHaveBeenCalledOnce();
  });

  it.each([
    ["Done", () => fireEvent.click(screen.getByRole("button", { name: "Done" }))],
    ["Escape", () => fireEvent.keyDown(document, { key: "Escape" })],
  ])("flushes a pending change on %s, then closes", (_how, close) => {
    const { editSession, closeForm } = setup();
    rename("Leg day");
    close();
    expect(editSession).toHaveBeenCalledOnce();
    expect(editSession.mock.calls[0][0].name).toBe("Leg day");
    expect(closeForm).toHaveBeenCalledOnce();
  });

  it("flushes a pending change on unmount", () => {
    const { editSession } = setup();
    rename("Leg day");
    cleanup();
    expect(editSession).toHaveBeenCalledOnce();
  });

  it("flushes a pending change when the page is hidden, without writing it twice", async () => {
    const { editSession } = setup();
    rename("Leg day");
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    fireEvent(document, new Event("visibilitychange"));
    vi.restoreAllMocks();
    expect(editSession).toHaveBeenCalledOnce();
    await elapse();
    expect(editSession).toHaveBeenCalledOnce();
  });

  it("keeps text left in the tag box when closing, including through unmount", () => {
    const { editSession, closeForm } = setup();
    fireEvent.change(tagInput(), { target: { value: "power" } });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(closeForm).toHaveBeenCalledOnce();
    expect(editSession).toHaveBeenCalledOnce();
    expect(editSession.mock.calls[0][0].tags).toEqual(["strength", "power"]);

    // The box is gone by now, and this must not write the tag back out.
    cleanup();
    expect(editSession).toHaveBeenCalledOnce();
  });

  it("keeps the id after a rename makes the live lookup undefined", async () => {
    const { editSession, tree, rerender } = setup();
    rename("Leg day");
    await elapse();
    rerender(tree(undefined));
    rename("Leg day 2");
    await elapse();
    expect(editSession).toHaveBeenCalledTimes(2);
    expect(editSession.mock.calls[1][0]).toMatchObject({ id: "s1", name: "Leg day 2" });
  });

  it("keeps focus in the field being typed in when a save re-renders the parent", async () => {
    const { tree, rerender } = setup();
    nameInput().focus();
    rename("Leg day");
    await elapse();
    const renamed = { ...sourceData, sessions: { "Leg day": { ...session, name: "Leg day" } } };
    rerender(tree(undefined, vi.fn(), renamed));
    expect(document.activeElement).toBe(nameInput());
  });

  it("closes with the latest closeForm after a re-render", () => {
    const { closeForm, tree, rerender } = setup();
    const latest = vi.fn();
    rerender(tree(session, latest));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(latest).toHaveBeenCalledOnce();
    expect(closeForm).not.toHaveBeenCalled();
  });

  it("reports a failed write and retries on the next flush", async () => {
    const { editSession, closeForm } = setup();
    editSession.mockResolvedValueOnce(null);
    rename("Leg day");
    await elapse();
    expect(screen.getByRole("status")).toHaveTextContent("Couldn't save");

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(editSession).toHaveBeenCalledTimes(2);
    expect(editSession.mock.calls[1][0].name).toBe("Leg day");
    expect(closeForm).toHaveBeenCalledOnce();
  });

  it("doesn't let an old failure force a rewrite of a newer save", async () => {
    const { editSession } = setup();
    const finish: ((saved: any) => void)[] = [];
    editSession.mockImplementation(() => new Promise((resolve) => finish.push(resolve)));
    rename("A");
    await elapse();
    rename("B");
    await elapse();
    await act(async () => finish[0](null));
    await act(async () => finish[1]({ id: "s1" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(editSession).toHaveBeenCalledTimes(2);
  });

  it("never writes a linked session and shows no status", async () => {
    const { editSession, closeForm } = setup({ ...session, linked: true });
    rename("Leg day");
    await elapse();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(editSession).not.toHaveBeenCalled();
    expect(closeForm).toHaveBeenCalledOnce();
  });
});

describe("SessionForm add", () => {
  const added = { name: "Legs copy", supersets: ["Squats"] };

  it("doesn't autosave and keeps Save and Cancel", async () => {
    const { editSession, addSession } = setup(added, "add");
    rename("Leg day");
    await elapse(2000);
    cleanup();
    expect(editSession).not.toHaveBeenCalled();
    expect(addSession).not.toHaveBeenCalled();
  });

  it("shows Save and Cancel instead of Done", () => {
    setup(added, "add");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
  });

  it("adds on Save, then closes", () => {
    const { addSession, closeForm } = setup(added, "add");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(addSession).toHaveBeenCalledOnce();
    expect(addSession.mock.calls[0][0].name).toBe("Legs copy");
    expect(closeForm).toHaveBeenCalledOnce();
  });

  it("creates nothing on Cancel", () => {
    const { addSession, closeForm } = setup(added, "add");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(addSession).not.toHaveBeenCalled();
    expect(closeForm).toHaveBeenCalledOnce();
  });
});
