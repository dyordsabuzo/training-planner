import { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDumbbell } from "@fortawesome/free-solid-svg-icons";
import { FOCUS } from "./AgendaRow";

export const OUTLINE_PILL = `flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-full border border-primary-200
  dark:border-primary-700 text-sm text-primary font-semibold hover:bg-primary-50 dark:hover:bg-primary-800/20 ${FOCUS}`;

export const PRIMARY_PILL = `flex items-center justify-center gap-2 min-h-12 px-6 rounded-full bg-primary text-white text-base
  font-bold shadow-sm shadow-primary/30 hover:bg-primary-500 transition-colors ${FOCUS}`;

// Gradient tile for what's about to start: a session (Up next / Ready on
// Train) or the next unit mid-run (SummaryPage).
export const HeroTile = ({
  eyebrow,
  title,
  details,
  children,
}: {
  eyebrow: string;
  title: string;
  details: (string | null | undefined)[];
  children: ReactNode;
}) => (
  <div
    className="flex flex-col gap-4 rounded-2xl p-5 text-white bg-gradient-to-br from-primary to-primary-400
      shadow-lg shadow-primary/30 motion-safe:animate-fade-up"
  >
    <div className="flex items-start gap-3">
      <span className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-white/15">
        <FontAwesomeIcon icon={faDumbbell} className="text-lg" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-bold uppercase tracking-wider text-white/70">{eyebrow}</span>
        <span className="text-xl font-bold line-clamp-2 break-words" title={title}>
          {title}
        </span>
      </div>
    </div>
    <ul aria-label="Session details" className="flex flex-wrap gap-1.5">
      {details.filter(Boolean).map((detail) => (
        <li key={detail} className="px-3 py-1 rounded-full bg-white/15 text-xs font-semibold">
          {detail}
        </li>
      ))}
    </ul>
    {children}
  </div>
);
