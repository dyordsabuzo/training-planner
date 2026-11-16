import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getDoc } from "firebase/firestore";
import { useOrgMembership } from "./useOrgMembership";

vi.mock("firebase/firestore", () => ({ getDoc: vi.fn() }));
vi.mock("../common/firebase", () => ({ getDocumentReference: () => ({}) }));

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};

describe("useOrgMembership loading", () => {
  it("counts as loading from the first render with a user until the member doc arrives", async () => {
    const claims = deferred<any>();
    const memberDoc = deferred<any>();
    vi.mocked(getDoc).mockImplementation(((ref: unknown) => memberDoc.promise) as any);
    const user = { uid: "u1", getIdTokenResult: () => claims.promise } as any;

    // Every render, as act() runs effects before the test could look.
    const renders: { signedIn: boolean; isLoading: boolean }[] = [];
    const { result, rerender } = renderHook(
      ({ u }) => {
        const membership = useOrgMembership(u);
        renders.push({ signedIn: !!u, isLoading: membership.isLoading });
        return membership;
      },
      { initialProps: { u: null as any } }
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Signing in: loading in every render, not only after an effect.
    renders.length = 0;
    rerender({ u: user });
    expect(renders.length).toBeGreaterThan(0);

    // Claims arrive; the member doc is still on its way.
    await act(async () => claims.resolve({ claims: { orgs: { o1: "client" } } }));
    expect(result.current.activeOrgId).toBe("o1");
    expect(result.current.isLoading).toBe(true);

    expect(renders.filter((r) => r.signedIn && !r.isLoading)).toEqual([]);

    await act(async () => memberDoc.resolve({ exists: () => true, data: () => ({ assignedPlanIds: ["p1"] }) }));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.member).toEqual({ assignedPlanIds: ["p1"] });
  });
});
