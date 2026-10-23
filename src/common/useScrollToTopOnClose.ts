import { useEffect, useRef } from "react";

// Scrolls the page back to the top when isOpen goes true → false (e.g. a
// modal closing). Deferred because Modal restores focus to its trigger on
// close, which scrolls that trigger into view; the second pass covers the
// mobile keyboard's dismiss animation shifting the page afterwards.
export const useScrollToTopOnClose = (isOpen: boolean) => {
  const wasOpen = useRef(isOpen);

  useEffect(() => {
    const justClosed = wasOpen.current && !isOpen;
    wasOpen.current = isOpen;
    if (!justClosed) {
      return;
    }

    const frame = requestAnimationFrame(() => window.scrollTo(0, 0));
    const timeout = setTimeout(() => window.scrollTo(0, 0), 350);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [isOpen]);
};
