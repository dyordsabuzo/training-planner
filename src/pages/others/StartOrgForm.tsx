import { useContext, useState } from "react";
import { Button, Input } from "@dyordsabuzo/ui-components";
import AuthContext from "../../context/AuthContext";
import AppSettingsContext from "../../context/AppSettingsContext";
import { callFunction } from "../../common/firebase";

// Self-service for trainers: creates an org (the caller becomes its owner)
// and switches to it.
export const StartOrgForm = () => {
  const { refreshOrgs } = useContext(AuthContext);
  const { functionsSuspended } = useContext(AppSettingsContext);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (functionsSuspended) {
    return (
      <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
        Creating an organisation is temporarily unavailable.
      </p>
    );
  }

  const create = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const { orgId } = await callFunction<{ orgId: string }>("createOrg", { name: name.trim() });
      await refreshOrgs(orgId);
    } catch (e: any) {
      setError(e?.message ?? "Unable to create the organisation.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold text-text-light dark:text-text-dark">Are you a trainer?</span>
      <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
        Start your own organisation to build plans and invite your clients.
      </span>
      <Input label="Organisation name" value={name} placeholder="e.g. Sam's Coaching" changeValue={setName} />
      {error && <span className="text-xs text-danger">{error}</span>}
      <Button
        label={isSaving ? "Creating…" : "Start my organisation"}
        className="min-h-11 self-start"
        disabled={isSaving || name.trim().length < 2}
        onClick={create}
      />
    </div>
  );
};
