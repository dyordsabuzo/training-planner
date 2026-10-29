import { describe, expect, it } from "vitest";
import { ringColor } from "./Timer";

describe("ringColor", () => {
  it("is blue for the first quarter, red for the last", () => {
    expect(ringColor(60, 60)).toBe("#004777");
    expect(ringColor(45, 60)).toBe("#004777");
    expect(ringColor(15, 60)).toBe("rgb(163,0,0)");
    expect(ringColor(5, 60)).toBe("#A30000");
  });

  it("blends towards amber at half time", () => {
    expect(ringColor(30, 60)).toBe("rgb(247,184,1)");
    expect(ringColor(37.5, 60)).toBe("rgb(124,128,60)");
  });
});
