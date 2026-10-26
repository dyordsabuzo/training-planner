import { describe, expect, it } from "vitest";
import { personalisePlan } from "./cloneEntity";

const sessions = {
  "Day 1": { id: "se1", name: "Day 1", supersets: ["Legs"], isShareable: true, sharedSnapshot: {}, date: "2026-11-01" },
  "Day 2": { id: "se2", name: "Day 2", supersets: [], groups: [{ id: "g1", name: "Core", exercises: ["Plank"] }] },
  "Day 1 (Alice)": { id: "se3", name: "Day 1 (Alice)" },
};
const plans = { Strength: { id: "pl1", name: "Strength", sessions: ["Day 1", "Day 2"], weeks: { "Week 1": {} } } };
const alice = { uid: "alice", name: "Alice" };

describe("personalisePlan", () => {
  it("copies the plan and its sessions under new names, for the client", () => {
    const { plan, sessions: copies } = personalisePlan(plans.Strength, sessions, plans, alice);
    expect(plan).toEqual({
      name: "Strength (Alice)",
      sessions: ["Day 1 (Alice 2)", "Day 2 (Alice)"],
      weeks: { "Week 1": {} },
      personalisedFor: "alice",
    });
    expect(copies).toEqual([
      { name: "Day 1 (Alice 2)", supersets: ["Legs"], date: "2026-11-01" },
      { name: "Day 2 (Alice)", supersets: [], groups: [{ id: "g1", name: "Core", exercises: ["Plank"] }] },
    ]);
  });

  it("keeps a session it can't find as it is", () => {
    const { plan, sessions: copies } = personalisePlan(
      { name: "P", sessions: ["Gone"] },
      sessions,
      plans,
      alice
    );
    expect(plan.sessions).toEqual(["Gone"]);
    expect(copies).toEqual([]);
  });
});
