import { useContext, useState } from "react";

import AuthContext from "../../context/AuthContext";
import { Input } from "../../components/form/Input";
import { Button } from "../../components/form/Button";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router";
import WrapperPage from "../WrapperPage";

export const Login = () => {
  const authContext = useContext(AuthContext);
  const { user, loginWithEmailAndPassword, loginWithGoogle, error } =
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
  if (user) {
    navigate("/");
  }

  return (
    <WrapperPage>
      <div className="flex flex-col gap-4 place-items-center py-4">
        <div className="flex flex-col gap-2 w-full px-2 pb-4">
          <span>Hi there!</span>
          <span>Welcome to Training Planner</span>
        </div>
        <form
          onSubmit={loginHandler}
          className="flex flex-col gap-2 w-full border-2 border-gray-300 rounded-t-3xl p-4"
        >
          <span className="text-2xl font-bold py-2">Login</span>
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
            <span
              className="text-xs flex justify-end text-blue-500 hover:underline hover:text-blue-700 font-semibold cursor-pointer"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </span>
            {loginClicked && error && (
              <span className="text-xs text-red-500">{error}</span>
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
            className="bg-green-500 text-white hover:bg-green-700 font-bold rounded px-2"
          >
            <span className="flex items-center place-self-center gap-2 p-2">
              <FontAwesomeIcon size="lg" icon={faGoogle} />
              Login with Google
            </span>
          </Button>

          <div className="flex text-xs text-gray-500 gap-1 justify-center py-3">
            <span>Don't have an account?</span>
            <span
              className="text-blue-500 hover:underline hover:text-blue-700 font-semibold cursor-pointer"
              onClick={() => navigate("/signup")}
            >
              Sign up
            </span>
          </div>
        </form>
      </div>
    </WrapperPage>
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
