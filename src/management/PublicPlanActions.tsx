import { useContext, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { faGlobe, faLink, faLinkSlash, faRotate } from "@fortawesome/free-solid-svg-icons";
import { Button, Modal } from "@dyordsabuzo/ui-components";
import AuthContext from "../context/AuthContext";
import SourceDataContext from "../context/SourceDataContext";
import { buildPublicPlan, buildPublicSession } from "../common/publicPlans";
import { deletePublicPlan, listPublicPlans, savePublicPlan } from "../common/publicPlansDb";
import { canShare } from "../common/sharing";

type Kind = "plan" | "session";
type Step = "confirm" | "confirmStop" | "copied" | "updated" | "copyFailed" | "stopped" | "empty" | "error";

const EMPTY: Record<Kind, string> = {
  plan: "This plan has no sessions with exercises yet, so there's nothing to publish.",
  session: "This session has no exercises yet, so there's nothing to publish.",
};

const MESSAGES: Record<Exclude<Step, "confirm" | "empty">, string> = {
  confirmStop: "Stop public access? The link will stop working for everyone.",
  copied: "Public link copied to clipboard.",
  updated: "The public link now matches your latest changes. Link copied to clipboard.",
  copyFailed: "Done, but the link couldn't be copied automatically. Copy it below.",
  stopped: "Public access stopped.",
  error: "That didn't work. Check your connection and try again.",
};

// Publish, update and revoke the public link of a plan or session. The ⋮ menu
// items come from `actionsFor`; `dialog` renders wherever the listing puts it.
export const usePublicPlanActions = (kind: Kind = "plan") => {
  const { activeOrgId } = useContext(AuthContext);
  const { sourceData } = useContext(SourceDataContext);
  const queryClient = useQueryClient();
  const [state, setState] = useState<{ plan: any; step: Step; token?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const queryKey = ["publicPlans", activeOrgId];

  const { data: tokens = {} } = useQuery({
    queryKey,
    queryFn: () => listPublicPlans(activeOrgId as string),
    enabled: !!activeOrgId,
  });

  const urlFor = (token: string) => `${window.location.origin}/training-planner/public/${activeOrgId}/${token}`;

  const copy = async (plan: any, token: string, success: Step) => {
    try {
      await navigator.clipboard.writeText(urlFor(token));
      setState({ plan, token, step: success });
    } catch {
      setState({ plan, token, step: "copyFailed" });
    }
  };

  // Writes the current plan to its link, creating the link the first time.
  const publish = async (plan: any) => {
    const build = kind === "session" ? buildPublicSession : buildPublicPlan;
    const copyOfPlan = build(plan, sourceData, new Date().toISOString());
    if (copyOfPlan.sessions.length === 0) {
      setState({ plan, step: "empty" });
      return;
    }
    const existing = tokens[plan.id];
    const token = existing ?? crypto.randomUUID();
    setIsSaving(true);
    try {
      await savePublicPlan(activeOrgId as string, token, copyOfPlan);
      await queryClient.invalidateQueries({ queryKey });
      await copy(plan, token, existing ? "updated" : "copied");
    } catch {
      setState({ plan, step: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const stop = async (plan: any) => {
    setIsSaving(true);
    try {
      await deletePublicPlan(activeOrgId as string, tokens[plan.id]);
      await queryClient.invalidateQueries({ queryKey });
      setState({ plan, step: "stopped" });
    } catch {
      setState({ plan, step: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Anything personalised for one client stays private.
  const actionsFor = (plan: any) => {
    if (!plan.id || !activeOrgId || !canShare(plan)) return [];
    const token = tokens[plan.id];
    if (!token) {
      return [{ label: "Make public…", icon: faGlobe, onClick: () => setState({ plan, step: "confirm" }) }];
    }
    return [
      { label: "Copy public link", icon: faLink, onClick: () => copy(plan, token, "copied") },
      { label: "Update public link", icon: faRotate, onClick: () => publish(plan) },
      { label: "Stop public access…", icon: faLinkSlash, onClick: () => setState({ plan, step: "confirmStop" }) },
    ];
  };

  const close = () => setState(null);
  const needsConfirm = state?.step === "confirm" || state?.step === "confirmStop";

  const dialog = state && (
    <Modal title={`Public ${kind}`} isOpen={true} onClose={close}>
      <div className="flex flex-col gap-4">
        <span className="text-sm text-text-light dark:text-text-dark">
          {state.step === "confirm"
            ? `Make "${state.plan.name}" public? Anyone with the link can see and run it without signing in. Rest timers and editing targets are off, and nothing they do is saved. Later edits only appear when you choose Update public link.`
            : state.step === "empty"
              ? EMPTY[kind]
              : MESSAGES[state.step]}
        </span>
        {state.token && !needsConfirm && (
          <span className="text-sm break-all text-text-muted-light dark:text-text-muted-dark">{urlFor(state.token)}</span>
        )}
        <div className="flex gap-2">
          {needsConfirm ? (
            <>
              <Button label="Cancel" decoration="cancel" className="flex-1" onClick={close} />
              <Button
                label={state.step === "confirm" ? "Publish and copy link" : "Stop public access"}
                decoration={state.step === "confirm" ? undefined : "delete"}
                className="flex-1"
                disabled={isSaving}
                onClick={() => (state.step === "confirm" ? publish(state.plan) : stop(state.plan))}
              />
            </>
          ) : (
            <Button label="Close" className="flex-1" onClick={close} />
          )}
        </div>
      </div>
    </Modal>
  );

  return { actionsFor, dialog };
};
