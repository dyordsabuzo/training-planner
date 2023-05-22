import {createContext, useState, useEffect, ReactNode} from "react";
import {initializeApp} from "firebase/app";
import {useMutation, gql} from "@apollo/client";
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
} from "firebase/auth";
// import { useNavigate } from "react-router-dom";
import {VERIFY_USER} from "./gql/AuthGQL";

type _Props = {
    children: ReactNode
}

const AuthContext = createContext({
    isLoggedIn: false,
    isLoading: false,
    error: null,
    user: null,
    loading: false,
    isEmailVerified: false,
    userPermission: null,
    loginWithGoogle: () => {
    },
    registerWithEmailAndPassword: (email: string,
                                   password: string,
                                   firstName: string,
                                   lastName: string) => {
    },
    sendPasswordReset: (email: string) => {
    },
    loginWithEmailAndPassword: (email: string, password: string) => {
    },
    logoutUser: () => {
    },
    getUserProfileImage: () => {
    },
    getUid: () => {
    }
});

export const AuthContextProvider: React.FC<_Props> = ({children}) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorObject, setErrorObject] = useState<any>(null);
    const [auth, setAuth] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [userPermission, setUserPermission] = useState(null);
    const [verifyUser, {data, loading, error}] = useMutation(VERIFY_USER);

    // const navigate = useNavigate();

    useEffect(() => {
        const app = initializeApp({
            apiKey: process.env.REACT_APP_FBASE_API_KEY,
            appId: process.env.REACT_APP_FBASE_APP_ID,
            messagingSenderId: process.env.REACT_APP_FBASE_MSG_SENDER_ID,
            authDomain: process.env.REACT_APP_FBASE_AUTH_DOMAIN,
            projectId: process.env.REACT_APP_FBASE_PROJECT_ID,
            storageBucket: process.env.REACT_APP_FBASE_STORAGE_BUCKET,
        });

        const auth = getAuth(app);
        setAuth(auth);
        onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user) {
                // navigate user to email verify if email is unverified
                if (!user.emailVerified) {
                    // navigate("/emailVerify");
                    console.log('email verified')
                } else {
                    _verifyUserObject({
                        user: {
                            authProvider: "unknown",
                            uid: user.uid,
                        },
                    });
                    localStorage.setItem("isLoggedIn", "1");
                    setIsLoggedIn(true);
                    // navigate("/");
                }
            } else {
                localStorage.removeItem("isLoggedIn");
                setIsLoggedIn(false);
                setUserPermission(null);
            }
            setIsLoading(false);
        });

        return () => {
        };
    }, []);

    useEffect(() => {
        if (error) {
            console.error(error);
            setErrorObject(
                "Unable to authencate at this time,  Please contact administrator."
            );
        }
        return () => {
        };
    }, [error]);

    useEffect(() => {
        if (data?.verify) {
            setUserPermission(data.verify);
        }
        return () => {
        };
    }, [data]);

    const _verifyUserObject = (variables: any) => {
        verifyUser({
            variables: variables,
        });
    };

    const loginWithGoogle = async () => {
        try {
            setErrorObject(null);
            const googleProvider = new GoogleAuthProvider();
            const res = await signInWithPopup(auth, googleProvider);
            const [firstName, lastName] = (res.user.displayName as string).split(" ");

            _verifyUserObject({
                user: {
                    authProvider: "google",
                    uid: res.user.uid,
                    firstName: firstName,
                    lastName: lastName,
                    createDate: Date().toString(),
                },
            });
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
            const response: any = await _signinUser(email, password);
            _verifyUserObject({
                user: {
                    authProvider: "local",
                    uid: response.user.uid,
                    lastLoginDate: Date().toString(),
                },
            });
        } catch (err) {
            throw err;
        }
    };

    const registerWithEmailAndPassword = async (
        email: string,
        password: string,
        firstName: string,
        lastName: string
    ) => {
        try {
            const response: any = await _registerUser(email, password);
            await _verifyEmail(response.user);

            // store user data in system
            // store basic user info to system
            // store uid, firstname, lastname and agreement
            _verifyUserObject({
                user: {
                    authProvider: "local",
                    uid: response.user.uid,
                    firstName: firstName,
                    lastName: lastName,
                    createDate: Date().toString(),
                },
            });
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const logoutUser = async () => {
        try {
            await _signOutUser();
            setUser(null);
        } catch (err) {
            throw err;
        }
    };

    const sendPasswordReset = async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
            alert("Password reset link sent!");
        } catch (err: any) {
            console.error(err);
            setErrorObject(err);
            alert(err.message);
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
                loading: loading,
                isEmailVerified: user?.emailVerified,
                userPermission: userPermission,
                loginWithGoogle: loginWithGoogle,
                loginWithEmailAndPassword: loginWithEmailAndPassword,
                registerWithEmailAndPassword: registerWithEmailAndPassword,
                sendPasswordReset: sendPasswordReset,
                logoutUser: logoutUser,
                getUserProfileImage: getUserProfileImage,
                getUid: getUid,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
export default AuthContext;
