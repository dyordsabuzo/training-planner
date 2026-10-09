import { useContext, useState } from "react";
import AppSettingsContext from "../context/AppSettingsContext";
import { Button, Card, Input } from "@dyordsabuzo/ui-components";

// Admin-only: the contact email shown to users with no granted plans
// (Home.tsx's "Request access" card) and used as the mailto fallback there.
export const AppSettingsForm = () => {
  const { adminEmail, updateAdminEmail } = useContext(AppSettingsContext);
  const [email, setEmail] = useState(adminEmail);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAdminEmail(email.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <span className="text-base font-bold text-text-light dark:text-text-dark">
        Administrator contact
      </span>
      <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
        Shown to users with no training program yet, as the address to request
        access from.
      </p>
      <div className="flex flex-col sm:flex-row sm:items-end gap-2">
        <div className="flex-1">
          <Input label="Admin email" value={email} placeholder="Admin email" changeValue={setEmail} />
        </div>
        <Button
          label={isSaving ? "Saving…" : saved ? "Saved" : "Save"}
          className="min-h-11 shrink-0"
          disabled={isSaving || !email.trim() || email === adminEmail}
          onClick={handleSave}
        />
      </div>
    </Card>
  );
};
