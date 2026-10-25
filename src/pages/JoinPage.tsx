import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Button, Card } from "@dyordsabuzo/ui-components";
import AuthContext from "../context/AuthContext";
import AppSettingsContext from "../context/AppSettingsContext";
import { callFunction } from "../common/firebase";
import WrapperPage from "./WrapperPage";
import { Loading } from "./helpers/Loading";

// An invite link opened while signed out is kept here, and Home sends the
// user back to it once they've signed in or signed up.
export const PENDING_INVITE_KEY = "training-planner-pending-invite";

const JoinPage = () => {
  const { orgId, token } = useParams();
  const { user, isLoading, refreshOrgs } = useContext(AuthContext);
  const { functionsSuspended } = useContext(AppSettingsContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"joining" | "joined" | "error">("joining");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      localStorage.setItem(PENDING_INVITE_KEY, location.pathname);
      return;
    }
    localStorage.removeItem(PENDING_INVITE_KEY);
    if (functionsSuspended) {
      setStatus("error");
      setMessage("Joining is temporarily unavailable. Please try the link again later.");
      return;
    }
    callFunction("acceptInvite", { orgId, token })
      .then(() => refreshOrgs(orgId))
      .then(() => setStatus("joined"))
      .catch((error: any) => {
        setStatus("error");
        setMessage(error?.message ?? "This invite isn't valid.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, orgId, token, functionsSuspended]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <WrapperPage className="max-w-[32rem]">
      <Card className="flex flex-col gap-3 mt-6 text-text-light dark:text-text-dark">
        <h1 className="text-xl font-bold">Join an organisation</h1>
        {!user ? (
          <>
            <p>Sign in or create an account to accept this invite.</p>
            <div className="flex gap-2">
              <Button label="Log in" className="min-h-11" onClick={() => navigate("/login")} />
              <Button label="Sign up" decoration="cancel" className="min-h-11" onClick={() => navigate("/signup")} />
            </div>
          </>
        ) : status === "joining" ? (
          <p>Joining…</p>
        ) : status === "joined" ? (
          <>
            <p>You've joined. Your trainer can now assign you training plans.</p>
            <Button label="Go to home" className="min-h-11 self-start" onClick={() => navigate("/")} />
          </>
        ) : (
          <>
            <p className="text-danger">{message}</p>
            <Button label="Go to home" decoration="cancel" className="min-h-11 self-start" onClick={() => navigate("/")} />
          </>
        )}
      </Card>
    </WrapperPage>
  );
};

export default JoinPage;
