import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router";
import Navigation from "./Navigation";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Navigation />
    </MemoryRouter>
  );

describe("Navigation menu toggle", () => {
  afterEach(cleanup);

  it("stays clear of the bottom of a workout screen", () => {
    renderAt("/training-planner/train/abc");
    expect(screen.getByRole("button", { name: "Show menu" }).closest(".bottom-0")).toBeNull();
  });

  it("reveals and hides the menu", () => {
    renderAt("/training-planner/train/abc");
    fireEvent.click(screen.getByRole("button", { name: "Show menu" }));
    expect(screen.getByRole("button", { name: "Hide menu" }).getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Hide menu" }));
    expect(screen.getByRole("button", { name: "Show menu" })).toBeTruthy();
  });

  it("isn't needed outside a workout", () => {
    renderAt("/training-planner/train");
    expect(screen.queryByRole("button", { name: "Show menu" })).toBeNull();
  });
});

describe("Navigation on chromeless pages", () => {
  afterEach(cleanup);

  const sidebar = (path: string) => renderAt(path).container.querySelector("nav")!;

  it("hides the sidebar on the signed-out landing page", () => {
    expect(sidebar("/").classList.contains("lg:flex")).toBe(false);
  });

  it("shows it elsewhere", () => {
    expect(sidebar("/training-planner/history").classList.contains("lg:flex")).toBe(true);
  });
});
