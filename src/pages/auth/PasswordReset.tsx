/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useEffect, useState } from "react";

import AuthContext from "../../context/AuthContext";
import { Input } from "../../components/form/Input";
import { Button } from "../../components/form/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useSearchParams } from "react-router";
import WrapperPage from "../WrapperPage";
import { Loading } from "../helpers/Loading";

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
    <WrapperPage>
      <div className="flex flex-col gap-4 place-items-center py-4">
        {email && (
          <div className="flex flex-col gap-4 w-full border-2 border-gray-300 rounded-t-3xl p-4">
            <div className="flex flex-col gap-2">
              <span className="text-2xl font-bold py-2">Password reset</span>
              <span className="text-sm text-gray-500">
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
                <span className="text-xs text-red-500 py-2">
                  Passwords must match
                </span>
              )}
              {!email && error && (
                <span className="text-xs text-red-500 py-2">{error}</span>
              )}
            </div>

            <Button onClick={resetPasswordHandler}>
              <span className="flex items-center place-self-center gap-2 p-2">
                Reset password
              </span>
            </Button>

            <span
              className="text-sm text-blue-500 hover:underline hover:text-blue-700 font-semibold cursor-pointer flex gap-1"
              onClick={() => navigate("/Login")}
            >
              <FontAwesomeIcon size="lg" icon={faArrowLeft} />
              Login
            </span>
          </div>
        )}
        {!email && (
          <div className="flex flex-col gap-4 w-full border-2 border-gray-300 rounded-t-3xl p-4">
            <div className="flex flex-col gap-2">
              <span className="text-2xl font-bold py-2">
                Password reset expired
              </span>
              <span className="text-sm text-gray-500">
                The password reset link has expired. Please request a new link.
              </span>
            </div>

            {/* <Button onClick={resetPasswordHandler}>
              <span className="flex items-center place-self-center gap-2 p-2">
                Reset password
              </span>
            </Button> */}

            <span
              className="text-sm text-blue-500 hover:underline hover:text-blue-700 font-semibold cursor-pointer flex gap-1"
              onClick={() => navigate("/forgot-password")}
            >
              <FontAwesomeIcon size="lg" icon={faArrowLeft} />
              Request a new link
            </span>
          </div>
        )}
      </div>
    </WrapperPage>
  );
};
