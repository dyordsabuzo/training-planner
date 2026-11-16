import { useContext, useEffect, useState } from "react";
import AuthContext from "../../context/AuthContext";

import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router";
import { Loading } from "../helpers/Loading";
import { Input, Button } from "@dyordsabuzo/ui-components";

// onSwitch: show the sign-up form instead (the landing page's auth panel).
export const LoginForm = ({ onSwitch }: { onSwitch?: () => void }) => {
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
          onClick={() => (onSwitch ? onSwitch() : navigate("/signup"))}
        >
          Sign up
        </button>
      </div>
    </form>
  );
};
