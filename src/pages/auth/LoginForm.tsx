import { useContext, useEffect, useState } from "react";
import AuthContext from "../../context/AuthContext";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router";
import { Loading } from "../helpers/Loading";
import { Input, Button } from "@dyordsabuzo/ui-components";
import { FIELD, PRIMARY_BUTTON, TEXT_LINK } from "./authStyles";
import { GoogleButton, OrDivider } from "./GoogleButton";

export const LoginForm = () => {
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
    <form onSubmit={loginHandler} className="flex flex-col gap-4 w-full">
      <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Log in</h2>
      <GoogleButton label="Sign in with Google" onClick={loginWithGoogleHandler} />
      <OrDivider label="or log in with email" />
      <div className="flex flex-col gap-2">
        <Input
          className={FIELD}
          type="email"
          placeholder="Email address"
          value={email}
          required={true}
          changeValue={(input) => {
            setEmail(input);
          }}
        />
        <Input
          className={FIELD}
          type="password"
          placeholder="Password"
          changeValue={(input) => {
            setPassword(input);
          }}
          value={password}
          required={true}
        />
        <button type="button" className={`${TEXT_LINK} self-end`} onClick={() => navigate("/forgot-password")}>
          Forgot password?
        </button>
        {loginClicked && error && <span className="text-xs text-danger">{error}</span>}
      </div>

      <Button type="submit" decoration="custom" className={PRIMARY_BUTTON}>
        <FontAwesomeIcon icon={faUser} />
        Log in
      </Button>
    </form>
  );
};
