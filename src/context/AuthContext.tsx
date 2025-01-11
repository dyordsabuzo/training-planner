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
} from "firebase/auth";
import { getDocumentReference } from "../common/firebase";
import { getDoc } from "firebase/firestore";

type _Props = {
  children: ReactNode;
};

export type UserPermission = {
  role: string;
  plans: string[];
};

const AuthContext = createContext({
  isLoggedIn: false,
  isLoading: false,
  error: null,
  user: null,
  data: null as any,
  // loading: false,
  isEmailVerified: false,
  userPermission: null as UserPermission | null,
  loginWithGoogle: () => {},
  registerWithEmailAndPassword: (email: string, password: string) => {},
  sendPasswordReset: (email: string) => {},
  loginWithEmailAndPassword: (email: string, password: string) => {},
  verifyResetCode: (actionCode: string) => {},
  confirmReset: (actionCode: string, password: string) => {},
  logoutUser: () => {},
  getUserProfileImage: () => {},
  getUid: () => {},
});

export const AuthContextProvider: React.FC<_Props> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorObject, setErrorObject] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [userPermission, setUserPermission] = useState<UserPermission | null>(
    null
  );
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const app = initializeApp({
      apiKey: process.env.REACT_APP_FBASE_APIKEY,
      authDomain: process.env.REACT_APP_FBASE_AUTHDOMAIN,
      projectId: process.env.REACT_APP_FBASE_PROJECTID,
      appId: process.env.REACT_APP_FBASE_APPID,
    });

    const auth = getAuth(app);
    setAuth(auth);
    onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // TODO: check if email is verified
        localStorage.setItem("isLoggedIn", "1");
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem("isLoggedIn");
        setIsLoggedIn(false);
        setUserPermission(null);
      }
      setIsLoading(false);
    });

    return () => {};
  }, []);

  useEffect(() => {
    if (user) {
      const docRef = getDocumentReference("users", user.uid);
      getDoc(docRef).then((doc) => {
        setUserPermission(doc.data() as UserPermission);
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
    } catch (err) {
      setErrorObject("Authentication error.  Invalid email/password.");
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

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: isLoggedIn,
        isLoading: isLoading,
        error: errorObject,
        user: user,
        data: data,
        // loading: loading,
        isEmailVerified: user?.emailVerified,
        userPermission: userPermission,
        loginWithGoogle: loginWithGoogle,
        loginWithEmailAndPassword: loginWithEmailAndPassword,
        registerWithEmailAndPassword: registerWithEmailAndPassword,
        sendPasswordReset: sendPasswordReset,
        verifyResetCode,
        logoutUser: logoutUser,
        getUserProfileImage: getUserProfileImage,
        getUid: getUid,
        confirmReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export default AuthContext;
