import { KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  IconDefinition,
  faCopy,
  faCircleInfo,
  faEllipsisVertical,
  faEye,
  faGlobe,
  faLinkSlash,
  faPen,
  faTrash,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge, Button, Modal } from "@dyordsabuzo/ui-components";
import { canShare, sharingOf, VISIBILITY_LABELS } from "../common/sharing";
import { Dependency } from "../context/SourceDataContext";
import { VisibilityModal } from "./VisibilityModal";
import { LinkedItemModal, LinkedMode } from "./LinkedItemModal";

export type ActionItem = {
  label: string;
  icon: IconDefinition;
  onClick: () => void;
};

// Kept for callers that pass a variant; both now render the same ⋮ menu.
export type ActionsVariant = "card" | "menu";

type Props = {
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
  deleteImpactMessage?: string;
  extraActions?: ActionItem[];
  variant?: ActionsVariant;
  // Library item whose visibility can be set from the menu (Phase 4).
  sharing?: { db: Dependency["db"]; entity: any };
};

const menuItemClass = `w-full min-h-11 px-3 flex items-center gap-3 text-left text-sm
  hover:bg-gray-100 dark:hover:bg-gray-700
  focus-visible:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-700`;

const getMenuItems = (menu: HTMLElement | null) =>
  Array.from(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

// Kebab menu. Portaled with fixed positioning so the table's overflow
// container can't clip it. Keyboard: focus moves into the menu on open,
// arrows/Home/End move between items, Escape or Tab closes it.
const ActionMenu = ({
  items,
  onDelete,
  deleteImpactMessage,
}: {
  items: ActionItem[];
  onDelete?: () => void;
  deleteImpactMessage?: string;
}) => {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pos) return;
    getMenuItems(menuRef.current)[0]?.focus();

    const close = () => setPos(null);
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        close();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [pos]);

  const onMenuKeyDown = (e: ReactKeyboardEvent) => {
    const menuItems = getMenuItems(menuRef.current);
    const index = menuItems.indexOf(document.activeElement as HTMLElement);
    const last = menuItems.length - 1;
    const focusAt = (i: number) => {
      e.preventDefault();
      menuItems[i]?.focus();
    };

    switch (e.key) {
      case "ArrowDown":
        return focusAt(index >= last ? 0 : index + 1);
      case "ArrowUp":
        return focusAt(index <= 0 ? last : index - 1);
      case "Home":
        return focusAt(0);
      case "End":
        return focusAt(last);
      case "Tab":
        e.preventDefault();
        setPos(null);
        buttonRef.current?.focus();
        return;
    }
  };

  const toggle = () => {
    if (pos) return setPos(null);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
  };

  const run = (action: () => void) => {
    setPos(null);
    action();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={!!pos}
        title="More actions"
        className="min-h-11 min-w-11 flex items-center justify-center rounded-full
          text-secondary dark:text-secondary-200
          hover:bg-gray-100 dark:hover:bg-gray-700
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <FontAwesomeIcon icon={faEllipsisVertical} />
      </button>

      {pos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            onKeyDown={onMenuKeyDown}
            style={{ position: "fixed", top: pos.top, right: pos.right }}
            className="z-50 min-w-44 py-1 rounded-md border border-primary-200 dark:border-primary-700
              bg-white dark:bg-surface-dark text-text-light dark:text-text-dark shadow-lg"
          >
            {items.map(({ label, icon, onClick }) => (
              <button
                key={label}
                type="button"
                role="menuitem"
                onClick={() => run(onClick)}
                className={menuItemClass}
              >
                <FontAwesomeIcon icon={icon} className="w-4" />
                {label}
              </button>
            ))}
            {onDelete && (
              <button
                type="button"
                role="menuitem"
                onClick={() => run(() => setConfirming(true))}
                className={`${menuItemClass} text-danger`}
              >
                <FontAwesomeIcon icon={faTrash} className="w-4" />
                Delete
              </button>
            )}
          </div>,
          document.body
        )}

      <Modal title="Delete" isOpen={confirming} onClose={() => setConfirming(false)}>
        <div className="flex flex-col gap-4">
          <span className="text-sm text-text-light dark:text-text-dark">
            {deleteImpactMessage ?? "Are you sure? This can't be undone."}
          </span>
          <div className="flex gap-2">
            <Button label="Cancel" decoration="cancel" className="flex-1" onClick={() => setConfirming(false)} />
            <Button label="Yes, delete" decoration="delete" className="flex-1" onClick={() => onDelete?.()} />
          </div>
        </div>
      </Modal>
    </>
  );
};

// Shown next to the menu when an item is shared beyond its org.
const SharingIcon = ({ entity }: { entity: any }) => {
  const { visibility, sharedWithOrgs } = sharingOf(entity);
  if (visibility === "private") return null;
  const title =
    visibility === "public"
      ? VISIBILITY_LABELS.public
      : `Shared with ${sharedWithOrgs.map((o) => o.name).join(", ") || "other orgs"}`;
  return (
    <span title={title} aria-label={title} className="px-1 text-primary dark:text-primary-200">
      <FontAwesomeIcon icon={visibility === "public" ? faGlobe : faUserGroup} />
    </span>
  );
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Action set per entity: a single ⋮ menu (Edit, Clone, extras, Visibility, Delete).
// An item linked from another org is read-only: Details, Convert to copy, Unlink.
// The wrapper stops clicks reaching the card or row.
export const EntityActions = ({
  onEdit,
  onClone,
  onDelete,
  deleteImpactMessage,
  extraActions = [],
  sharing,
}: Props) => {
  const [settingVisibility, setSettingVisibility] = useState(false);
  const [linkedMode, setLinkedMode] = useState<LinkedMode | null>(null);
  const linked = sharing?.entity?.linked;
  const linkCount: number = sharing?.entity?.linkCount ?? 0;

  if (sharing && linked) {
    const linkedItems: ActionItem[] = [
      { label: "Details", icon: faCircleInfo, onClick: () => setLinkedMode("details") },
      { label: "Convert to copy…", icon: faCopy, onClick: () => setLinkedMode("convert") },
      { label: "Unlink…", icon: faLinkSlash, onClick: () => setLinkedMode("unlink") },
    ];
    return (
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <Badge variant="neutral">Owned by {linked.ownerName}</Badge>
        <ActionMenu items={linkedItems} />
        {linkedMode && (
          <LinkedItemModal db={sharing.db} entity={sharing.entity} mode={linkedMode} onClose={() => setLinkedMode(null)} />
        )}
      </div>
    );
  }

  const shareable = !!sharing && canShare(sharing.entity);
  const menuItems: ActionItem[] = [
    { label: "Edit", icon: faPen, onClick: onEdit },
    { label: "Clone", icon: faCopy, onClick: onClone },
    ...extraActions,
    ...(shareable ? [{ label: "Visibility…", icon: faEye, onClick: () => setSettingVisibility(true) }] : []),
  ];

  return (
    <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
      {sharing && <SharingIcon entity={sharing.entity} />}
      {linkCount > 0 && <Badge variant="primary">Used by {plural(linkCount, "org")}</Badge>}
      <ActionMenu
        items={menuItems}
        onDelete={onDelete}
        deleteImpactMessage={
          linkCount > 0
            ? `${plural(linkCount, "other organisation")} link to this. It will be archived (hidden here) instead of deleted, so their sessions keep working.`
            : deleteImpactMessage
        }
      />
      {shareable && settingVisibility && (
        <VisibilityModal db={sharing.db} entity={sharing.entity} onClose={() => setSettingVisibility(false)} />
      )}
    </div>
  );
};
