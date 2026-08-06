import { useContext, useState } from "react";

import AuthContext from "../../context/AuthContext";

import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router";
import { AuthLayout } from "./AuthLayout";
import { Loading } from "../helpers/Loading";
import { Input, Button } from "@dyordsabuzo/ui-components";

export const ForgotPassword = () => {
  const authContext = useContext(AuthContext);
  const { sendPasswordReset, error, isLoading } = authContext;

  const [email, setEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const forgotPasswordHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendPasswordReset(email);
    setResetSent(true);
  };

  const navigate = useNavigate();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <AuthLayout
      heroHeadline="Forgot your password?"
      heroSubtext="No worries — we'll send you a link to get back into your account."
    >
      <div className="flex flex-col gap-4 w-full rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 bg-white dark:bg-surface-dark">
        <form
          onSubmit={forgotPasswordHandler}
          className="flex flex-col gap-2 w-full"
        >
          <h2 className="text-2xl font-bold py-2 text-text-light dark:text-text-dark">
            Forgot your password?
          </h2>
          <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
            Enter your email address and we will send you a link to reset your
            password.
          </span>
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            required={true}
            changeValue={(input) => {
              setEmail(input);
            }}
          />
          {error && resetSent && (
            <span className="text-sm text-danger">{error}</span>
          )}

          {!resetSent && (
            <Button type="submit" className="my-2 min-h-11">
              <span className="flex items-center place-self-center gap-2 p-2">
                Send reset email
              </span>
            </Button>
          )}
          {!error && resetSent && (
            <span className="text-sm text-success-600 dark:text-success-500 py-2 block">
              Reset email sent! If your account exists in our system, you will
              receive an email shortly with a link to reset your password. If
              you don't receive an email, consider signing up for an account.
            </span>
          )}
        </form>

        <div className="flex justify-between">
          <button
            type="button"
            className="min-h-11 text-sm text-primary hover:underline hover:text-primary-700 font-semibold flex items-center gap-2
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            onClick={() => navigate("/login")}
          >
            <FontAwesomeIcon size="lg" icon={faArrowLeft} />
            Login
          </button>
          <button
            type="button"
            className="min-h-11 text-sm text-primary hover:underline hover:text-primary-700 font-semibold flex items-center gap-2
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            onClick={() => navigate("/signup")}
          >
            Sign up
            <FontAwesomeIcon size="lg" icon={faArrowRight} />
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};
