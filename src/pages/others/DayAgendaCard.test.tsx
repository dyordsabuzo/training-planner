import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router";
import dayjs from "dayjs";
import { DayAgendaCard } from "./DayAgendaCard";

const session = (name: string, done = false) => ({ plan: "Strength", session: name, done, overdue: false, optional: false });
const agenda = { scheduled: [session("First"), session("Second"), session("Finished", true)], completed: [], events: [] };

const missedList = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    ...session(`Missed ${i + 1}`),
    overdue: true,
    date: dayjs().subtract(i + 1, "day").format("YYYY-MM-DD"),
  }));

const renderCard = (day = dayjs(), missed: ReturnType<typeof missedList> = []) =>
  render(
    <MemoryRouter>
      <DayAgendaCard day={day} agenda={agenda} missed={missed} />
    </MemoryRouter>
  );

describe("DayAgendaCard", () => {
  afterEach(cleanup);

  it("leaves today's next session to the hero and lists the others", () => {
    renderCard();
    expect(screen.queryByText("First")).toBeNull();
    expect(screen.getByText("Second")).toBeTruthy();
    expect(screen.getByText("Finished")).toBeTruthy();
  });

  it("lists every session on another day", () => {
    renderCard(dayjs().add(1, "day"));
    expect(screen.getByText("First")).toBeTruthy();
    expect(screen.getByText("Second")).toBeTruthy();
  });

  it("shows a short catch-up list with no toggle", () => {
    renderCard(dayjs(), missedList(3));
    expect(screen.getByText("Missed 3")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Show" })).toBeNull();
  });

  it("hides a long catch-up list until asked, keeping the count", () => {
    renderCard(dayjs(), missedList(4));
    expect(screen.getByText(/4 missed sessions/)).toBeTruthy();
    expect(screen.queryByText("Missed 1")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.getByText("Missed 1")).toBeTruthy();
    expect(screen.getByText("Missed 4")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(screen.queryByText("Missed 1")).toBeNull();
  });
});
