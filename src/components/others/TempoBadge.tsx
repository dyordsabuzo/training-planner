import { useEffect, useRef, useState } from "react";
import { faGaugeHigh } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const AUTO_SHRINK_MS = 6000;

type Props = {
  tempo: string;
};

// Tap to enlarge for reading at a distance; shrinks back on a tap anywhere
// else, another tap on it, or after AUTO_SHRINK_MS. Enlarges with a
// transform so the content below doesn't jump — it's overlapped instead.
export const TempoBadge = ({ tempo }: Props) => {
  const [enlarged, setEnlarged] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!enlarged) {
      return;
    }
    const shrink = () => setEnlarged(false);
    const timeout = setTimeout(shrink, AUTO_SHRINK_MS);
    const handleOutside = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        shrink();
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("pointerdown", handleOutside);
    };
  }, [enlarged]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setEnlarged((e) => !e)}
      aria-expanded={enlarged}
      aria-label={`Target tempo ${tempo}. Tap to ${enlarged ? "shrink" : "enlarge"}`}
      // Max width keeps the 1.8× enlarged badge within the screen.
      className={`relative inline-flex items-center gap-2 max-w-[50vw] rounded-full px-4 py-1.5
        bg-secondary-100 dark:bg-gray-700 text-base font-bold text-text-light dark:text-text-dark
        origin-top transition-transform duration-200 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
        ${enlarged ? "scale-[1.8] z-20 shadow-xl" : ""}`}
    >
      <FontAwesomeIcon icon={faGaugeHigh} className="shrink-0 text-primary dark:text-primary-300" />
      <span className="shrink-0 text-xs uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
        Tempo
      </span>
      <span className="break-words text-left">{tempo}</span>
    </button>
  );
};
