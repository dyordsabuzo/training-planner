import { useContext, useState } from "react";

import AuthContext from "../../context/AuthContext";
import { Input } from "../../components/form/Input";
import { Button } from "../../components/form/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUser } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router";
import WrapperPage from "../WrapperPage";

export const Signup = () => {
  const authContext = useContext(AuthContext);
  const { registerWithEmailAndPassword } = authContext;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const signupHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    registerWithEmailAndPassword(email, password);
  };

  const navigate = useNavigate();

  return (
    <WrapperPage>
      <div className="flex flex-col gap-4 place-items-center py-4">
        <form
          onSubmit={signupHandler}
          className="flex flex-col gap-4 w-full border-2 border-gray-300 rounded-t-3xl p-4"
        >
          <div className="flex flex-col gap-2">
            <span className="text-2xl font-bold py-2">Sign up</span>
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
              <span className="text-xs text-red-500 py-2">
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

          <span
            className="text-sm text-blue-500 hover:underline hover:text-blue-700 font-semibold cursor-pointer flex gap-1"
            onClick={() => navigate("/Login")}
          >
            <FontAwesomeIcon size="lg" icon={faArrowLeft} />
            Login
          </span>
        </form>
      </div>
    </WrapperPage>
  );
};
