import { describe, expect, it } from "vitest";
import {
  assembleUserdata,
  contentView,
  dependenciesOf,
  progressKeys,
  toStoredEntity,
  toStoredUserdata,
  userdataPlans,
  userdataView,
} from "./refs";
import { SourceDbReferences } from "./utils";

const stored = {
  exercises: {
    Squat: { id: "ex1", name: "Squat", supersets: ["ss1"], alternatives: ["ex2"] },
    Lunge: { id: "ex2", name: "Lunge", supersets: [], alternatives: [] },
  },
  supersets: {
    Legs: { id: "ss1", name: "Legs", exercises: ["ex1", "ex2"], sessions: ["se1"] },
  },
  sessions: {
    "Day 1": {
      id: "se1",
      name: "Day 1",
      supersets: ["ss1"],
      groups: [{ name: "Finisher", exercises: ["ex2"] }],
      sharedOrder: ["Legs"],
    },
  },
  plans: {
    Strength: { id: "pl1", name: "Strength", sessions: ["se1"] },
  },
};

describe("contentView", () => {
  it("turns id references into names", () => {
    const view = contentView(stored);
    expect(view.exercises!.Squat).toMatchObject({ supersets: ["Legs"], alternatives: ["Lunge"] });
    expect(view.supersets!.Legs).toMatchObject({ exercises: ["Squat", "Lunge"], sessions: ["Day 1"] });
    expect(view.sessions!["Day 1"]).toMatchObject({
      supersets: ["Legs"],
      groups: [{ name: "Finisher", exercises: ["Lunge"] }],
      sharedOrder: ["Legs"],
    });
    expect(view.plans!.Strength.sessions).toEqual(["Day 1"]);
  });

  it("follows a rename without touching the referencing entities", () => {
    const renamed = {
      ...stored,
      exercises: {
        ...stored.exercises,
        "Back squat": { ...stored.exercises.Squat, name: "Back squat" },
      },
    };
    delete (renamed.exercises as any).Squat;
    expect(contentView(renamed).supersets!.Legs.exercises).toEqual(["Back squat", "Lunge"]);
  });

  it("passes through unmigrated name references and deleted ids", () => {
    const legacy = {
      ...stored,
      supersets: { Legs: { id: "ss1", name: "Legs", exercises: ["Squat", "gone"] } },
    };
    expect(contentView(legacy).supersets!.Legs.exercises).toEqual(["Squat", "gone"]);
  });

  it("resolves an unmigrated reference to a name the entity had before", () => {
    const legacy = {
      exercises: { "Back squat": { id: "ex1", name: "Back squat", previousNames: ["Squat"] } },
      supersets: { Legs: { id: "ss1", name: "Legs", exercises: ["Squat"] } },
    };
    expect(contentView(legacy).supersets!.Legs.exercises).toEqual(["Back squat"]);
    expect(toStoredEntity(SourceDbReferences.SUPERSETS, legacy.supersets.Legs, legacy).exercises).toEqual([
      "ex1",
    ]);
  });

  it("ignores an earlier name two entities have had", () => {
    const legacy = {
      exercises: {
        A: { id: "ex1", name: "A", previousNames: ["Squat"] },
        B: { id: "ex2", name: "B", previousNames: ["Squat"] },
      },
      supersets: { Legs: { id: "ss1", name: "Legs", exercises: ["Squat"] } },
    };
    expect(contentView(legacy).supersets!.Legs.exercises).toEqual(["Squat"]);
  });
});

describe("toStoredEntity", () => {
  it("turns name references into ids", () => {
    expect(
      toStoredEntity(
        SourceDbReferences.SESSIONS,
        { name: "Day 2", supersets: ["Legs"], groups: [{ name: "G", exercises: ["Squat"] }] },
        stored
      )
    ).toEqual({
      name: "Day 2",
      supersets: ["ss1"],
      groups: [{ id: "key:G", name: "G", exercises: ["ex1"] }],
    });
  });

  it("records a rename in previousNames, for a group too", () => {
    const withGroupId = {
      ...stored,
      sessions: {
        "Day 1": { ...stored.sessions["Day 1"], groups: [{ id: "g1", name: "Finisher", exercises: ["ex2"] }] },
      },
    };
    const renamed = toStoredEntity(
      SourceDbReferences.SESSIONS,
      { id: "se1", name: "Day A", supersets: ["Legs"], groups: [{ id: "g1", name: "Burnout", exercises: ["Lunge"] }] },
      withGroupId
    );
    expect(renamed).toMatchObject({
      name: "Day A",
      previousNames: ["Day 1"],
      groups: [{ id: "g1", name: "Burnout", previousNames: ["Finisher"] }],
    });
    // Renaming back drops the name from the list.
    const back = toStoredEntity(
      SourceDbReferences.SESSIONS,
      { ...renamed, name: "Day 1", supersets: ["Legs"] },
      { ...withGroupId, sessions: { "Day A": renamed } }
    );
    expect(back.previousNames).toEqual(["Day A"]);
  });

  it("leaves fields that aren't present alone", () => {
    expect(toStoredEntity(SourceDbReferences.PLANS, { name: "P" }, stored)).toEqual({ name: "P" });
  });
});

describe("progress", () => {
  const userdata = {
    id: "alice",
    pl1: {
      "Week 1": {
        se1: {
          ss1: { ex1: { 1: { targetWeight: 50 } } },
          "Finisher": { ex2: { 1: { targetRep: 10 } } },
          meta: { completedAt: "2026-01-01" },
        },
      },
    },
    inProgress: { plan: "pl1", week: "Week 1", session: "se1", data: { ss1: { ex1: {} } } },
  };

  it("names stored id keys", () => {
    const view = userdataView(userdata, stored);
    expect(view.Strength["Week 1"]["Day 1"]).toEqual({
      Legs: { Squat: { 1: { targetWeight: 50 } } },
      Finisher: { Lunge: { 1: { targetRep: 10 } } },
      meta: { completedAt: "2026-01-01" },
    });
    expect(view.inProgress).toEqual({
      plan: "Strength",
      week: "Week 1",
      session: "Day 1",
      data: { Legs: { Squat: {} } },
    });
    expect(view.id).toBe("alice");
  });

  it("merges a plan logged under both its name and its id", () => {
    const mixed = {
      Strength: { "Week 1": { "Day 1": { Legs: { Squat: { 1: { targetWeight: 40 } } } } } },
      pl1: { "Week 2": { se1: { ss1: { ex1: { 1: { targetWeight: 45 } } } } } },
    };
    expect(Object.keys(userdataView(mixed, stored).Strength)).toEqual(["Week 1", "Week 2"]);
  });

  it("names deleted items from the labels saved with the run", () => {
    const view = userdataView(
      { gonePlan: { "Week 1": { se1: { goneEx: {}, meta: { labels: { gonePlan: "Old plan" } } } } } },
      stored
    );
    expect(Object.keys(view)).toEqual(["Old plan"]);
  });

  it("translates names to ids for writing, with labels", () => {
    const keys = progressKeys(stored);
    const run = { Legs: { Squat: { 1: {} } }, Finisher: { Lunge: {} }, mood: { after: 3 } };
    expect(keys.plan("Strength")).toBe("pl1");
    expect(keys.run(run, "Day 1")).toEqual({
      ss1: { ex1: { 1: {} } },
      "key:Finisher": { ex2: {} },
      mood: { after: 3 },
    });
    expect(keys.labels({ plan: "Strength", session: "Day 1", run })).toEqual({
      pl1: "Strength",
      se1: "Day 1",
      ss1: "Legs",
      "key:Finisher": "Finisher",
      ex1: "Squat",
      ex2: "Lunge",
    });
  });

  describe("exercise groups", () => {
    const renamedGroup = (group: any) => ({
      ...stored,
      sessions: { "Day 1": { ...stored.sessions["Day 1"], groups: [group] } },
    });
    const logged = (unit: string) => ({ pl1: { "Week 1": { se1: { [unit]: { ex2: { 1: {} } } } } } });
    const units = (doc: any, collections: any) =>
      Object.keys(userdataView(doc, collections).Strength["Week 1"]["Day 1"]);

    it("keeps progress after a group with an id is renamed", () => {
      const collections = renamedGroup({ id: "g1", name: "Burnout", exercises: ["ex2"] });
      expect(progressKeys(collections).unit("Burnout", "Day 1")).toBe("g1");
      expect(units(logged("g1"), collections)).toEqual(["Burnout"]);
    });

    it("matches progress logged under a group's key before it had an id", () => {
      // Saved after a rename: its id was derived from the old key.
      const collections = renamedGroup({ id: "key:Finisher", name: "Burnout", exercises: ["ex2"] });
      expect(units(logged("Finisher"), collections)).toEqual(["Burnout"]);
    });

    it("matches progress logged under a group's earlier name", () => {
      const collections = renamedGroup({
        id: "g1",
        name: "Burnout",
        previousNames: ["Finisher"],
        exercises: ["ex2"],
      });
      expect(units(logged("Finisher"), collections)).toEqual(["Burnout"]);
      expect(toStoredUserdata(logged("Finisher"), collections).pl1["Week 1"].se1).toHaveProperty("g1");
    });

    it("names a deleted group from the run's labels", () => {
      const collections = renamedGroup({ id: "g2", name: "Other", exercises: [] });
      const doc = {
        pl1: { "Week 1": { se1: { g1: { ex2: {} }, meta: { labels: { g1: "Finisher" } } } } },
      };
      expect(units(doc, collections)).toContain("Finisher");
    });
  });
});

describe("toStoredUserdata", () => {
  const legacy = {
    id: "alice",
    Strength: {
      "Week 1": {
        "Day 1": {
          Legs: { Squat: { 1: { targetWeight: 50 } } },
          mood: { before: 4 },
          meta: { completedAt: "2026-01-01" },
        },
      },
    },
    inProgress: { plan: "Strength", week: "Week 1", session: "Day 1", data: { Legs: { Squat: {} } } },
  };

  it("re-keys name-keyed progress by id and records labels", () => {
    expect(toStoredUserdata(legacy, stored)).toEqual({
      id: "alice",
      pl1: {
        "Week 1": {
          se1: {
            ss1: { ex1: { 1: { targetWeight: 50 } } },
            mood: { before: 4 },
            meta: {
              completedAt: "2026-01-01",
              labels: { pl1: "Strength", se1: "Day 1", ss1: "Legs", ex1: "Squat" },
            },
          },
        },
      },
      inProgress: { plan: "pl1", week: "Week 1", session: "se1", data: { ss1: { ex1: {} } } },
    });
  });

  it("is idempotent and round-trips through the view", () => {
    const once = toStoredUserdata(legacy, stored);
    expect(toStoredUserdata(once, stored)).toEqual(once);
    const view = userdataView(once, stored);
    expect(view.Strength["Week 1"]["Day 1"].Legs).toEqual(legacy.Strength["Week 1"]["Day 1"].Legs);
  });
});

describe("split userdata", () => {
  const weeks = { "Week 1": { se1: { ss1: { ex1: {} }, meta: { completedAt: "2026-01-01" } } } };
  const inProgress = { plan: "pl1", week: "Week 1", session: "se1", data: {} };

  it("assembles plan docs and the root's inProgress into one doc", () => {
    const root = { id: "alice", inProgress, legacyPlan: { "Week 1": {} } };
    expect(assembleUserdata("alice", root, { pl1: { orgId: "orgA", ...weeks } })).toEqual({
      id: "alice",
      pl1: weeks,
      inProgress,
    });
  });

  it("works without a root doc", () => {
    expect(assembleUserdata("alice", undefined, {})).toEqual({ id: "alice" });
  });

  it("takes the plan entries out of a single-doc userdata", () => {
    expect(userdataPlans({ id: "alice", inProgress, pl1: weeks })).toEqual({ pl1: weeks });
  });
});

describe("dependenciesOf", () => {
  const ids = (db: SourceDbReferences, ref: string) =>
    dependenciesOf(db as any, ref, stored).map((d) => `${d.db}/${d.id}`);

  it("walks a plan down to exercises and alternatives, once each", () => {
    expect(ids(SourceDbReferences.PLANS, "pl1")).toEqual([
      "sessions/se1",
      "supersets/ss1",
      "exercises/ex1",
      "exercises/ex2",
    ]);
  });
  it("accepts names (the UI view) and skips back-links", () => {
    expect(ids(SourceDbReferences.SUPERSETS, "Legs")).toEqual(["exercises/ex1", "exercises/ex2"]);
  });
  it("doesn't list the item itself", () => {
    expect(ids(SourceDbReferences.EXERCISES, "ex1")).toEqual(["exercises/ex2"]);
  });
  it("is empty for an unknown item", () => {
    expect(ids(SourceDbReferences.SESSIONS, "nope")).toEqual([]);
  });
});
