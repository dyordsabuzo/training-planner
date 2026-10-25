import { createContext, useState, useEffect, ReactNode } from "react";
import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  verifyPasswordResetCode,
  confirmPasswordReset,
  User,
  connectAuthEmulator,
} from "firebase/auth";
import { getDocumentReference } from "../common/firebase";
import { getDoc, setDoc } from "firebase/firestore";
import { clearQueryCache } from "../common/queryCache";
import { forgetMembership, isTrainerRole, Org, OrgMember, OrgRole, useOrgMembership } from "./useOrgMembership";

type _Props = {
  children: ReactNode;
};

export type UserPermission = {
  // "admin" for an owner or trainer of the active org, otherwise "user".
  role: string;
  // Plans assigned on the active org's member doc.
  plans: string[];
  firstName?: string;
  lastName?: string;
  email?: string;
  displayName?: string;
  // Set when a user with no granted plans asks an administrator for access.
  // Cleared by an admin (granting a plan, or dismissing it) in UserForm.
  accessRequested?: boolean;
  accessRequestedAt?: string;
  accessRequestNote?: string;
};

const AuthContext = createContext({
  isLoggedIn: false,
  isLoading: false,
  error: null,
  user: null as User | null,
  data: null as any,
  // isEmailVerified: false as boolean,
  userPermission: null as UserPermission | null,
  isRealAdmin: false,
  isPreviewingAsUser: false,
  setPreviewAsUser: (flag: boolean) => {},
  // Read-only "view as" a specific user for troubleshooting (admin only).
  effectiveUid: undefined as string | undefined,
  isImpersonating: false,
  impersonatedUser: null as (UserPermission & { uid: string }) | null,
  startImpersonation: async (uid: string) => {},
  stopImpersonation: () => {},
  // Active org (see useOrgMembership). Content is read from orgs/{activeOrgId}.
  orgs: [] as Org[],
  activeOrgId: undefined as string | undefined,
  activeOrg: undefined as Org | undefined,
  orgRole: null as OrgRole | null,
  isSuperAdmin: false,
  switchOrg: (orgId: string) => {},
  // Re-reads memberships after a change; preferOrgId becomes the active org.
  refreshOrgs: async (preferOrgId?: string) => {},
  setOrgContentVersion: (version: string) => {},
  loginWithGoogle: () => {},
  registerWithEmailAndPassword: (email: string, password: string) => {},
  sendPasswordReset: (email: string) => {},
  loginWithEmailAndPassword: (email: string, password: string) => {},
  verifyResetCode: (actionCode: string) => {},
  confirmReset: (actionCode: string, password: string) => {},
  logoutUser: () => {},
  getUserProfileImage: () => {},
  getUid: () => {},
  updateProfile: (data: { firstName?: string; lastName?: string }) => {},
  requestAccess: (note?: string) => {},
});

export const AuthContextProvider: React.FC<_Props> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorObject, setErrorObject] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userPermission, setUserPermission] = useState<UserPermission | null>(
    null
  );
  const [data, setData] = useState<any>(null);
  const [isPreviewingAsUser, setIsPreviewingAsUser] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<
    (UserPermission & { uid: string }) | null
  >(null);
  const membership = useOrgMembership(user);

  useEffect(() => {
    const app = initializeApp({
      apiKey: import.meta.env.VITE_FBASE_APIKEY,
      authDomain: import.meta.env.VITE_FBASE_AUTHDOMAIN,
      projectId: import.meta.env.VITE_FBASE_PROJECTID,
      appId: import.meta.env.VITE_FBASE_APPID,
    });

    const auth = getAuth(app);

    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR !== "false") {
      connectAuthEmulator(auth, "http://localhost:9099");
    }

    setAuth(auth);
    onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // TODO: check if email is verified
        // localStorage.setItem("isLoggedIn", "1");
        setIsLoggedIn(true);
      } else {
        // localStorage.removeItem("isLoggedIn");
        setIsLoggedIn(false);
        setUserPermission(null);
        setIsPreviewingAsUser(false);
        setImpersonatedUser(null);
        forgetMembership();
        clearQueryCache();
      }
      setIsLoading(false);
    });

    return () => {};
  }, []);

  useEffect(() => {
    if (user) {
      const docRef = getDocumentReference("users", user.uid);
      getDoc(docRef).then(async (snapshot) => {
        if (snapshot.exists()) {
          const existing = snapshot.data() as UserPermission;

          // A doc created before auto-provisioning existed (e.g. a role
          // manually set to "admin" via the Firestore console) may be
          // missing email/displayName entirely — backfill from the live
          // Auth record so the Users admin table has something to show.
          if (!existing.email) {
            const patch = { email: user.email ?? "", displayName: user.displayName ?? "" };
            await setDoc(docRef, patch, { merge: true });
            setUserPermission({ ...existing, ...patch });
            return;
          }

          setUserPermission(existing);
          return;
        }

        // First login for this account (any sign-in method) — no
        // users/{uid} doc exists yet, so provision a profile. Access comes
        // from org membership, not from this doc.
        const defaultPermission: UserPermission = { role: "user", plans: [] };
        await setDoc(docRef, {
          email: user.email ?? "",
          displayName: user.displayName ?? "",
          createdAt: new Date().toISOString(),
        });
        setUserPermission(defaultPermission);
      });
    } else {
      setUserPermission(null);
    }
    return () => {};
  }, [user]);

  const loginWithGoogle = async () => {
    try {
      setErrorObject(null);
      const googleProvider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, googleProvider);
      const [firstName, lastName] = (res.user.displayName as string).split(" ");
      console.log(`Welcome ${firstName} ${lastName}`);
    } catch (err: any) {
      console.error("Google sign-in failed:", err);
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        return;
      }
      if (err?.code === "auth/popup-blocked") {
        setErrorObject("Your browser blocked the sign-in popup. Please allow popups for this site and try again.");
      } else if (err?.code === "auth/unauthorized-domain") {
        setErrorObject("This domain isn't authorized for Google sign-in yet. Please contact the administrator.");
      } else {
        setErrorObject("Unable to sign in with Google. Please try again.");
      }
    }
  };

  const _signinUser = async (email: string, password: string) => {
    return new Promise((resolve, reject) => {
      return signInWithEmailAndPassword(auth, email, password)
        .then((user) => resolve(user))
        .catch((err) => reject(err));
    });
  };

  const _signOutUser = async () => {
    return new Promise((resolve, reject) => {
      return signOut(auth)
        .then((user) => resolve(user))
        .catch((err) => reject(err));
    });
  };

  const _registerUser = async (email: string, password: string) => {
    return new Promise((resolve, reject) => {
      return createUserWithEmailAndPassword(auth, email, password)
        .then((user) => resolve(user))
        .catch((err) => reject(err));
    });
  };

  const _verifyEmail = async (user: any) => {
    // TODO: Revisit page design for verified email (redirect to homepage)
    return new Promise((resolve, reject) => {
      return sendEmailVerification(auth.currentUser)
        .then((user) => resolve(user))
        .catch((err) => reject(err));
    });
  };

  const loginWithEmailAndPassword = async (email: string, password: string) => {
    try {
      setErrorObject(null);
      const res: any = await _signinUser(email, password);
      setUser(res.user);
    } catch (err) {
      setErrorObject("Authentication error.  Invalid email/password.");
    }
  };

  const _verifyResetCode = async (actionCode: string) => {
    return new Promise((resolve, reject) => {
      return verifyPasswordResetCode(auth, actionCode)
        .then((user) => resolve(user))
        .catch((err) => reject(err));
    });
  };

  const _confirmReset = async (actionCode: string, password: string) => {
    return new Promise((resolve, reject) => {
      return confirmPasswordReset(auth, actionCode, password)
        .then((user) => resolve(user))
        .catch((err) => reject(err));
    });
  };

  const verifyResetCode = async (actionCode: string) => {
    try {
      setData(null);
      setErrorObject(null);
      setIsLoading(true);
      const response: any = await _verifyResetCode(actionCode);
      setData(response);
    } catch (err) {
      setErrorObject("Invalid password reset link");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmReset = async (actionCode: string, password: string) => {
    try {
      setErrorObject(null);
      setIsLoading(true);
      await _confirmReset(actionCode, password);
    } catch (err) {
      setErrorObject("Unable to perform password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmailAndPassword = async (
    email: string,
    password: string
  ) => {
    try {
      const response: any = await _registerUser(email, password);
      await _verifyEmail(response.user);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const logoutUser = async () => {
    _signOutUser();
    setUser(null);
  };

  const sendPasswordReset = async (email: string) => {
    try {
      setIsLoading(true);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setErrorObject(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserProfileImage = () => {
    if (user) {
      return user.photoURL;
    }
    return null;
  };

  const getUid = () => {
    return user?.uid;
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string }) => {
    if (!user || impersonatedUser) {
      return;
    }
    const docRef = getDocumentReference("users", user.uid);
    await setDoc(docRef, data, { merge: true });
    setUserPermission((prev) => (prev ? { ...prev, ...data } : prev));
  };

  // Self-service: a user with no granted plans asks an admin for access.
  // Written to the user's own doc, same as updateProfile above — an admin
  // sees and clears it from the Users admin screen (see UserForm.tsx).
  const requestAccess = async (note?: string) => {
    if (!user || impersonatedUser) {
      return;
    }
    const patch = {
      accessRequested: true,
      accessRequestedAt: new Date().toISOString(),
      ...(note?.trim() && { accessRequestNote: note.trim() }),
    };
    const docRef = getDocumentReference("users", user.uid);
    await setDoc(docRef, patch, { merge: true });
    setUserPermission((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  // A generic non-admin preview, not impersonation of a specific account: it
  // only ever downgrades what the client believes its own role is, never
  // upgrades it, and Firestore rules check the real auth token regardless —
  // so this can't grant access, only hide admin-only UI for the real admin.
  // Role and plans come from the active org's membership, not users/{uid}
  // (which now only holds the profile and access requests).
  const isRealAdmin = isTrainerRole(membership.orgRole);
  const orgPermission: UserPermission | null = userPermission && {
    ...userPermission,
    role: isRealAdmin ? "admin" : "user",
    plans: membership.member?.assignedPlanIds ?? [],
  };
  const effectiveUserPermission = impersonatedUser
    ? impersonatedUser
    : isPreviewingAsUser && orgPermission
      ? { ...orgPermission, role: "user" }
      : orgPermission;

  // Impersonation is client-side only: queries still run with the admin's
  // real auth token, so Firestore rules must allow admins to read the
  // target's docs. All writes are blocked while it is active (read-only).
  const isImpersonating = !!impersonatedUser;
  const effectiveUid = impersonatedUser?.uid ?? user?.uid;

  const startImpersonation = async (uid: string) => {
    if (!isRealAdmin || !membership.activeOrgId || uid === user?.uid) {
      return;
    }
    const snapshot = await getDoc(getDocumentReference(`orgs/${membership.activeOrgId}/members`, uid));
    if (!snapshot.exists()) {
      return;
    }
    const target = snapshot.data() as OrgMember;
    setIsPreviewingAsUser(false);
    setImpersonatedUser({
      uid,
      role: isTrainerRole(target.role) ? "admin" : "user",
      plans: target.assignedPlanIds ?? [],
      email: target.email ?? "",
      displayName: target.displayName ?? "",
    });
  };

  const stopImpersonation = () => setImpersonatedUser(null);

  const setPreviewAsUser = (flag: boolean) => {
    if (flag && !isRealAdmin) {
      return;
    }
    setIsPreviewingAsUser(flag);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: isLoggedIn,
        // Wait for org claims too, or pages would briefly show "no access".
        isLoading: isLoading || (!!user && membership.isLoading),
        error: errorObject,
        user: user,
        data: data,
        // isEmailVerified: user?.emailVerified,
        userPermission: effectiveUserPermission,
        isRealAdmin,
        isPreviewingAsUser,
        setPreviewAsUser,
        effectiveUid,
        isImpersonating,
        impersonatedUser,
        startImpersonation,
        stopImpersonation,
        orgs: membership.orgs,
        activeOrgId: membership.activeOrgId,
        activeOrg: membership.activeOrg,
        orgRole: membership.orgRole,
        isSuperAdmin: membership.isSuperAdmin,
        switchOrg: (orgId: string) => {
          setImpersonatedUser(null);
          setIsPreviewingAsUser(false);
          membership.switchOrg(orgId);
        },
        refreshOrgs: membership.refreshOrgs,
        setOrgContentVersion: membership.setOrgContentVersion,
        loginWithGoogle: loginWithGoogle,
        loginWithEmailAndPassword: loginWithEmailAndPassword,
        registerWithEmailAndPassword: registerWithEmailAndPassword,
        sendPasswordReset: sendPasswordReset,
        verifyResetCode,
        logoutUser: logoutUser,
        getUserProfileImage: getUserProfileImage,
        getUid: getUid,
        updateProfile,
        requestAccess,
        confirmReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export default AuthContext;
