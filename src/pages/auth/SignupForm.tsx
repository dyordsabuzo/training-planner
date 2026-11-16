import { useContext, useEffect, useState } from "react";

import AuthContext from "../../context/AuthContext";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router";
import { Input, Button } from "@dyordsabuzo/ui-components";
import { FIELD, PRIMARY_BUTTON } from "./authStyles";
import { GoogleButton, OrDivider } from "./GoogleButton";

export const SignupForm = () => {
  const authContext = useContext(AuthContext);
  const { user, registerWithEmailAndPassword, loginWithGoogle, error } = authContext;
  const [googleClicked, setGoogleClicked] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const signupHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    registerWithEmailAndPassword(email, password);
    navigate("/");
  };

  const navigate = useNavigate();
  // Google creates the account on first sign-in; then go to Home.
  useEffect(() => {
    if (user) navigate("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const signupWithGoogleHandler = () => {
    loginWithGoogle();
    setGoogleClicked(true);
  };

  return (
    <form onSubmit={signupHandler} className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Sign up</h2>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
          Quickest with Google: no new password to remember.
        </p>
      </div>
      <GoogleButton label="Sign up with Google" onClick={signupWithGoogleHandler} />
      {googleClicked && error && <span className="text-xs text-danger">{error}</span>}
      <OrDivider label="or sign up with email" />
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
          required={true}
          changeValue={(input) => {
            setPassword(input);
          }}
          value={password}
        />
        <Input
          className={FIELD}
          type="password"
          placeholder="Confirm password"
          required={true}
          changeValue={(input) => {
            setConfirmPassword(input);
          }}
          value={confirmPassword}
        />
        {password && confirmPassword && password !== confirmPassword && (
          <span className="text-xs text-danger">Passwords must match</span>
        )}
      </div>

      <Button type="submit" decoration="custom" className={PRIMARY_BUTTON}>
        <FontAwesomeIcon icon={faUser} />
        Sign up
      </Button>
    </form>
  );
};
