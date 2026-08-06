import { useContext, useEffect, useState } from "react";
import AuthContext from "../../context/AuthContext";

import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router";
import { AuthLayout } from "./AuthLayout";
import { Loading } from "../helpers/Loading";
import { Input, Button } from "@dyordsabuzo/ui-components";

export const Login = () => {
  const authContext = useContext(AuthContext);
  const { user, isLoading, loginWithEmailAndPassword, loginWithGoogle, error } =
    authContext;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginClicked, setLoginClicked] = useState(false);

  const loginHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    loginWithEmailAndPassword(email, password);
    setLoginClicked(true);
  };

  const loginWithGoogleHandler = () => {
    loginWithGoogle();
    setLoginClicked(true);
  };

  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      navigate("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <AuthLayout
      heroHeadline="Plan smarter. Train harder."
      heroSubtext="Everything you need to build, run, and stick to your training program."
    >
      <form
        onSubmit={loginHandler}
        className="flex flex-col gap-2 w-full rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 bg-white dark:bg-surface-dark"
      >
        <h2 className="text-2xl font-bold py-2 text-text-light dark:text-text-dark">Login</h2>
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          required={true}
          changeValue={(input) => {
            setEmail(input);
          }}
        />
        <div className="flex flex-col gap-1 mb-4">
          <Input
            type="password"
            placeholder="Password"
            changeValue={(input) => {
              setPassword(input);
            }}
            value={password}
            required={true}
          />
          <button
            type="button"
            className="min-h-11 text-xs flex justify-end items-center text-primary hover:underline hover:text-primary-700 font-semibold
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot password?
          </button>
          {loginClicked && error && (
            <span className="text-xs text-danger">{error}</span>
          )}
        </div>

        <Button type="submit">
          <span className="flex items-center place-self-center gap-2 p-2">
            <FontAwesomeIcon size="lg" icon={faUser} />
            Login
          </span>
        </Button>
        <Button
          onClick={loginWithGoogleHandler}
          decoration="custom"
          className="min-h-11 bg-success-600 text-white hover:bg-success-700 font-bold rounded px-2"
        >
          <span className="flex items-center place-self-center gap-2 p-2">
            <FontAwesomeIcon size="lg" icon={faGoogle} />
            Login with Google
          </span>
        </Button>

        <div className="flex text-xs text-text-muted-light dark:text-text-muted-dark gap-1 justify-center py-3">
          <span>Don't have an account?</span>
          <button
            type="button"
            className="text-primary hover:underline hover:text-primary-700 font-semibold
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            onClick={() => navigate("/signup")}
          >
            Sign up
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

// const LoginForm = (props) => {
//   const authContext = useContext(AuthContext);
//   const {
//     user,
//     logInWithEmailAndPassword,
//     // registerWithEmailAndPassword,
//     // signInWithGoogle,
//     logout,
//     error,
//   } = authContext;

//   const loginHandler = () => {
//     console.log(email, password);
//     logInWithEmailAndPassword(email, password);
//     // props.closeLoginForm();
//   };

//   // const registerHandler = () => {
//   //   signInWithGoogle();
//   // };

//   const logoutHandler = () => {
//     logout();
//     props.closeLoginForm();
//   };

//   return (
//     <div className={styles.form}>
//       {error && <div>{error}</div>}
//       {!user && (
//         <>
//           <Input
//             type="email"
//             placeholder="Email address"
//             value={email}
//             onInputPassed={(input) => {
//               setEmail(input);
//             }}
//           />
//           <Input
//             type="password"
//             placeholder="Password"
//             onInputPassed={(input) => {
//               setPassword(input);
//             }}
//             value={password}
//           />

//           <Button onClick={loginHandler} className={styles.button}>
//             <span className={styles.label}>
//               <UilSignInAlt />
//               Login
//             </span>
//           </Button>
//           {/*<Button onClick={registerHandler} className={styles.button}>
//             <span className={styles.label}>
//               <UilGoogle />
//               Login with Google
//             </span>
//           </Button>*/}
//         </>
//       )}
//       {user && user.verified && (
//         <>
//           <p>
//             Hi, {user.name || user.displayName}! You are currently logged in!
//           </p>
//           <Button onClick={logoutHandler} className={styles.button}>
//             Logout
//           </Button>
//         </>
//       )}
//     </div>
//   );
// };

// export default LoginForm;
