import { createContext, ReactNode, useState } from "react";
import { getDocs, setDoc, updateDoc } from "firebase/firestore";
import { getCollection, getDocumentReference } from "../common/firebase";

export type AppUser = {
  id: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  plans: string[];
};

const UserManagementContext = createContext({
  users: null as AppUser[] | null,
  fetchUsers: () => {},
  saveUser: (user: AppUser) => {},
  createUser: (user: AppUser) => {},
});

export default UserManagementContext;

type Props = {
  children: ReactNode;
};

// Admin-only user directory, kept separate from SourceDataContext (which is
// scoped to training content — exercises/supersets/sessions/plans) since
// the user list is a different domain, only ever needed on the admin
// Users tab, and shouldn't be fetched on every app load for every user.
export const UserManagementContextProvider: React.FC<Props> = ({ children }) => {
  const [users, setUsers] = useState<AppUser[] | null>(null);

  const fetchUsers = async () => {
    const snapshot = await getDocs(getCollection("users"));
    const data: AppUser[] = snapshot.docs.map((doc) => {
      const docData: any = doc.data();
      return {
        id: doc.id,
        email: docData.email ?? "",
        displayName: docData.displayName ?? "",
        firstName: docData.firstName ?? "",
        lastName: docData.lastName ?? "",
        role: docData.role ?? "user",
        plans: docData.plans ?? [],
      };
    });
    setUsers(data);
  };

  const saveUser = async (user: AppUser) => {
    await updateDoc(getDocumentReference("users", user.id), {
      email: user.email ?? "",
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      role: user.role,
      plans: user.plans,
    });
    setUsers((prev) => (prev ?? []).map((u) => (u.id === user.id ? user : u)));
  };

  // Admin-only repair path for a Firebase Auth account that has no
  // users/{uid} doc at all yet — e.g. created directly in the Firebase
  // console, or the browser closed before the app finished auto-provisioning
  // it on first login. The admin supplies the UID themselves (copied from
  // the console), since looking up an Auth account by email requires the
  // Admin SDK, which this client-only app doesn't have.
  const createUser = async (user: AppUser) => {
    await setDoc(getDocumentReference("users", user.id), {
      email: user.email ?? "",
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      role: user.role,
      plans: user.plans,
    });
    setUsers((prev) => [...(prev ?? []), user]);
  };

  return (
    <UserManagementContext.Provider value={{ users, fetchUsers, saveUser, createUser }}>
      {children}
    </UserManagementContext.Provider>
  );
};
