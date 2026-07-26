import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProfileIcon } from "./ProfileIcon";

type Props = {
  email?: string | null;
  photoUrl?: string | null;
  showEmail?: boolean;
  menuAlign?: "left" | "right";
};

export const ProfileMenu = ({
  email,
  photoUrl,
  showEmail = true,
  menuAlign = "left",
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={showEmail ? undefined : `Account menu for ${email ?? "user"}`}
        onClick={() => setIsOpen((open) => !open)}
        className={`min-h-11 flex items-center gap-2 rounded-lg
          hover:bg-gray-50 dark:hover:bg-gray-800
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${showEmail ? "flex-1 min-w-0 px-2" : "justify-center"}`}
      >
        <ProfileIcon
          photoUrl={photoUrl || undefined}
          label={email?.substring(0, 1)?.toUpperCase() || "U"}
        />
        {showEmail && (
          <span className="text-sm text-text-light dark:text-text-dark truncate">
            {email}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Account menu"
          className={`absolute z-30 bottom-full mb-2 w-56 rounded-lg border
            border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark
            shadow-lg py-1 ${menuAlign === "right" ? "right-0" : "left-0"}`}
        >
          <div
            className="px-3 py-2 text-xs text-text-muted-light dark:text-text-muted-dark
              truncate border-b border-gray-100 dark:border-gray-700"
          >
            {email}
          </div>
          <Link
            to="/logout"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="min-h-11 flex items-center gap-2 px-3 text-sm text-danger
              hover:bg-gray-50 dark:hover:bg-gray-800
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            <FontAwesomeIcon icon={faRightFromBracket} fixedWidth />
            Log out
          </Link>
        </div>
      )}
    </div>
  );
};
