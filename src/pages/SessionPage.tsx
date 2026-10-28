import React, { ReactNode, useContext, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faCheck,
  faCircleCheck,
  faLayerGroup,
  faChevronLeft,
  faChevronRight,
  faClockRotateLeft,
  faDumbbell,
  faForwardStep,
  faPlay,
  faShuffle,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import SessionContext from "../context/SessionContext";
import { SummaryPage } from "./SummaryPage";
import { ExercisePage } from "./train/ExercisePage";
import SourceDataContext from "../context/SourceDataContext";
import WrapperPage from "./WrapperPage";

import { Loading } from "./helpers/Loading";
import { EmptyState } from "../management/EmptyState";
import { getCurrentWeekNumber } from "../common/planWeek";
import { Card } from "@dyordsabuzo/ui-components";
import { FOCUS, SectionLabel } from "./others/AgendaRow";
import { MoodCheckIn, MoodValue } from "../components/others/MoodCheckIn";
import { resolveSession, sessionOrder } from "./resolveSessionSupersets";
import {
  OPEN_WEEK,
  getLastLoggedWeight,
  getLastSessionWeight,
  getWeightForRule,
} from "../common/planCycle";
import { completedRuns, CompletedRun } from "../common/sessionStats";
import { SessionStats } from "./others/SessionStats";
import {
  formatSessionDate,
  sortPlansByCreated,
  openPlanDoneSessions,
  openPlanSkippedSessions,
  sessionDueStatus,
  sortSessionsByDate,
  isLapsedOptional,
} from "../common/planSessions";

// Weights start from the last session of the plan that included the exercise.
// "increase" weeks build on prior weeks only, so a second session in the same
// week doesn't add the increment twice.
const weightSeed = (userdata: any, plan: string, week: string, weightRule: any) => ({
  weightFor: (exerciseName: string, currentWeight: number) =>
    weightRule?.mode === "increase"
      ? getWeightForRule(
          weightRule,
          getLastLoggedWeight(userdata, plan, week, exerciseName),
          currentWeight
        )
      : getLastSessionWeight(userdata, plan, exerciseName) ?? currentWeight,
});

const sortWeekKeys = (keys: string[]) =>
  [...keys].sort((a, b) => {
    const [textA, numA] = a.split(" ");
    const [textB, numB] = b.split(" ");

    if (textA !== textB) {
      return textA.localeCompare(textB);
    }
    return Number(numA) - Number(numB);
  });

// Secondary actions on the gradient hero tile.
const upNextActionClassName = `flex items-center gap-2 min-h-11 px-4 rounded-full bg-white/10 text-sm font-semibold
  text-white/90 hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white`;

const OUTLINE_PILL = `flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-full border border-primary-200
  dark:border-primary-700 text-sm text-primary font-semibold hover:bg-primary-50 dark:hover:bg-primary-800/20 ${FOCUS}`;

const PRIMARY_PILL = `flex items-center justify-center gap-2 min-h-12 px-6 rounded-full bg-primary text-white text-base
  font-bold shadow-sm shadow-primary/30 hover:bg-primary-500 transition-colors ${FOCUS}`;

const chipClassName = (isSelected: boolean, isCurrent = false) =>
  `min-h-11 px-4 rounded-full text-sm font-semibold transition-colors ${FOCUS}
   ${
     isSelected
       ? "bg-primary text-white shadow-sm shadow-primary/30"
       : isCurrent
         ? "bg-primary-50 text-primary dark:bg-primary-800/30 dark:text-primary-200"
         : "bg-gray-50 dark:bg-gray-800/40 text-text-light dark:text-text-dark hover:bg-primary-50 dark:hover:bg-primary-800/20"
   }`;

// Completed sessions shown before "Show all".
const DONE_PREVIEW = 3;

type SessionRowStatus = "today" | "overdue" | "upcoming" | "done" | "skipped" | "lapsed";

const DATE_TILE: Record<SessionRowStatus, string> = {
  today: "bg-primary text-white shadow-sm shadow-primary/30",
  overdue: "bg-red-50 text-danger dark:bg-red-500/15",
  upcoming: "bg-primary-50 text-primary dark:bg-primary-800/30 dark:text-primary-300",
  done: "bg-success-50 text-success dark:bg-success-500/20 dark:text-success-500",
  skipped: "bg-gray-100 text-text-muted-light dark:bg-gray-700/60 dark:text-text-muted-dark",
  lapsed: "bg-gray-100 text-text-muted-light dark:bg-gray-700/60 dark:text-text-muted-dark",
};

const STATUS_CHIP: Partial<Record<SessionRowStatus, [string, string]>> = {
  today: ["Today", "bg-primary-50 text-primary dark:bg-primary-800/30 dark:text-primary-200"],
  overdue: ["Overdue", "bg-red-50 text-danger dark:bg-red-500/15"],
  skipped: ["Skipped", "bg-gray-100 text-text-muted-light dark:bg-gray-700/60 dark:text-text-muted-dark"],
  lapsed: ["Lapsed", "bg-gray-100 text-text-muted-light dark:bg-gray-700/60 dark:text-text-muted-dark"],
};

// A session in the picker: date tile, name, size, and one status chip.
const SessionRow = ({
  name,
  config,
  status,
  selected,
  onClick,
}: {
  name: string;
  config: any;
  status: SessionRowStatus;
  selected: boolean;
  onClick: () => void;
}) => {
  const date = config?.date ? dayjs(config.date) : null;
  const groups = (config?.groups?.length ?? 0) + (config?.supersets?.length ?? 0);
  const chip = STATUS_CHIP[status];
  const finished = status === "done" || status === "skipped" || status === "lapsed";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-3 w-full min-h-16 p-2 pr-3 rounded-2xl text-left transition-colors
        bg-gray-50 dark:bg-gray-800/40 hover:bg-primary-50/60 dark:hover:bg-primary-800/20 ${FOCUS}
        ${selected ? "ring-2 ring-primary" : ""} ${finished ? "opacity-75" : ""}`}
    >
      <span
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 ${DATE_TILE[status]}`}
        title={date ? formatSessionDate(config.date) : undefined}
      >
        {date ? (
          <>
            <span className="text-[10px] font-bold uppercase leading-none opacity-80">{date.format("MMM")}</span>
            <span className="text-lg font-bold leading-tight">{date.format("D")}</span>
          </>
        ) : (
          <FontAwesomeIcon icon={status === "done" ? faCheck : faDumbbell} />
        )}
      </span>
      <span className="flex flex-col min-w-0 grow">
        <span className="font-semibold truncate text-text-light dark:text-text-dark" title={name}>
          {name}
        </span>
        <span className="text-xs truncate text-text-muted-light dark:text-text-muted-dark">
          {[date?.format("dddd"), `${groups} ${groups === 1 ? "group" : "groups"}`, config?.optional ? "Optional" : null]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      {chip ? (
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${chip[1]}`}>{chip[0]}</span>
      ) : status === "done" ? (
        <FontAwesomeIcon icon={faCircleCheck} className="shrink-0 text-lg text-success-500" aria-label="Done" />
      ) : (
        <FontAwesomeIcon icon={faChevronRight} className="shrink-0 px-1 text-text-muted-light dark:text-text-muted-dark" />
      )}
    </button>
  );
};

// A plan in the picker: size, current week and progress at a glance.
const PlanTile = ({
  name,
  plan,
  userdata,
  selected,
  onClick,
  onClear,
}: {
  name: string;
  plan: any;
  userdata: any;
  selected: boolean;
  onClick?: () => void;
  onClear?: () => void;
}) => {
  const sessionCount = plan?.sessions?.length ?? 0;
  const weekCount = Object.keys(plan?.weeks ?? {}).length;
  // Same rule as the week picker: a week with any logged run counts as done.
  const [done, total] = plan?.open
    ? [openPlanDoneSessions(userdata, name).length, sessionCount]
    : [Object.keys(userdata?.[name] ?? {}).length, weekCount];
  const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const currentWeek = plan?.open ? null : getCurrentWeekNumber(plan);
  const muted = selected ? "text-white/75" : "text-text-muted-light dark:text-text-muted-dark";

  const body = (
    <>
      <span className="flex items-start gap-3">
        <span
          className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${
            selected
              ? "bg-white/15"
              : "bg-primary-50 text-primary dark:bg-primary-800/30 dark:text-primary-300"
          }`}
        >
          <FontAwesomeIcon icon={plan?.open ? faCalendarDays : faLayerGroup} />
        </span>
        <span className="flex flex-col min-w-0 grow">
          <span className="font-bold line-clamp-2 break-words" title={name}>
            {name}
          </span>
          <span className={`text-xs ${muted}`}>
            {[
              plan?.open ? "Open plan" : `${weekCount} ${weekCount === 1 ? "week" : "weeks"}`,
              `${sessionCount} ${sessionCount === 1 ? "session" : "sessions"}`,
            ].join(" · ")}
          </span>
        </span>
        {currentWeek !== null && currentWeek < weekCount && (
          <span
            className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
              selected ? "bg-white/15" : "bg-primary-50 text-primary dark:bg-primary-800/30 dark:text-primary-200"
            }`}
          >
            Week {currentWeek + 1}
          </span>
        )}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear plan selection"
            title="Clear selection"
            className="shrink-0 flex items-center justify-center w-11 h-11 -m-2 rounded-full text-white/80
              hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        )}
      </span>
      <span className="flex flex-col gap-1.5">
        <span className={`h-1.5 rounded-full overflow-hidden ${selected ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"}`}>
          <span
            className={`block h-full rounded-full ${selected ? "bg-white" : "bg-primary"}`}
            style={{ width: `${percent}%` }}
          />
        </span>
        <span className={`text-xs font-medium ${muted}`}>
          {done} of {total} {plan?.open ? "sessions" : "weeks"} done
        </span>
      </span>
    </>
  );

  const className = `flex flex-col gap-4 w-full p-4 rounded-2xl text-left transition-all ${
    selected
      ? "text-white bg-gradient-to-br from-primary to-primary-400 shadow-md shadow-primary/30"
      : "text-text-light dark:text-text-dark bg-gray-50 dark:bg-gray-800/40 hover:bg-primary-50/60 dark:hover:bg-primary-800/20 hover:shadow-sm"
  }`;

  return onClick ? (
    <button type="button" aria-pressed={selected} onClick={onClick} className={`${className} ${FOCUS}`}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
};

// Gradient tile for the session about to be started (Up next / Ready).
const HeroTile = ({
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

const SessionPage = () => {
  const sessionContext = useContext(SessionContext);
  const sourceDataContext = useContext(SourceDataContext);
  const { sourceData } = sourceDataContext as any;
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const [sessionData, setSessionData] = useState<any>({});
  const [viewingRun, setViewingRun] = useState<CompletedRun | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [moodBefore, setMoodBefore] = useState<MoodValue>({});
  // The session just skipped from Up next, so it can be undone.
  const [lastSkipped, setLastSkipped] = useState<{ plan: string; week: string; session: string } | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);
  const [showAllDone, setShowAllDone] = useState(false);
  // Whether the chosen session came from the list (vs. Up next), for Back.
  const [sessionFromPicker, setSessionFromPicker] = useState(false);

  const skip = async (target: { plan: string; week: string; session: string }) => {
    setIsSkipping(true);
    try {
      await sessionContext.skipSession(target);
      setLastSkipped(target);
    } finally {
      setIsSkipping(false);
    }
  };

  const undoSkip = async () => {
    if (!lastSkipped) return;
    await sessionContext.deleteRuns([lastSkipped]);
    setLastSkipped(null);
  };

  useEffect(() => {
    sessionContext.setIsSessionOn(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A session URL only makes sense while its workout is active in memory —
  // e.g. after a hard refresh there's nothing to resume, so bounce back to setup.
  useEffect(() => {
    if (sessionId && !sessionContext.sessionData) {
      navigate("/training-planner/train", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, sessionContext.sessionData]);

  const plans = sourceData?.plans ?? {};
  const planNames = sortPlansByCreated(plans).map(([name]) => name);
  const selectedPlanData: any = sessionData.plan ? plans[sessionData.plan] : null;

  const completedWeeks: string[] = useMemo(() => {
    if (!sessionData.plan) {
      return [];
    }
    const userdata: any = Object.values(sourceData?.userdata ?? {})[0];
    if (userdata && sessionData.plan in userdata) {
      return Object.keys(userdata[sessionData.plan]);
    }
    return [];
  }, [sessionData.plan, sourceData?.userdata]);

  const weekOptions = useMemo(() => {
    if (!selectedPlanData || selectedPlanData.open) {
      return [];
    }
    return sortWeekKeys(Object.keys(selectedPlanData.weeks ?? {})).filter(
      (w) => !completedWeeks.includes(w)
    );
  }, [selectedPlanData, completedWeeks]);

  const isOpenPlan = !!selectedPlanData?.open;
  const sessionOptions: string[] = selectedPlanData
    ? isOpenPlan
      ? sortSessionsByDate(selectedPlanData.sessions ?? [], sourceData?.sessions)
      : [...(selectedPlanData.sessions ?? [])].sort()
    : [];
  const openDone = isOpenPlan
    ? openPlanDoneSessions(Object.values(sourceData?.userdata ?? {})[0], sessionData.plan)
    : [];
  const openSkipped = isOpenPlan
    ? openPlanSkippedSessions(Object.values(sourceData?.userdata ?? {})[0], sessionData.plan)
    : [];

  const completedList = sessionData.plan
    ? completedRuns(Object.values(sourceData?.userdata ?? {})[0], sessionData.plan)
    : [];

  // Sets a plan, week and session in one step (used by the up-next card).
  const startSession = (planName: string, week: string, session: string) => {
    const plan: any = plans[planName];
    const weekData: any = plan?.open ? {} : plan?.weeks?.[week] ?? {};
    const userdata: any = Object.values(sourceData?.userdata ?? {})[0];
    const { targetRep, targetSet, targetTime, annotation, weightRule } = weekData;
    const supersets = resolveSession(sourceData, sourceData.sessions[session], {
      targetRep,
      targetSet,
      annotation,
      referenceWeight: (exerciseName: string) =>
        getLastLoggedWeight(userdata, planName, week, exerciseName) ?? undefined,
      ...weightSeed(userdata, planName, week, weightRule),
    });
    setSessionData({
      plan: planName,
      week,
      session,
      targetRep,
      targetSet,
      targetTime,
      annotation,
      weightRule,
      supersets,
    });
    setPickerOpen(false);
    setLastSkipped(null);
    setSessionFromPicker(false);
  };

  // The next session to do: the first unfinished one in the selected plan.
  const upNext = (() => {
    const planName = sessionData.plan;
    if (!selectedPlanData || !planName) return null;
    if (isOpenPlan) {
      const session = sessionOptions.find(
        (name) => !openDone.includes(name) && !isLapsedOptional(sourceData?.sessions?.[name])
      );
      return session
        ? { plan: planName, week: OPEN_WEEK, session, date: sourceData?.sessions?.[session]?.date }
        : null;
    }
    const currentKey = `Week ${(getCurrentWeekNumber(selectedPlanData) ?? -1) + 1}`;
    const week =
      sessionData.week && weekOptions.includes(sessionData.week)
        ? sessionData.week
        : weekOptions.includes(currentKey)
          ? currentKey
          : weekOptions[0];
    if (!week) return null;
    const userdata: any = Object.values(sourceData?.userdata ?? {})[0];
    const doneInWeek = Object.keys(userdata?.[planName]?.[week] ?? {});
    const session = sessionOptions.find(
      (name) => !doneInWeek.includes(name) && !isLapsedOptional(sourceData?.sessions?.[name])
    );
    return session
      ? { plan: planName, week, session, date: sourceData?.sessions?.[session]?.date }
      : null;
  })();

  const showPicker = pickerOpen || (!sessionData.session && !upNext);

  // The completed run for the chosen week and session, if there is one.
  const selectedRun = sessionData.session
    ? completedList.find(
        (run) => run.session === sessionData.session && run.week === sessionData.week
      ) ?? null
    : null;

  const doneInSelectedWeek: string[] =
    !isOpenPlan && sessionData.week
      ? Object.keys((Object.values(sourceData?.userdata ?? {})[0] as any)?.[sessionData.plan]?.[sessionData.week] ?? {})
      : [];

  const statusOf = (session: string): SessionRowStatus => {
    const config = sourceData?.sessions?.[session];
    if (openSkipped.includes(session)) return "skipped";
    if (openDone.includes(session) || doneInSelectedWeek.includes(session)) return "done";
    if (isLapsedOptional(config)) return "lapsed";
    if (sessionDueStatus(config?.date, false, config?.optional === true) === "overdue") return "overdue";
    if (config?.date && dayjs(config.date).isSame(dayjs(), "day")) return "today";
    return "upcoming";
  };

  // To do: soonest first (sessionOptions is already date-ascending for open plans).
  // Completed: most recent first, undated last.
  const isFinished = (session: string) => ["done", "skipped", "lapsed"].includes(statusOf(session));
  const toDoSessions = sessionOptions.filter((session) => !isFinished(session));
  const finishedSessions = sessionOptions
    .filter(isFinished)
    .sort((a, b) =>
      (sourceData?.sessions?.[b]?.date ?? "").localeCompare(sourceData?.sessions?.[a]?.date ?? "") ||
      a.localeCompare(b)
    );

  const currentWeekIndex = selectedPlanData ? getCurrentWeekNumber(selectedPlanData) : null;

  const selectPlan = (plan: string) => {
    setSessionData({ plan });
    setPickerOpen(false);
  };

  const selectWeek = (week: string) => {
    const weekData: any = selectedPlanData.weeks[week];
    setSessionData((prev: any) => ({
      ...prev,
      week,
      annotation: weekData.annotation,
      targetRep: weekData.targetRep,
      targetSet: weekData.targetSet,
      targetTime: weekData.targetTime,
      weightRule: weekData.weightRule,
    }));
  };

  const selectSession = (session: string) => {
    const { targetRep, targetSet, annotation, weightRule, plan, week } = sessionData;
    const userdata: any = Object.values(sourceData?.userdata ?? {})[0];
    const supersets = resolveSession(sourceData, sourceData.sessions[session], {
      targetRep,
      targetSet,
      annotation,
      // Group % targets are taken from the last weight logged for the exercise.
      referenceWeight: (exerciseName: string) =>
        getLastLoggedWeight(userdata, plan, week, exerciseName) ?? undefined,
      ...weightSeed(userdata, plan, week, weightRule),
    });

    setSessionData((prev: any) => ({ ...prev, session, supersets }));
    setPickerOpen(false);
    setSessionFromPicker(true);
  };

  // One step back: Ready → where the session was picked, open picker → Up next,
  // chosen plan → plan list. A lone session in a fixed week is auto-selected,
  // so clearing it would just re-select it; step back to the plans instead.
  const autoSelectedSession = !isOpenPlan && sessionOptions.length === 1;

  // Clears the plan so every plan card unfolds again.
  const clearPlan = () => {
    setSessionData({});
    setPickerOpen(false);
    setLastSkipped(null);
  };
  const back = (() => {
    if (sessionData.session && !autoSelectedSession) {
      return {
        label: sessionFromPicker ? "Back to sessions" : "Back",
        run: () => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          setSessionData(({ session, supersets, ...rest }: any) => rest);
          setPickerOpen(sessionFromPicker);
        },
      };
    }
    if (pickerOpen && sessionData.plan) {
      return { label: "Back", run: () => setPickerOpen(false) };
    }
    if (sessionData.plan && planNames.length > 1) {
      return { label: "Back to plans", run: clearPlan };
    }
    return null;
  })();

  // Open plans have no weeks, so every run is logged under the OPEN_WEEK key.
  useEffect(() => {
    if (isOpenPlan && sessionData.week !== OPEN_WEEK) {
      setSessionData((prev: any) => ({ ...prev, week: OPEN_WEEK }));
    }
  }, [isOpenPlan, sessionData.week]);

  // Skip trivial choices: auto-select the plan/session when there's only one option.
  useEffect(() => {
    if (!sessionData.plan && planNames.length === 1) {
      selectPlan(planNames[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planNames.join(","), sessionData.plan]);

  useEffect(() => {
    if (selectedPlanData && !sessionData.week && weekOptions.length > 0) {
      const currentWeekKey = `Week ${(currentWeekIndex ?? -1) + 1}`;
      selectWeek(weekOptions.includes(currentWeekKey) ? currentWeekKey : weekOptions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlanData, weekOptions.join(","), sessionData.week]);

  useEffect(() => {
    // Open plans always show their list, so the single session is still visible.
    if (!isOpenPlan && sessionData.week && !sessionData.session && sessionOptions.length === 1) {
      selectSession(sessionOptions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData.week, sessionOptions.join(","), sessionData.session, isOpenPlan]);

  if (sessionContext.sessionData && !sessionContext.isRunning) {
    return <SummaryPage />;
  }

  if (sessionContext.isRunning) {
    return <ExercisePage />;
  }

  if (!sourceData.plans) {
    return <Loading />;
  }

  if (planNames.length === 0) {
    return (
      <WrapperPage>
        <EmptyState message="No training plans assigned yet. Contact your administrator to get access." />
      </WrapperPage>
    );
  }

  return (
    <WrapperPage className="max-w-[32rem] sm:max-w-xl lg:max-w-4xl">
      <div className="flex flex-col gap-6 pt-8">
        <div>
          {back && (
            <button
              type="button"
              onClick={back.run}
              className={`flex items-center gap-2 min-h-11 -ml-2 mb-1 px-2 rounded-full text-sm font-semibold
                text-primary hover:bg-primary-50 dark:hover:bg-primary-800/20 ${FOCUS}`}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
              {back.label}
            </button>
          )}
          <div className="flex items-center justify-between gap-3">
            <h1 className="flex items-center gap-3 text-2xl font-bold text-text-light dark:text-text-dark">
              <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-800/40 text-primary dark:text-primary-300">
                <FontAwesomeIcon icon={faDumbbell} className="text-base" />
              </span>
              Start a workout
            </h1>
            <button
              type="button"
              onClick={() => navigate("/training-planner/history")}
              className={`${OUTLINE_PILL} shrink-0`}
            >
              <FontAwesomeIcon icon={faClockRotateLeft} />
              History
            </button>
          </div>
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
            {!sessionData.plan
              ? "Choose a plan to begin."
              : upNext && !showPicker && !sessionData.session
                ? "Ready when you are."
                : "Pick a week and session to begin."}
          </p>
        </div>

        <div className="flex flex-col">
          <SectionLabel>{sessionData.plan ? "Plan" : "Your plans"}</SectionLabel>
          {/* Single column so unselected plans can fold away (grid-rows 1fr → 0fr)
              while the selected one stays put. */}
          <div className="flex flex-col -m-1.5 -mb-1.5">
            {planNames.map((plan) => {
              const selected = sessionData.plan === plan;
              const folded = !!sessionData.plan && !selected;
              return (
                <div
                  key={plan}
                  aria-hidden={folded}
                  {...(folded ? { inert: "" } : {})}
                  className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out
                    motion-reduce:transition-none ${
                      folded ? "grid-rows-[0fr] opacity-0 -translate-y-2" : "grid-rows-[1fr] opacity-100"
                    }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="p-1.5">
                      <PlanTile
                        name={plan}
                        plan={plans[plan]}
                        userdata={Object.values(sourceData?.userdata ?? {})[0]}
                        selected={selected}
                        // A single plan is pre-selected and can't be cleared.
                        onClick={planNames.length > 1 && !selected ? () => selectPlan(plan) : undefined}
                        onClear={planNames.length > 1 && selected ? clearPlan : undefined}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!showPicker && sessionData.session && (
          <HeroTile
            eyebrow="Ready"
            title={sessionData.session}
            details={[
              sessionData.plan,
              sessionData.week !== OPEN_WEEK ? sessionData.week : null,
              sourceData?.sessions?.[sessionData.session]?.date
                ? formatSessionDate(sourceData.sessions[sessionData.session].date)
                : null,
            ]}
          >
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => setPickerOpen(true)} className={upNextActionClassName}>
                <FontAwesomeIcon icon={faShuffle} />
                Change
              </button>
            </div>
          </HeroTile>
        )}

        {lastSkipped && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 min-h-14 rounded-2xl px-2 py-1.5 bg-gray-50 dark:bg-gray-800/40"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 bg-gray-100 text-text-muted-light dark:bg-gray-700/60 dark:text-text-muted-dark">
                <FontAwesomeIcon icon={faForwardStep} />
              </span>
              <span className="text-sm min-w-0 break-words text-text-light dark:text-text-dark">
                Skipped {lastSkipped.session}.
              </span>
            </span>
            <button
              type="button"
              onClick={undoSkip}
              className={`min-h-11 px-3 shrink-0 rounded-full text-sm font-semibold text-primary hover:bg-primary-50 dark:hover:bg-primary-800/20 ${FOCUS}`}
            >
              Undo
            </button>
          </div>
        )}

        {!showPicker && !sessionData.session && upNext && (
          <HeroTile
            eyebrow="Up next"
            title={upNext.session}
            details={[
              upNext.plan,
              upNext.week !== OPEN_WEEK ? upNext.week : null,
              upNext.date ? formatSessionDate(upNext.date) : null,
            ]}
          >
            <button
              type="button"
              onClick={() => startSession(upNext.plan, upNext.week, upNext.session)}
              className="flex items-center justify-center gap-2 min-h-12 px-6 rounded-full bg-white text-primary
                text-base font-bold shadow-md hover:bg-primary-50 transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <FontAwesomeIcon icon={faPlay} />
              Start
            </button>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className={upNextActionClassName}
              >
                <FontAwesomeIcon icon={faShuffle} />
                Choose another
              </button>
              <button
                type="button"
                disabled={isSkipping}
                onClick={() => skip({ plan: upNext.plan, week: upNext.week, session: upNext.session })}
                className={`${upNextActionClassName} disabled:opacity-50`}
              >
                <FontAwesomeIcon icon={faForwardStep} />
                {isSkipping ? "Skipping…" : "Skip"}
              </button>
            </div>
          </HeroTile>
        )}

        {showPicker && sessionData.plan && (
          <Card key={sessionData.plan} className="flex flex-col gap-4 motion-safe:animate-fade-up">

        {sessionData.plan && !isOpenPlan && (
          <div className="flex flex-col gap-2">
            <SectionLabel>Week</SectionLabel>
            {weekOptions.length === 0 ? (
              <EmptyState message="All weeks in this plan are already completed." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {weekOptions.map((week) => {
                  const weekData: any = selectedPlanData.weeks[week];
                  return (
                    <button
                      key={week}
                      type="button"
                      title={weekData.annotation || undefined}
                      onClick={() => selectWeek(week)}
                      className={chipClassName(
                        sessionData.week === week,
                        currentWeekIndex === weekData.weekNumber
                      )}
                    >
                      {week}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {sessionData.week && (
          <div className="flex flex-col gap-2">
            {sessionOptions.length === 0 ? (
              <>
              <SectionLabel>Session</SectionLabel>
              <div className="flex flex-col items-start gap-2">
                <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
                  This plan has no sessions yet.
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/training-planner/manage/plans")}
                  className={OUTLINE_PILL}
                >
                  Add sessions to this plan
                </button>
              </div>
              </>
            ) : !isOpenPlan && sessionOptions.length === 1 ? (
              <>
              <SectionLabel>Session</SectionLabel>
              <span className="text-base font-semibold text-text-light dark:text-text-dark">
                {sessionOptions[0]}
              </span>
              </>
            ) : (
              <>
              <SectionLabel>To do · {toDoSessions.length}</SectionLabel>
              {toDoSessions.length === 0 ? (
                <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
                  You're all caught up.
                </span>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {toDoSessions.map((session) => (
                    <SessionRow
                      key={session}
                      name={session}
                      config={sourceData?.sessions?.[session]}
                      status={statusOf(session)}
                      selected={sessionData.session === session}
                      onClick={() => selectSession(session)}
                    />
                  ))}
                </div>
              )}
              {finishedSessions.length > 0 && (
                <>
                  <SectionLabel
                    action={
                      finishedSessions.length > DONE_PREVIEW && (
                        <button
                          type="button"
                          onClick={() => setShowAllDone((prev) => !prev)}
                          className={`min-h-11 px-3 rounded-full text-sm font-semibold text-primary
                            hover:bg-primary-50 dark:hover:bg-primary-800/20 ${FOCUS}`}
                        >
                          {showAllDone ? "Show less" : `Show all ${finishedSessions.length}`}
                        </button>
                      )
                    }
                  >
                    Completed · {finishedSessions.length}
                  </SectionLabel>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {(showAllDone ? finishedSessions : finishedSessions.slice(0, DONE_PREVIEW)).map((session) => (
                      <SessionRow
                        key={session}
                        name={session}
                        config={sourceData?.sessions?.[session]}
                        status={statusOf(session)}
                        selected={sessionData.session === session}
                        onClick={() => selectSession(session)}
                      />
                    ))}
                  </div>
                </>
              )}
              </>
            )}
          </div>
        )}
          </Card>
        )}

        {sessionData.session && (
          <MoodCheckIn
            title="How do you feel before starting? (optional)"
            value={moodBefore}
            onChange={setMoodBefore}
          />
        )}

        {sessionData.session && (
        <div className="sticky bottom-0 -mx-2 px-2 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 dark:bg-surface-dark/95 backdrop-blur">
        {selectedRun ? (
          <div className="flex gap-2">
            <button
              type="button"
              className={`${PRIMARY_PILL} grow-[3]`}
              onClick={() => setViewingRun(selectedRun)}
            >
              View results
            </button>
            <button
              type="button"
              className={`${OUTLINE_PILL} min-h-12 text-base grow`}
              onClick={() =>
                sessionContext.initialiseSession({ ...sessionData, moodBefore })
              }
            >
              Run again
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`${PRIMARY_PILL} w-full disabled:opacity-50`}
            disabled={!sessionData.session}
            onClick={() =>
              sessionContext.initialiseSession({ ...sessionData, moodBefore })
            }
          >
            <FontAwesomeIcon icon={faPlay} />
            Start session
          </button>
        )}
        </div>
        )}
      </div>
      {viewingRun && (
        <SessionStats
          title={viewingRun.session}
          planName={sessionData.plan}
          week={viewingRun.week}
          session={viewingRun.session}
          logged={viewingRun.logged}
          order={sessionOrder(sourceData?.sessions?.[viewingRun.session], sourceData)}
          userdata={Object.values(sourceData?.userdata ?? {})[0]}
          onClose={() => setViewingRun(null)}
        />
      )}
    </WrapperPage>
  );
};

export default SessionPage;
