import { useContext, useState } from "react";
import { Badge, Button, Modal } from "@dyordsabuzo/ui-components";
import { dependenciesOf } from "../common/refs";
import SourceDataContext, { Dependency } from "../context/SourceDataContext";

export type LinkedMode = "details" | "convert" | "unlink";

type Props = {
  db: Dependency["db"];
  entity: any;
  mode: LinkedMode;
  onClose: () => void;
};

// The callable's message (e.g. "Still used by: Day 1.") when it gave one.
const messageOf = (error: unknown) =>
  (error as { message?: string })?.message || "That didn't work. Try again.";

// A live-linked item from another org: read-only here. Shows what it uses,
// and replaces the link with a copy or removes it.
export const LinkedItemModal = ({ db, entity, mode, onClose }: Props) => {
  const { sourceData, convertLinkToCopy, unlinkItem } = useContext(SourceDataContext);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState("");
  const { ownerName, name } = entity.linked;
  const uses = dependenciesOf(db, entity.name, sourceData as any);

  const run = async (action: () => Promise<void>) => {
    setError("");
    setIsWorking(true);
    try {
      await action();
      onClose();
    } catch (e) {
      setError(messageOf(e));
      setIsWorking(false);
    }
  };

  return (
    <Modal title={name} isOpen={true} onClose={onClose}>
      <div className="flex flex-col gap-4 text-sm text-text-light dark:text-text-dark">
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">Owned by {ownerName}</Badge>
          {entity.archived && <Badge variant="warning">Archived by its owner</Badge>}
        </div>
        <p>
          Linked from {ownerName}: it's read-only here, and their edits show up in your sessions and plans.
        </p>
        {uses.length > 0 && (
          <p className="text-text-muted-light dark:text-text-muted-dark">Uses {uses.map((d) => d.name).join(", ")}.</p>
        )}
        {mode === "convert" && (
          <p>
            Converting copies it{uses.length ? ` and the ${uses.length} item${uses.length === 1 ? "" : "s"} it uses` : ""}{" "}
            into your library. Your sessions, plans and clients' history keep working, but {ownerName}'s later edits
            won't show up.
          </p>
        )}
        {mode === "unlink" && (
          <p>Unlinking removes it from your library. Remove it from your sessions first.</p>
        )}
        {error && <p className="text-danger">{error}</p>}
        <div className="flex flex-wrap gap-2">
          {mode !== "unlink" && (
            <Button
              label={isWorking ? "Copying…" : "Convert to copy"}
              className="min-h-11"
              disabled={isWorking}
              onClick={() => run(() => convertLinkToCopy(entity.id))}
            />
          )}
          {mode !== "convert" && (
            <Button
              label={isWorking ? "Unlinking…" : "Unlink"}
              decoration="delete"
              className="min-h-11"
              disabled={isWorking}
              onClick={() => run(() => unlinkItem(entity.id))}
            />
          )}
          <Button label="Close" decoration="cancel" className="min-h-11" disabled={isWorking} onClick={onClose} />
        </div>
      </div>
    </Modal>
  );
};
