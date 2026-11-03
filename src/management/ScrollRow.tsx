import { ReactNode, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

const CHEVRON = `absolute top-1/2 -translate-y-1/2 z-[1] flex items-center justify-center w-11 h-11 rounded-full
  bg-white dark:bg-gray-800 shadow-md text-text-light dark:text-text-dark
  hover:text-primary dark:hover:text-primary-300`;

// The browser's own smooth scrolling rushes a distance this short.
const SLIDE_MS = 350;

// Sideways-scrolling row with a chevron on each side that has more to show.
// The chevrons overlay the row so appearing can't change how far it scrolls,
// and stay out of the tab order: focusing an item already scrolls it into view
// (the scroll padding keeps it clear of them).
export const ScrollRow = ({ ariaLabel, children }: { ariaLabel: string; children: ReactNode }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const slideFrame = useRef(0);
  // Where a slide in progress will stop, so quick taps add up.
  const slideTarget = useRef<number | null>(null);

  const stopSliding = () => {
    cancelAnimationFrame(slideFrame.current);
    slideTarget.current = null;
  };

  const update = () => {
    const row = rowRef.current;
    if (!row) return;
    setCanScrollLeft(row.scrollLeft > 1);
    setCanScrollRight(row.scrollLeft + row.clientWidth < row.scrollWidth - 1);
  };

  // Every render, as the items can change; unchanged values don't re-render.
  useEffect(update);
  useEffect(() => {
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      stopSliding();
    };
  }, []);

  const scroll = (direction: 1 | -1) => {
    const row = rowRef.current;
    if (!row) return;
    const from = slideTarget.current ?? row.scrollLeft;
    const max = row.scrollWidth - row.clientWidth;
    const target = Math.min(max, Math.max(0, from + direction * row.clientWidth * 0.7));
    stopSliding();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      row.scrollLeft = target;
      return;
    }

    slideTarget.current = target;
    const start = row.scrollLeft;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - startTime) / SLIDE_MS));
      const eased = 1 - (1 - progress) ** 3;
      row.scrollLeft = start + (target - start) * eased;
      if (progress < 1) slideFrame.current = requestAnimationFrame(step);
      else slideTarget.current = null;
    };
    slideFrame.current = requestAnimationFrame(step);
  };

  return (
    <div className="relative">
      {/* Padding keeps focus rings clear of the scroll container's clipping. */}
      <div
        ref={rowRef}
        role="group"
        aria-label={ariaLabel}
        onScroll={update}
        // A swipe takes over from a slide in progress.
        onTouchStart={stopSliding}
        onWheel={stopSliding}
        className="flex gap-2 overflow-x-auto scrollbar-hide p-1 -m-1 scroll-px-12"
      >
        {children}
      </div>
      {canScrollLeft && (
        <button type="button" tabIndex={-1} aria-label="Scroll left" onClick={() => scroll(-1)} className={`${CHEVRON} left-0`}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
      )}
      {canScrollRight && (
        <button type="button" tabIndex={-1} aria-label="Scroll right" onClick={() => scroll(1)} className={`${CHEVRON} right-0`}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      )}
    </div>
  );
};
