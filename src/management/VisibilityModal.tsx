import { useContext, useState } from "react";
import { Badge, Button, ButtonSelection, Input, Modal, Toggle } from "@dyordsabuzo/ui-components";
import { callFunction } from "../common/firebase";
import {
  isBlocked,
  SharedOrg,
  Sharing,
  sharingOf,
  Visibility,
  VISIBILITIES,
  VISIBILITY_LABELS,
} from "../common/sharing";
import AuthContext from "../context/AuthContext";
import SourceDataContext, { Dependency } from "../context/SourceDataContext";

type Props = {
  db: Dependency["db"];
  entity: any;
  onClose: () => void;
};

const HINTS: Record<Visibility, string> = {
  private: "Only your organisation can see it.",
  orgs: "Trainers and clients of the organisations below can see and copy it.",
  public: "Any trainer can find it in the marketplace and copy it.",
};

const labelOf = (visibility: Visibility) => VISIBILITY_LABELS[visibility];
const visibilityOf = (label: string) =>
  VISIBILITIES.find((v) => VISIBILITY_LABELS[v] === label) ?? "private";

// Private / Specific orgs (added by org code) / Public, for one library item,
// optionally applied to everything it uses too.
export const VisibilityModal = ({ db, entity, onClose }: Props) => {
  const { activeOrgId } = useContext(AuthContext);
  const { sharingDependencies, setSharing } = useContext(SourceDataContext);
  const initial = sharingOf(entity);
  // The platform admin blocked it from the marketplace (the rules refuse Public).
  const blocked = isBlocked(entity);
  const options = VISIBILITIES.filter((v) => !blocked || v !== "public");
  const [visibility, setVisibility] = useState<Visibility>(initial.visibility);
  const [orgs, setOrgs] = useState<SharedOrg[]>(initial.sharedWithOrgs);
  const [code, setCode] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [isLooking, setIsLooking] = useState(false);
  const [withDependencies, setWithDependencies] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [dependencies] = useState(() => sharingDependencies(db, entity.name));

  const addOrg = async () => {
    setLookupError("");
    setIsLooking(true);
    try {
      const org = await callFunction<SharedOrg>("findOrgByCode", { code });
      if (org.id === activeOrgId) {
        setLookupError("That's your own organisation.");
      } else {
        setOrgs((prev) => (prev.some((o) => o.id === org.id) ? prev : [...prev, org]));
        setCode("");
      }
    } catch {
      setLookupError("No organisation has that code.");
    } finally {
      setIsLooking(false);
    }
  };

  const sharing: Sharing =
    visibility === "orgs"
      ? { visibility, sharedWithOrgIds: orgs.map((o) => o.id), sharedWithOrgs: orgs }
      : { visibility, sharedWithOrgIds: [], sharedWithOrgs: [] };
  const sharesDependencies = visibility !== "private" && dependencies.length > 0 && withDependencies;
  const canSave = !isSaving && (visibility !== "orgs" || orgs.length > 0);

  const save = async () => {
    setSaveError("");
    setIsSaving(true);
    try {
      await setSharing(db, entity.name, sharing, sharesDependencies);
      onClose();
    } catch {
      setSaveError("Couldn't save. Try again.");
      setIsSaving(false);
    }
  };

  return (
    <Modal title={`Visibility: ${entity.name}`} isOpen={true} onClose={onClose}>
      <div className="flex flex-col gap-4 text-sm text-text-light dark:text-text-dark">
        <ButtonSelection
          options={options.map(labelOf)}
          selection={labelOf(visibility)}
          onSelect={(label) => setVisibility(visibilityOf(label))}
        />
        <p className="text-text-muted-light dark:text-text-muted-dark">{HINTS[visibility]}</p>
        {blocked && (
          <p className="text-danger">
            Blocked from the marketplace by the platform admin
            {entity.moderation?.reason ? `: ${entity.moderation.reason}` : ""}. It can't be made public.
          </p>
        )}

        {visibility === "orgs" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Organisation code"
                  value={code}
                  placeholder="e.g. K7M2QX"
                  error={lookupError || undefined}
                  changeValue={(value) => setCode(value.toUpperCase())}
                />
              </div>
              <Button
                label={isLooking ? "Finding…" : "Add"}
                className="min-h-11"
                disabled={isLooking || code.trim().length < 4}
                onClick={addOrg}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {orgs.map((org) => (
                <span key={org.id} className="inline-flex items-center gap-1">
                  <Badge variant="primary">
                    {org.name} · {org.code}
                  </Badge>
                  <button
                    type="button"
                    aria-label={`Stop sharing with ${org.name}`}
                    className="min-h-11 min-w-11 text-text-muted-light dark:text-text-muted-dark"
                    onClick={() => setOrgs((prev) => prev.filter((o) => o.id !== org.id))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {visibility !== "private" && dependencies.length > 0 && (
          <div className="flex flex-col gap-1">
            <Toggle
              label={`Also share the ${dependencies.length} item${dependencies.length === 1 ? "" : "s"} it uses`}
              labelDirection="row"
              value={withDependencies}
              toggle={setWithDependencies}
            />
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
              {dependencies.map((d) => d.name).join(", ")}. Their access is only ever widened.
            </p>
          </div>
        )}

        {saveError && <p className="text-danger">{saveError}</p>}
        <div className="flex gap-2">
          <Button label={isSaving ? "Saving…" : "Save"} className="min-h-11" disabled={!canSave} onClick={save} />
          <Button label="Cancel" decoration="cancel" className="min-h-11" disabled={isSaving} onClick={onClose} />
        </div>
      </div>
    </Modal>
  );
};
