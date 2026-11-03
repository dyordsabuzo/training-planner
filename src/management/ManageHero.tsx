import { useContext, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faDumbbell,
  faLayerGroup,
  faObjectGroup,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import SourceDataContext from "../context/SourceDataContext";
import { FOCUS } from "../pages/others/AgendaRow";
import { OUTLINE_PILL } from "../pages/others/HeroTile";
import { plural } from "./EntityActions";
import { setupSummary } from "./setupSummary";

export const SECTION_ICONS = {
  Exercises: faDumbbell,
  Supersets: faObjectGroup,
  Sessions: faClipboardList,
  Plans: faLayerGroup,
};

export const BUILD_SECTIONS = ["Exercises", "Supersets", "Sessions", "Plans"] as const;
export const MORE_SECTIONS = ["Library", "Relationships"] as const;

const ON_GRADIENT_FOCUS = `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
  focus-visible:ring-offset-2 focus-visible:ring-offset-primary`;

const FILLED_PILL = `flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-full border border-primary bg-primary
  text-sm text-white font-semibold shadow-sm shadow-primary/30 ${FOCUS}`;

// Top of Manage: what the setup is made of, doubling as the section nav, in
// the order things get built. Setup only, so no client progress here.
export const ManageHero = ({
  activeTab,
  onSelect,
  onShowUnused,
}: {
  activeTab: string;
  onSelect: (section: string) => void;
  onShowUnused: () => void;
}) => {
  const { sourceData } = useContext(SourceDataContext);
  const summary = useMemo(() => setupSummary(sourceData), [sourceData]);
  const counts = {
    Exercises: summary.exercises,
    Supersets: summary.supersets,
    Sessions: summary.sessions,
    Plans: summary.plans,
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex flex-col gap-4 rounded-2xl p-5 text-white bg-gradient-to-br from-primary to-primary-400
          shadow-lg shadow-primary/30 motion-safe:animate-fade-up"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-white/70">Manage</span>
          <h1 className="text-xl font-bold">Your training setup</h1>
          <p className="text-sm text-white/80">Build exercises into supersets, sessions and plans.</p>
        </div>

        <nav aria-label="Manage sections" className="grid grid-cols-4 gap-1.5">
          {BUILD_SECTIONS.map((section) => {
            const active = activeTab === section;
            return (
              <button
                key={section}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onSelect(section)}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-11 min-w-0 px-0.5 py-2 rounded-xl
                  transition-colors ${ON_GRADIENT_FOCUS}
                  ${active ? "bg-white text-primary shadow-sm" : "bg-white/15 hover:bg-white/25"}`}
              >
                <FontAwesomeIcon icon={SECTION_ICONS[section]} className="text-sm" />
                <span className="text-lg font-bold leading-tight">{counts[section]}</span>
                <span className="text-[11px] font-semibold leading-tight">{section}</span>
              </button>
            );
          })}
        </nav>

        {summary.unusedExercises > 0 && (
          <button
            type="button"
            onClick={onShowUnused}
            className={`self-start flex items-center gap-2 min-h-11 px-4 rounded-full bg-white/15 text-sm font-semibold
              hover:bg-white/25 transition-colors ${ON_GRADIENT_FOCUS}`}
          >
            <FontAwesomeIcon icon={faTriangleExclamation} />
            {plural(summary.unusedExercises, "exercise")} unused
          </button>
        )}
      </div>

      <nav aria-label="More manage sections" className="flex gap-2">
        {MORE_SECTIONS.map((section) => {
          const active = activeTab === section;
          return (
            <button
              key={section}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onSelect(section)}
              className={active ? FILLED_PILL : OUTLINE_PILL}
            >
              {section}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
