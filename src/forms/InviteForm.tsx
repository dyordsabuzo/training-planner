import { useContext, useState } from "react";
import { Button, Modal, Toggle } from "@dyordsabuzo/ui-components";
import AuthContext from "../context/AuthContext";
import { callFunction } from "../common/firebase";

type Props = {
  closeForm: () => void;
};

// Owner only: creates a single-use invite link, valid for 7 days, that adds
// whoever opens it to the active org as a client (or trainer).
export const InviteForm = ({ closeForm }: Props) => {
  const { activeOrgId, activeOrg } = useContext(AuthContext);
  const [asTrainer, setAsTrainer] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const create = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const { token } = await callFunction<{ token: string }>("createInvite", {
        orgId: activeOrgId,
        role: asTrainer ? "trainer" : "client",
      });
      setLink(`${window.location.origin}/training-planner/join/${activeOrgId}/${token}`);
    } catch (e: any) {
      setError(e?.message ?? "Unable to create the invite.");
    } finally {
      setIsCreating(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(link!);
    setCopied(true);
  };

  return (
    <Modal title={`Invite to ${activeOrg?.name ?? "your organisation"}`} isOpen={true} onClose={closeForm}>
      <div className="flex flex-col gap-4 text-text-light dark:text-text-dark">
        {!link ? (
          <>
            <div className="flex items-center gap-3">
              <Toggle label="Invite as trainer" value={asTrainer} toggle={setAsTrainer} />
              <span className="text-sm font-medium">{asTrainer ? "Trainer" : "Client"}</span>
            </div>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
              The link works once and expires in 7 days.
            </p>
            {error && <span className="text-xs text-danger">{error}</span>}
            <Button
              label={isCreating ? "Creating…" : "Create invite link"}
              className="min-h-11 self-start"
              disabled={isCreating}
              onClick={create}
            />
          </>
        ) : (
          <>
            <p className="text-sm">Send this link to the person you're inviting:</p>
            <code className="text-xs break-all rounded-md bg-gray-100 dark:bg-gray-800 p-2">{link}</code>
            <Button label={copied ? "Copied" : "Copy link"} className="min-h-11 self-start" onClick={copy} />
          </>
        )}
      </div>
    </Modal>
  );
};
