import { useContext, useEffect, useState } from "react";

import AuthContext from "../../context/AuthContext";
import { Input } from "../../components/form/Input";
import { Button } from "../../components/form/Button";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router";
import WrapperPage from "../WrapperPage";

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
    return <div>Loading...</div>;
  }

  return (
    <WrapperPage>
      <div className="flex flex-col gap-4 place-items-center py-4">
        <div className="flex flex-col gap-4 w-full border-2 border-gray-300 rounded-t-3xl p-4">
          <form
            onSubmit={forgotPasswordHandler}
            className="flex flex-col gap-2 w-full"
          >
            <span className="text-2xl font-bold py-2">
              Forgot your password?
            </span>
            <span className="text-sm text-gray-500">
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
              <span className="text-sm text-red-500">{error}</span>
            )}

            {!resetSent && (
              <Button type="submit" className="my-2">
                <span className="flex items-center place-self-center gap-2 p-2">
                  Send reset email
                </span>
              </Button>
            )}
            {!error && resetSent && (
              <span className="text-sm text-green-600 py-2 block">
                Reset email sent! If your account exists in our system, you will
                receive an email shortly with a link to reset your password. If
                you don't receive an email, consider signing up for an account.
              </span>
            )}
          </form>

          <div className="flex justify-between">
            <span
              className="text-sm text-blue-500 hover:underline hover:text-blue-700 font-semibold cursor-pointer flex gap-2"
              onClick={() => navigate("/login")}
            >
              <FontAwesomeIcon size="lg" icon={faArrowLeft} />
              Login
            </span>
            <span
              className="text-sm text-blue-500 hover:underline hover:text-blue-700 font-semibold cursor-pointer flex gap-2"
              onClick={() => navigate("/signup")}
            >
              Sign up
              <FontAwesomeIcon size="lg" icon={faArrowRight} />
            </span>
          </div>
        </div>
      </div>
    </WrapperPage>
  );
};
