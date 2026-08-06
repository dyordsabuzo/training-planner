/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useEffect, useState } from "react";

import AuthContext from "../../context/AuthContext";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useSearchParams } from "react-router";
import { AuthLayout } from "./AuthLayout";
import { Loading } from "../helpers/Loading";
import { Input, Button } from "@dyordsabuzo/ui-components";

export const PasswordReset = () => {
  const authContext = useContext(AuthContext);
  const { verifyResetCode, confirmReset, data, error, isLoading } = authContext;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode") || "";

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    verifyResetCode(oobCode);
  }, []);

  useEffect(() => {
    setEmail(data?.email || "");
  }, [data]);

  const resetPasswordHandler = () => {
    confirmReset(oobCode, password);
  };

  const navigate = useNavigate();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <AuthLayout
      heroHeadline={email ? "Choose a new password." : "Link expired."}
      heroSubtext={
        email
          ? "Pick something secure you'll remember for next time."
          : "Password reset links only work for a little while."
      }
    >
      {email && (
        <div className="flex flex-col gap-4 w-full rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 bg-white dark:bg-surface-dark">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold py-2 text-text-light dark:text-text-dark">Password reset</h2>
            <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
              Please enter your new password.
            </span>

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
            {!email && error && (
              <span className="text-xs text-danger py-2">{error}</span>
            )}
          </div>

          <Button onClick={resetPasswordHandler} className="min-h-11">
            <span className="flex items-center place-self-center gap-2 p-2">
              Reset password
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
        </div>
      )}
      {!email && (
        <div className="flex flex-col gap-4 w-full rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 bg-white dark:bg-surface-dark">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold py-2 text-text-light dark:text-text-dark">
              Password reset expired
            </h2>
            <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
              The password reset link has expired. Please request a new link.
            </span>
          </div>

          <button
            type="button"
            className="min-h-11 text-sm text-primary hover:underline hover:text-primary-700 font-semibold flex items-center gap-1
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            onClick={() => navigate("/forgot-password")}
          >
            <FontAwesomeIcon size="lg" icon={faArrowLeft} />
            Request a new link
          </button>
        </div>
      )}
    </AuthLayout>
  );
};
