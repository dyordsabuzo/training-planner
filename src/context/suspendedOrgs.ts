export type SuspendedOrg = { id: string; name: string };
// An org's public profile (orgs/{id}/public/profile), or null if it couldn't be read.
export type OrgProfile = { name?: string; status?: string } | null;

// Orgs worth checking for suspension: ones the user had last time but lost
// from the claim, plus ones already known to be suspended that are still
// missing. An org back in the claim is active again.
export const suspendedCandidates = (
  previousRoles: Record<string, unknown>,
  claimed: Record<string, unknown>,
  previous: SuspendedOrg[]
) => Array.from(new Set([...Object.keys(previousRoles), ...previous.map((o) => o.id)])).filter((id) => !claimed[id]);

// Keeps the candidates whose profile says suspended. An unreadable profile
// (offline) keeps what was known before; any other status (reactivated, or
// the user was removed) clears it.
export const nextSuspendedOrgs = (
  candidates: string[],
  profiles: Record<string, OrgProfile>,
  previous: SuspendedOrg[]
): SuspendedOrg[] =>
  candidates.flatMap((id) => {
    const profile = profiles[id];
    if (profile === null) return previous.filter((o) => o.id === id);
    return profile?.status === "suspended" ? [{ id, name: profile.name ?? id }] : [];
  });
