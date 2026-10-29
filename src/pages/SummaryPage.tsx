
import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import SessionContext from "../context/SessionContext";
import WrapperPage from "./WrapperPage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { Celebration } from "./others/Celebration";
import { SessionProgress } from "./others/SessionProgress";
import { SectionLabel } from "./others/AgendaRow";
import { HeroTile, PRIMARY_PILL } from "./others/HeroTile";

import { isTrainSessionPath } from "../routes/trainRoutes";
import { ConfirmDeleteButton } from "../forms/ConfirmDeleteButton";
import { MoodCheckIn, MoodValue } from "../components/others/MoodCheckIn";
import { playApplauseSound, playVoiceClip } from "../common/utils";
import { pluralUnit, unitName, unitTitle, UnitKind } from "./resolveSessionSupersets";

type Props = {
  currentSuperset?: any;
  nextSuperset?: any;
  actualSupersetData?: any;
  supersetIndex?: number;
  nextPageHandler?: () => void;
  // Unit ids skipped so far in the run.
  skippedIds?: string[];
};

// "2 supersets · 1 exercise group", counting each kind of unit separately.
const summaryCounts = (units: any[]) => {
  const groups = units.filter((u) => u.kind === "group").length;
  const supersets = units.length - groups;
  return [
    supersets > 0 && pluralUnit("superset", supersets),
    groups > 0 && pluralUnit("group", groups),
  ]
    .filter(Boolean)
    .join(" · ");
};

// Pills for a unit's hero tile: kind, exercise count and sets.
const unitDetails = (unit: any) => {
  const exercises = (unit.exercises ?? []).filter((item: any) => item.exercise);
  return [
    unitTitle(unit.kind),
    `${exercises.length} exercise${exercises.length === 1 ? "" : "s"}`,
    unit.targetSet ? `${unit.targetSet} set${Number(unit.targetSet) === 1 ? "" : "s"}` : null,
  ];
};

export const SummaryPage = ({
  currentSuperset = null,
  nextSuperset = null,
  actualSupersetData = null,
  supersetIndex = 0,
  nextPageHandler = () => {},
  skippedIds = [],
}: Props) => {
  const sessionComplete = currentSuperset && !nextSuperset;
  const {
    sessionData,
    wrapSession,
    updateUserData,
    saveRun,
    initialiseSession,
    setIsRunning,
    exitPath,
    useSessionUrl,
    showBackButton = true,
  } = useContext(SessionContext) as any;
  const navigate = useNavigate();
  const location = useLocation();
  const isSessionRoute = isTrainSessionPath(location.pathname);
  const [moodAfter, setMoodAfter] = useState<MoodValue>({});
  const hasAnnouncedCompletion = useRef(false);
  const announcedUnit = useRef<string | null>(null);
  const runSaved = useRef(false);

  useEffect(() => {
    // Guards against React StrictMode's dev-only double-invoke of mount
    // effects, which would otherwise announce completion twice.
    if (sessionComplete && !hasAnnouncedCompletion.current) {
      hasAnnouncedCompletion.current = true;
      playVoiceClip("workout-complete", playApplauseSound);
    }
  }, [sessionComplete]);

  useEffect(() => {
    // Announces each finished unit by name. The last unit is skipped because
    // "WORKOUT COMPLETE" is already spoken for it.
    const name = currentSuperset?.name;
    if (!name || sessionComplete || announcedUnit.current === name) {
      return;
    }
    announcedUnit.current = name;
    playVoiceClip(
      currentSuperset.kind === "group"
        ? "exercise-group-complete"
        : "superset-complete"
    );
  }, [currentSuperset?.name, sessionComplete]);

  const handleMoodAfterChange = (value: MoodValue) => {
    setMoodAfter(value);
    updateUserData({ mood: { after: value } });
  };

  const handleButtonClick = () => {
    if (sessionComplete) {
      wrapSession();
      navigate(exitPath);
    } else if (nextSuperset) {
      nextPageHandler();
    } else {
      setIsRunning(true);
      if (useSessionUrl) {
        navigate(`/training-planner/train/${crypto.randomUUID()}`);
      }
    }
  };

  // Ends the run between units: what was logged is saved, flagged incomplete.
  const handleEndSession = async () => {
    await saveRun?.(actualSupersetData ?? {}, { incomplete: true });
    wrapSession();
    navigate(exitPath);
  };

  const supersets = Object.values((sessionData as any).supersets) || [];
  const subtitle = [(sessionData as any).week, (sessionData as any).annotation]
    .filter((s: string) => typeof s === "string" && s.trim() !== "")
    .join(" · ");

  // Saves the finished run once, outside render.
  useEffect(() => {
    if (sessionComplete && actualSupersetData && !runSaved.current) {
      runSaved.current = true;
      saveRun?.(actualSupersetData);
    }
  }, [sessionComplete, actualSupersetData]);

  // What the button starts: the first unit before the run, else the next one.
  const upNext = currentSuperset ? nextSuperset : supersets[0];

  return (
    <WrapperPage
      className="max-w-[32rem] sm:max-w-xl lg:max-w-2xl"
      outerClassName={isSessionRoute ? "pb-8 px-2" : "pb-20 px-2"}
    >
      <div className="w-full flex flex-col gap-4 pt-8 text-text-light dark:text-text-dark">
        {!currentSuperset && showBackButton && (
          <button
            type="button"
            className="min-h-11 self-start flex items-center gap-2 text-sm text-primary hover:text-primary-700 font-bold
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            onClick={() => {
              initialiseSession(null);
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back
          </button>
        )}

        {sessionComplete && <Celebration />}

        <div>
          <h1 className="text-2xl font-bold">{(sessionData as any).session}</h1>
          {subtitle && (
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
              {subtitle}
            </p>
          )}
        </div>

        {upNext && (
          <HeroTile
            eyebrow={currentSuperset ? "Up next" : "First up"}
            title={upNext.name}
            details={unitDetails(upNext)}
          >
            <ol className="flex flex-col gap-1.5 text-sm font-medium leading-snug">
              {(upNext.exercises ?? [])
                .filter((item: any) => item.exercise)
                .map((item: any, index: number) => (
                  <li key={index} className="flex items-baseline gap-2 rounded-xl bg-white/10 px-3 py-2">
                    <span className="shrink-0 w-4 text-right text-xs font-bold text-white/60">{index + 1}</span>
                    <span className="min-w-0 break-words">{item.exercise.name}</span>
                  </li>
                ))}
            </ol>
          </HeroTile>
        )}

        {sessionComplete && (
          <MoodCheckIn
            title="How are you feeling after this session?"
            value={moodAfter}
            onChange={handleMoodAfterChange}
          />
        )}

        <div
          className="rounded-2xl p-4 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700
            shadow-sm flex flex-col"
        >
          <SectionLabel>
            Session progress · {summaryCounts(supersets)}
          </SectionLabel>
          <SessionProgress
            supersets={supersets}
            doneUpToIndex={currentSuperset ? supersetIndex : -1}
            activeIndex={upNext ? supersets.indexOf(upNext) : undefined}
            skippedIds={skippedIds}
            collapseDone={!sessionComplete}
            compact
          />
        </div>

        {currentSuperset && nextSuperset && (
          <div className="flex justify-center">
            <ConfirmDeleteButton
              label="End session"
              icon={faCircleXmark}
              decoration="text-danger"
              useModal
              scrollToTopOnClose
              impactMessage="End the session now? Sets you've logged so far are saved and the session is marked incomplete."
              onDelete={handleEndSession}
            />
          </div>
        )}

        <div className="sticky bottom-0 -mx-2 px-2 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 dark:bg-surface-dark/95">
          <button type="button" className={`${PRIMARY_PILL} w-full`} onClick={handleButtonClick}>
            {nextSuperset
              ? `Next ${unitName(nextSuperset.kind as UnitKind)}`
              : currentSuperset
                ? "Finish workout"
                : "Start workout"}
          </button>
        </div>
      </div>
    </WrapperPage>
  );
};
