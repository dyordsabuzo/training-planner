import { useContext, useState } from "react";

import AuthContext from "../../context/AuthContext";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUser } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router";
import { AuthLayout } from "./AuthLayout";
import { Input, Button } from "@dyordsabuzo/ui-components";

export const Signup = () => {
  const authContext = useContext(AuthContext);
  const { registerWithEmailAndPassword } = authContext;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const signupHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    registerWithEmailAndPassword(email, password);
    navigate("/");
  };

  const navigate = useNavigate();

  return (
    <AuthLayout
      heroHeadline="Start your training journey."
      heroSubtext="Create an account to build custom plans and track every workout."
    >
      <form
        onSubmit={signupHandler}
        className="flex flex-col gap-4 w-full rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 bg-white dark:bg-surface-dark"
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold py-2 text-text-light dark:text-text-dark">Sign up</h2>
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            required={true}
            changeValue={(input) => {
              setEmail(input);
            }}
          />
          <Input
            type="password"
            placeholder="Password"
            required={true}
            changeValue={(input) => {
              setPassword(input);
            }}
            value={password}
          />
          <Input
            type="password"
            placeholder="Confirm password"
            required={true}
            changeValue={(input) => {
              setConfirmPassword(input);
            }}
            value={confirmPassword}
          />
          {password && confirmPassword && password !== confirmPassword && (
            <span className="text-xs text-danger py-2">
              Passwords must match
            </span>
          )}
        </div>

        <Button type="submit">
          <span className="flex items-center place-self-center gap-2 p-2">
            <FontAwesomeIcon size="lg" icon={faUser} />
            Sign up
          </span>
        </Button>

        <button
          type="button"
          className="min-h-11 text-sm text-primary hover:underline hover:text-primary-700 font-semibold flex items-center gap-1
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          onClick={() => navigate("/Login")}
        >
          <FontAwesomeIcon size="lg" icon={faArrowLeft} />
          Login
        </button>
      </form>
    </AuthLayout>
  );
};
