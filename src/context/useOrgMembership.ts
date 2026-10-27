import { useCallback, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { getDoc } from "firebase/firestore";
import { getDocumentReference } from "../common/firebase";
import { nextSuspendedOrgs, OrgProfile, SuspendedOrg, suspendedCandidates } from "./suspendedOrgs";

export type OrgRole = "owner" | "trainer" | "client";

export type Org = {
  id: string;
  name: string;
  code?: string;
  status?: string;
  contentVersion?: string;
};

export type OrgMember = {
  uid: string;
  role: OrgRole;
  assignedPlanIds: string[];
  trainerUids?: string[];
  email?: string | null;
  displayName?: string | null;
};

const ACTIVE_ORG_KEY = "training-planner-active-org";
// Last known memberships, so a cold start offline (expired token, no
// Firestore) still opens the cached content of the right org.
const MEMBERSHIP_KEY = "training-planner-membership";

type Remembered = {
  uid: string;
  roles: Record<string, OrgRole>;
  isSuperAdmin: boolean;
  members: Record<string, OrgMember>;
  // Orgs the user lost because they were suspended (see suspendedOrgs.ts).
  suspendedOrgs?: SuspendedOrg[];
};

const remembered = (uid: string): Remembered | null => {
  try {
    const value = JSON.parse(localStorage.getItem(MEMBERSHIP_KEY) ?? "null");
    return value?.uid === uid ? value : null;
  } catch {
    return null;
  }
};

const remember = (uid: string, patch: Partial<Remembered>) => {
  const current = remembered(uid) ?? { uid, roles: {}, isSuperAdmin: false, members: {} };
  localStorage.setItem(MEMBERSHIP_KEY, JSON.stringify({ ...current, ...patch }));
};

export const forgetMembership = () => localStorage.removeItem(MEMBERSHIP_KEY);

export const isTrainerRole = (role?: OrgRole | null) => role === "owner" || role === "trainer";

// The user's orgs and roles come from the `orgs` custom claim, which only
// Cloud Functions set (functions/src/claims.ts). Firestore rules check the
// same claim. The active org is remembered per device.
export const useOrgMembership = (user: User | null) => {
  const [roles, setRoles] = useState<Record<string, OrgRole>>({});
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | undefined>();
  const [member, setMember] = useState<OrgMember | null>(null);
  const [isMemberLoading, setIsMemberLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [suspendedOrgs, setSuspendedOrgs] = useState<SuspendedOrg[]>([]);

  // Pass forceRefresh after a call that changed the user's memberships, and
  // preferOrgId to make a just-joined org active.
  const loadClaims = useCallback(
    async (forceRefresh = false, preferOrgId?: string) => {
      if (!user) {
        setRoles({});
        setIsSuperAdmin(false);
        setSuspendedOrgs([]);
        setIsLoading(false);
        return;
      }
      let { claims } = await user.getIdTokenResult(forceRefresh);
      // A token issued before the user joined an org has no claim yet.
      if (!claims.orgs && !forceRefresh) {
        ({ claims } = await user.getIdTokenResult(true));
      }
      const claimed = (claims.orgs ?? {}) as Record<string, OrgRole>;
      const last = remembered(user.uid);
      remember(user.uid, { roles: claimed, isSuperAdmin: claims.superAdmin === true });
      applyRoles(claimed, claims.superAdmin === true, preferOrgId);
      checkSuspended(user.uid, last?.roles ?? {}, claimed, last?.suspendedOrgs ?? []);
    },
    [user]
  );

  // Suspended orgs drop out of the claim; their profile says why.
  const checkSuspended = async (
    uid: string,
    previousRoles: Record<string, OrgRole>,
    claimed: Record<string, OrgRole>,
    previous: SuspendedOrg[]
  ) => {
    const candidates = suspendedCandidates(previousRoles, claimed, previous);
    const profiles = Object.fromEntries(
      await Promise.all(
        candidates.map((id) =>
          getDoc(getDocumentReference(`orgs/${id}/public`, "profile"))
            .then((snapshot): [string, OrgProfile] => [id, snapshot.data() ?? {}])
            .catch((): [string, OrgProfile] => [id, null])
        )
      )
    );
    const next = nextSuspendedOrgs(candidates, profiles, previous);
    remember(uid, { suspendedOrgs: next });
    setSuspendedOrgs(next);
  };

  const applyRoles = (claimed: Record<string, OrgRole>, superAdmin: boolean, preferOrgId?: string) => {
    setRoles(claimed);
    setIsSuperAdmin(superAdmin);
    if (preferOrgId && claimed[preferOrgId]) {
      localStorage.setItem(ACTIVE_ORG_KEY, preferOrgId);
    }
    setActiveOrgId((current) => {
      const stored = localStorage.getItem(ACTIVE_ORG_KEY);
      if (preferOrgId && claimed[preferOrgId]) return preferOrgId;
      const ids = Object.keys(claimed).sort();
      return [current, stored].find((id) => id && claimed[id]) ?? ids[0];
    });
  };

  useEffect(() => {
    setIsLoading(true);
    loadClaims()
      .catch(() => {
        const last = user && remembered(user.uid);
        applyRoles(last?.roles ?? {}, last?.isSuperAdmin ?? false);
        setSuspendedOrgs(last?.suspendedOrgs ?? []);
      })
      .finally(() => setIsLoading(false));
  }, [loadClaims, user]);

  // Org names for the switcher. Offline, fall back to ids.
  useEffect(() => {
    const ids = Object.keys(roles);
    Promise.all(
      ids.map((id) =>
        getDoc(getDocumentReference("orgs", id))
          .then((snapshot) => ({ id, name: id, ...snapshot.data() }) as Org)
          .catch(() => ({ id, name: id }))
      )
    ).then(setOrgs);
  }, [roles]);

  useEffect(() => {
    setMember(null);
    if (!user || !activeOrgId) {
      return;
    }
    setIsMemberLoading(true);
    getDoc(getDocumentReference(`orgs/${activeOrgId}/members`, user.uid))
      .then((snapshot) => {
        const data = snapshot.exists() ? (snapshot.data() as OrgMember) : null;
        setMember(data);
        const members = { ...remembered(user.uid)?.members };
        if (data) members[activeOrgId] = data;
        else delete members[activeOrgId];
        remember(user.uid, { members });
      })
      .catch(() => setMember(remembered(user.uid)?.members[activeOrgId] ?? null))
      .finally(() => setIsMemberLoading(false));
  }, [user, activeOrgId]);

  const switchOrg = (orgId: string) => {
    if (!roles[orgId]) {
      return;
    }
    localStorage.setItem(ACTIVE_ORG_KEY, orgId);
    setActiveOrgId(orgId);
  };

  const setOrgContentVersion = (version: string) =>
    setOrgs((prev) => prev.map((o) => (o.id === activeOrgId ? { ...o, contentVersion: version } : o)));

  return {
    orgs,
    activeOrgId,
    activeOrg: orgs.find((o) => o.id === activeOrgId),
    orgRole: activeOrgId ? roles[activeOrgId] ?? null : null,
    member,
    isSuperAdmin,
    suspendedOrgs,
    // Plans assigned to a client are on the member doc, so wait for it too.
    isLoading: isLoading || isMemberLoading,
    switchOrg,
    refreshOrgs: (preferOrgId?: string) => loadClaims(true, preferOrgId),
    setOrgContentVersion,
  };
};
