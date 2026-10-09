import { describe, expect, it } from "vitest";
import { toSentenceCase } from "./utils";

describe("toSentenceCase", () => {
  it("capitalises only the first letter, lowercasing the rest", () => {
    expect(toSentenceCase("bench PRESS")).toBe("Bench press");
    expect(toSentenceCase("Bench Press")).toBe("Bench press");
    expect(toSentenceCase("INCLINE DB PRESS")).toBe("Incline db press");
  });

  it("never produces camelCase", () => {
    expect(toSentenceCase("romanian deadlift")).toBe("Romanian deadlift");
  });

  it("trims whitespace and leaves empty input alone", () => {
    expect(toSentenceCase("  squat  ")).toBe("Squat");
    expect(toSentenceCase("")).toBe("");
    expect(toSentenceCase("   ")).toBe("");
  });
});
