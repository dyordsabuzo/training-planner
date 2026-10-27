import { describe, expect, it } from "vitest";
import { nextSuspendedOrgs, suspendedCandidates } from "./suspendedOrgs";

describe("suspendedCandidates", () => {
  it("returns orgs lost from the claim", () => {
    expect(suspendedCandidates({ a: "client", b: "trainer" }, { b: "trainer" }, [])).toEqual(["a"]);
  });

  it("keeps known suspended orgs that are still missing", () => {
    expect(suspendedCandidates({}, {}, [{ id: "a", name: "A" }])).toEqual(["a"]);
  });

  it("drops orgs back in the claim", () => {
    expect(suspendedCandidates({}, { a: "client" }, [{ id: "a", name: "A" }])).toEqual([]);
  });

  it("lists each org once", () => {
    expect(suspendedCandidates({ a: "client" }, {}, [{ id: "a", name: "A" }])).toEqual(["a"]);
  });
});

describe("nextSuspendedOrgs", () => {
  it("keeps orgs whose profile is suspended, with the profile name", () => {
    expect(nextSuspendedOrgs(["a"], { a: { name: "Org A", status: "suspended" } }, [])).toEqual([
      { id: "a", name: "Org A" },
    ]);
  });

  it("clears reactivated orgs and ones the user was removed from", () => {
    const previous = [{ id: "a", name: "A" }];
    expect(nextSuspendedOrgs(["a", "b"], { a: { status: "active" }, b: { name: "B" } }, previous)).toEqual([]);
  });

  it("keeps what was known when the profile can't be read", () => {
    const previous = [{ id: "a", name: "A" }];
    expect(nextSuspendedOrgs(["a", "b"], { a: null, b: null }, previous)).toEqual(previous);
  });
});
