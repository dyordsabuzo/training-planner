import { createContext, ReactNode, useContext, useState } from "react";
import { getDocs, setDoc, updateDoc } from "firebase/firestore";
import { callFunction, getCollection, getDocumentReference } from "../common/firebase";
import AuthContext from "./AuthContext";
import AppSettingsContext from "./AppSettingsContext";
import { isTrainerRole, OrgMember, OrgRole } from "./useOrgMembership";

export type AppUser = {
  id: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  // "admin" for an owner or trainer of the active org, otherwise "user".
  role: string;
  // Plans assigned in the active org.
  plans: string[];
  // Not a member of the active org yet (e.g. only asked for access).
  isMember?: boolean;
  isOwner?: boolean;
  // Role in the active org (undefined when not a member).
  orgRole?: OrgRole;
  // Trainers assigned to a client (see setClientTrainers).
  trainerUids?: string[];
  // Set when the user asked for access from the Home page while they had
  // no granted plans. Cleared in UserForm once an admin grants a plan or
  // explicitly dismisses it.
  accessRequested?: boolean;
  accessRequestedAt?: string;
  accessRequestNote?: string;
};

// A request is only pending while the user still has no plans. The flag can
// outlive a grant (e.g. the user asked again from a stale page after being
// granted), so a user with any granted plan never counts as waiting.
export const hasPendingAccessRequest = (user: AppUser) =>
  !!user.accessRequested && user.plans.length === 0;

const UserManagementContext = createContext({
  users: null as AppUser[] | null,
  fetchUsers: () => {},
  saveUser: (user: AppUser) => {},
  createUser: (user: AppUser) => {},
  saveTrainers: (uid: string, trainerUids: string[]) => {},
  // Last failed save, shown on the Users screen.
  saveError: null as string | null,
});

export default UserManagementContext;

type Props = {
  children: ReactNode;
};

const toAppUser = (id: string, profile: any, member?: OrgMember): AppUser => ({
  id,
  email: profile?.email ?? member?.email ?? "",
  displayName: profile?.displayName ?? member?.displayName ?? "",
  firstName: profile?.firstName ?? "",
  lastName: profile?.lastName ?? "",
  role: isTrainerRole(member?.role) ? "admin" : "user",
  plans: member?.assignedPlanIds ?? [],
  isMember: !!member,
  isOwner: member?.role === "owner",
  orgRole: member?.role,
  trainerUids: member?.trainerUids ?? [],
  accessRequested: profile?.accessRequested ?? false,
  accessRequestedAt: profile?.accessRequestedAt ?? "",
  accessRequestNote: profile?.accessRequestNote ?? "",
});

// User directory for the active org, kept separate from SourceDataContext
// (training content) since it's only needed on the Users tab and the
// trainer home page. Roles and plans live on orgs/{orgId}/members and are
// changed only through Cloud Functions. Profiles and access requests stay on
// users/{uid}, which only the platform admin can list.
export const UserManagementContextProvider: React.FC<Props> = ({ children }) => {
  const { activeOrgId, isSuperAdmin, user: currentUser, refreshOrgs } = useContext(AuthContext);
  const { functionsSuspended } = useContext(AppSettingsContext);
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!activeOrgId) {
      setUsers([]);
      return;
    }
    const [memberDocs, profileDocs] = await Promise.all([
      getDocs(getCollection(`orgs/${activeOrgId}/members`)),
      isSuperAdmin ? getDocs(getCollection("users")) : Promise.resolve(null),
    ]);
    const members = new Map(memberDocs.docs.map((doc) => [doc.id, doc.data() as OrgMember]));
    const profiles = new Map((profileDocs?.docs ?? []).map((doc) => [doc.id, doc.data()]));
    const ids = Array.from(new Set(Array.from(members.keys()).concat(Array.from(profiles.keys()))));
    setUsers(ids.map((id) => toAppUser(id, profiles.get(id), members.get(id))));
  };

  // Applies role and plan changes through the membership callables, adding
  // the user to the org first if needed.
  const saveMembership = async (user: AppUser, previous?: AppUser) => {
    const role = user.role === "admin" ? "trainer" : "client";
    const wantsAccess = user.role === "admin" || user.plans.length > 0;
    if (!previous?.isMember) {
      if (!wantsAccess) return;
      await callFunction("addMember", { orgId: activeOrgId, uid: user.id, role });
    } else if (!previous.isOwner && previous.role !== user.role) {
      await callFunction("setMemberRole", { orgId: activeOrgId, uid: user.id, role });
    }
    if (JSON.stringify(previous?.plans ?? []) !== JSON.stringify(user.plans)) {
      await callFunction("setAssignedPlans", { orgId: activeOrgId, uid: user.id, planIds: user.plans });
    }
  };

  const saveProfile = (user: AppUser, create: boolean) => {
    const profile = {
      email: user.email ?? "",
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      ...(!create && { accessRequested: user.accessRequested ?? false }),
    };
    const ref = getDocumentReference("users", user.id);
    return create ? setDoc(ref, profile) : updateDoc(ref, profile);
  };

  const save = async (user: AppUser, create: boolean) => {
    setSaveError(null);
    const previous = users?.find((u) => u.id === user.id);
    const membershipChanged =
      previous?.role !== user.role || JSON.stringify(previous?.plans ?? []) !== JSON.stringify(user.plans);
    if (membershipChanged && functionsSuspended) {
      setSaveError("Changing roles and plans is temporarily unavailable.");
      return;
    }
    try {
      if (isSuperAdmin) await saveProfile(user, create);
      if (membershipChanged) await saveMembership(user, previous);
      if (user.id === currentUser?.uid) await refreshOrgs();
      await fetchUsers();
    } catch (error: any) {
      console.error("Unable to save user", error);
      setSaveError(error?.message ?? "Unable to save this user.");
    }
  };

  const saveUser = (user: AppUser) => save(user, false);

  // Platform-admin repair path for a Firebase Auth account that has no
  // users/{uid} doc at all yet — e.g. created directly in the Firebase
  // console, or the browser closed before the app finished auto-provisioning
  // it on first login. The admin supplies the UID themselves (copied from
  // the console), since looking up an Auth account by email requires the
  // Admin SDK, which this client-only app doesn't have.
  const createUser = (user: AppUser) => save(user, true);

  const saveTrainers = async (uid: string, trainerUids: string[]) => {
    setSaveError(null);
    if (functionsSuspended) {
      setSaveError("Changing trainers is temporarily unavailable.");
      return;
    }
    try {
      await callFunction("setClientTrainers", { orgId: activeOrgId, uid, trainerUids });
      await fetchUsers();
    } catch (error: any) {
      console.error("Unable to save trainers", error);
      setSaveError(error?.message ?? "Unable to save the trainers.");
    }
  };

  return (
    <UserManagementContext.Provider value={{ users, fetchUsers, saveUser, createUser, saveTrainers, saveError }}>
      {children}
    </UserManagementContext.Provider>
  );
};
