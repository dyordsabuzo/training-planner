import { useEffect, useRef } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: "md" | "lg";
  headerAction?: React.ReactNode;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export const Modal = ({ title, children, isOpen, onClose, size = "md", headerAction }: Props) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && focusable && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30">
      <div
        className="fixed inset-0 bg-gray-500/75 dark:bg-black/75 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 overflow-y-auto flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className={`relative w-full ${size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg"}
            max-h-[100dvh] sm:max-h-[85vh] overflow-y-auto
            rounded-t-2xl sm:rounded-lg bg-white dark:bg-surface-dark
            text-text-light dark:text-text-dark shadow-xl p-6 animate-slide-up`}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <h3 id="modal-title" className="text-base font-semibold">
              {title}
            </h3>
            <div className="flex items-center gap-1 -m-2 shrink-0">
              {headerAction}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="min-h-11 min-w-11 flex items-center justify-center rounded-full
                  text-text-muted-light dark:text-text-muted-dark
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <FontAwesomeIcon icon={faXmark} size="lg" />
              </button>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
