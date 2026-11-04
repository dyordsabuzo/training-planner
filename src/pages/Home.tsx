import WrapperPage from "./WrapperPage";
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import AuthContext from "../context/AuthContext";
import SourceDataContext from "../context/SourceDataContext";
import UserManagementContext from "../context/UserManagementContext";
import AppSettingsContext from "../context/AppSettingsContext";
import { Loading } from "./helpers/Loading";
import { getDisplayName } from "../common/utils";
import { getCurrentWeekNumber } from "../common/planWeek";
import { PlanProgressCard } from "./others/PlanProgressCard";
import { StartOrgForm } from "./others/StartOrgForm";
import { DayStrip } from "./others/DayStrip";
import { DayAgendaCard } from "./others/DayAgendaCard";
import { DayEvents } from "./others/DayEvents";
import { AgendaRow } from "./others/AgendaRow";
import { OUTLINE_PILL } from "./others/HeroTile";
import { HeroStats, HomeHero } from "./others/HomeHero";
import { DayAgenda, dayAgenda, dayStatus, missedSessions, upNext } from "../common/dayAgenda";
import { trainingMomentum } from "../common/trainingMomentum";
import { checkinId } from "../common/checkins";
import { eventDay, RecurringEvent } from "../common/recurringEvents";
import { RecurringEventForm } from "../forms/RecurringEventForm";
import { DailyCheckInCard } from "./others/DailyCheckInCard";
import dayjs, { Dayjs } from "dayjs";
import { PENDING_INVITE_KEY } from "./JoinPage";

import { EmptyState } from "../management/EmptyState";
import { LoadMore } from "../management/LoadMore";
import { ON_GRADIENT_FOCUS } from "../management/ManageHero";
import { openPlanDoneSessions, openPlanSkippedSessions, sortPlansByCreated } from "../common/planSessions";
import { historyRuns, isSkipped } from "../common/sessionStats";
import { useLoadMore } from "../common/useLoadMore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDumbbell,
  faListCheck,
  faUsers,
  faLayerGroup,
  faClipboardList,
  faClockRotateLeft,
  faCircleCheck,
  faCircleExclamation,
  faChevronRight,
  faPlay,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { Card, Button, Input } from "@dyordsabuzo/ui-components";
import { RATINGS } from "../components/others/MoodCheckIn";

type PlanStats = {
  planName: string;
  isOpen?: boolean;
  totalWeeks: number;
  completedWeeks: number;
  currentWeekIndex: number | null;
  sessionsLogged: number;
};

type QuickAction = { icon: IconDefinition; title: string; description: string; to: string };

const COACH_ACTIONS: QuickAction[] = [
  { icon: faDumbbell, title: "Manage training plans", description: "Create and edit your plans", to: "/training-planner/manage/plans" },
  { icon: faListCheck, title: "Manage exercises", description: "The library every plan uses", to: "/training-planner/manage/exercises" },
  { icon: faLayerGroup, title: "Manage supersets", description: "Group exercises to reuse", to: "/training-planner/manage/supersets" },
  { icon: faClipboardList, title: "Manage sessions", description: "Build workouts from supersets", to: "/training-planner/manage/sessions" },
  { icon: faUsers, title: "Manage clients", description: "Progress, plans and invites", to: "/training-planner/admin" },
];

const CLIENT_ACTIONS: QuickAction[] = [
  { icon: faDumbbell, title: "Start training", description: "Pick up where you left off", to: "/training-planner/train" },
  { icon: faClockRotateLeft, title: "Training history", description: "See what you've done", to: "/training-planner/history" },
];

const QuickActions = ({ actions }: { actions: QuickAction[] }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-text-light dark:text-text-dark">
        Quick actions
      </h2>
      {/* Rows are gray-50, the same as the light page, so they need a white surface. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 rounded-2xl bg-white dark:bg-transparent shadow-sm dark:shadow-none">
        {actions.map(({ icon, title, description, to }) => (
          <AgendaRow
            key={title}
            icon={icon}
            tone="primary"
            title={title}
            subtitle={description}
            onClick={() => navigate(to)}
            trailing={
              <FontAwesomeIcon icon={faChevronRight} className="text-xs text-text-muted-light dark:text-text-muted-dark" />
            }
          />
        ))}
      </div>
    </div>
  );
};

// Today's main action, whichever day is selected in the strip: the next
// session with Start, or else one line on where the day stands.
const HeroToday = ({ agenda, missedCount }: { agenda: DayAgenda; missedCount: number }) => {
  const navigate = useNavigate();
  const next = upNext(agenda);
  if (!next) {
    const missedLine = missedCount === 1 ? "1 missed session" : `${missedCount} missed sessions`;
    return (
      <p className="text-sm font-semibold text-white/90">
        {agenda.scheduled.length > 0 || agenda.completed.length > 0
          ? "All done today — great work"
          : missedCount > 0
            ? `${missedLine} to catch up`
            : "Rest day — recover and recharge"}
      </p>
    );
  }
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white/10 p-3">
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-xs font-bold uppercase tracking-wider text-white/70">Up next</span>
        <span className="text-lg font-bold truncate">{next.session}</span>
        <span className="text-sm text-white/80 truncate">
          {[next.plan, next.optional && "Optional", next.overdue && "Overdue"].filter(Boolean).join(" · ")}
        </span>
      </div>
      <button
        type="button"
        onClick={() => navigate("/training-planner/train", { state: { plan: next.plan, session: next.session } })}
        className={`flex items-center gap-2 shrink-0 min-h-12 px-5 rounded-full bg-white text-primary font-bold shadow-md
          hover:bg-primary-50 transition-colors ${ON_GRADIENT_FOCUS}`}
      >
        <FontAwesomeIcon icon={faPlay} />
        Start
      </button>
    </div>
  );
};

const PLAN_PAGE_SIZE = 6;

// For someone in more than one org: which org's plans they're looking at,
// and a one-tap switch to the others (same as the profile menu switcher).
const OrgHint = () => {
  const { orgs, activeOrg, switchOrg } = useContext(AuthContext);
  if (orgs.length < 2) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted-light dark:text-text-muted-dark">
      <span>
        Training with <strong className="text-text-light dark:text-text-dark">{activeOrg?.name}</strong>. Also in:
      </span>
      {orgs
        .filter((org) => org.id !== activeOrg?.id)
        .map((org) => (
          <button
            key={org.id}
            type="button"
            onClick={() => switchOrg(org.id)}
            className={OUTLINE_PILL}
          >
            {org.name}
          </button>
        ))}
    </div>
  );
};

// Orgs the user lost because the platform admin suspended them; they
// otherwise just vanish from the switcher (see useOrgMembership).
const SuspendedNotice = () => {
  const { suspendedOrgs } = useContext(AuthContext);
  const { adminEmail } = useContext(AppSettingsContext);
  if (suspendedOrgs.length === 0) return null;
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-700/20 p-3 text-sm">
      <span className="text-amber-700 dark:text-amber-400 mt-0.5">
        <FontAwesomeIcon icon={faCircleExclamation} />
      </span>
      <div className="flex flex-col gap-1">
        {suspendedOrgs.map((org) => (
          <span key={org.id}>
            <strong>{org.name}</strong> is suspended. Contact{" "}
            <a href={`mailto:${adminEmail}`} className="text-primary dark:text-primary-300 font-semibold underline">
              {adminEmail}
            </a>
            .
          </span>
        ))}
      </div>
    </div>
  );
};

export const Home = () => {
  const authContext = useContext(AuthContext);
  const sourceDataContext = useContext(SourceDataContext);
  const userManagementContext = useContext(UserManagementContext);
  const { user, userPermission, isLoading, requestAccess, orgs, isImpersonating, activeOrgId } = authContext;
  const { sourceData, checkins = {}, saveCheckin, events = [], setAttendance } = sourceDataContext;
  const { users, fetchUsers } = userManagementContext;
  const { adminEmail } = useContext(AppSettingsContext);
  const { role, plans: grantedPlans = [] } = userPermission || {};
  const navigate = useNavigate();
  const [requestNote, setRequestNote] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Dayjs>(() => dayjs());
  // The recurring event being edited, or "new" while adding one.
  const [eventForm, setEventForm] = useState<RecurringEvent | "new" | null>(null);

  // Back to an invite link that was opened before signing in.
  useEffect(() => {
    const pendingInvite = user && localStorage.getItem(PENDING_INVITE_KEY);
    if (pendingInvite) {
      navigate(pendingInvite);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // `role` resolves asynchronously after `user` (userPermission is a
  // separate Firestore fetch) — keying this on `role`/`users` directly,
  // rather than folding it into the one-shot effect above, means it still
  // fires once role settles to "admin" even if that happens after the
  // effect above has already run and latched isDataInitialised.
  useEffect(() => {
    if (role === "admin" && !users) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, users]);

  // Every completed/in-progress week & session lives on the caller's own
  // users/{uid} doc, keyed by uid — the exact uid doesn't matter here since
  // getFromDB always scopes this fetch to the current user (see SessionPage).
  const userdata: any = useMemo(
    () => Object.values(sourceData?.userdata ?? {})[0] ?? {},
    [sourceData?.userdata]
  );

  const agendaFor = (day: Dayjs) =>
    dayAgenda(day, { plans: sourceData?.plans, sessions: sourceData?.sessions, userdata }, events);
  const missed = useMemo(
    () => missedSessions({ plans: sourceData?.plans, sessions: sourceData?.sessions, userdata }),
    [sourceData?.plans, sourceData?.sessions, userdata]
  );

  const planStats: PlanStats[] = useMemo(() => {
    const plans = sourceData?.plans ?? {};
    return sortPlansByCreated(plans).map(([planName, plan]: [string, any]) => {
      if (plan.open) {
        // Open plans count sessions instead of weeks.
        const sessionNames: string[] = plan.sessions ?? [];
        // Skipped sessions move the plan along but aren't logged workouts.
        const handled = openPlanDoneSessions(userdata, planName).filter((s) =>
          sessionNames.includes(s)
        );
        const skipped = openPlanSkippedSessions(userdata, planName);
        return {
          planName,
          isOpen: true,
          totalWeeks: sessionNames.length,
          completedWeeks: handled.length,
          currentWeekIndex: null,
          sessionsLogged: handled.filter((s) => !skipped.includes(s)).length,
        };
      }

      const planWeeks = userdata[planName] ?? {};
      // A week counts as done as soon as it has any logged session data —
      // the same rule SessionPage already uses to hide completed weeks from
      // the week picker, so this stays consistent with that behavior.
      const completedWeekKeys = Object.keys(planWeeks);
      const sessionsLogged = completedWeekKeys.reduce(
        (sum, weekKey) =>
          sum + Object.values(planWeeks[weekKey] ?? {}).filter((logged) => !isSkipped(logged)).length,
        0
      );

      return {
        planName,
        totalWeeks: Object.keys(plan.weeks ?? {}).length,
        completedWeeks: completedWeekKeys.length,
        currentWeekIndex: getCurrentWeekNumber(plan),
        sessionsLogged,
      };
    });
  }, [sourceData?.plans, userdata]);

  const { limit: planLimit, loadMore: loadMorePlans, showAll: showAllPlans } = useLoadMore(PLAN_PAGE_SIZE);
  const totalSessionsLogged = planStats.reduce((sum, p) => sum + p.sessionsLogged, 0);
  const momentum = useMemo(() => trainingMomentum(historyRuns(userdata), dayjs()), [userdata]);

  const avgMoodInfo = useMemo(() => {
    const ratings: number[] = [];
    Object.values(userdata).forEach((planWeeks: any) => {
      Object.values(planWeeks ?? {}).forEach((weekSessions: any) => {
        Object.values(weekSessions ?? {}).forEach((entry: any) => {
          const rating = entry?.mood?.after?.rating ?? entry?.mood?.before?.rating;
          if (rating) {
            ratings.push(rating);
          }
        });
      });
    });

    if (ratings.length === 0) {
      return null;
    }

    const average = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
    return RATINGS.find((r) => r.value === average) ?? null;
  }, [userdata]);

  if (isLoading) {
    return <Loading />;
  }

  const heroDate = dayjs().format("dddd, MMM D");

  if (role === "admin") {
    if (!sourceData?.plans || !users) {
      return <Loading />;
    }

    const planCount = Object.keys(sourceData.plans).length;
    const exerciseCount = Object.keys(sourceData.exercises ?? {}).length;
    const userCount = users.length;
    const adminCount = users.filter((u) => u.role === "admin").length;

    return (
      <WrapperPage className="max-w-[32rem] sm:max-w-3xl">
        <div className="flex flex-col gap-6 pt-6 w-full text-text-light dark:text-text-dark">
          <HomeHero
            eyebrow={heroDate}
            title={`Welcome back, ${getDisplayName(
              userPermission?.firstName,
              userPermission?.lastName,
              user?.email ?? undefined
            )}`}
          >
            <HeroStats
              stats={[
                { label: planCount === 1 ? "Plan" : "Plans", value: planCount },
                { label: exerciseCount === 1 ? "Exercise" : "Exercises", value: exerciseCount },
                { label: userCount === 1 ? "User" : "Users", value: userCount },
                { label: adminCount === 1 ? "Admin" : "Admins", value: adminCount },
              ]}
            />
          </HomeHero>

          <SuspendedNotice />

          <QuickActions actions={COACH_ACTIONS} />
        </div>
      </WrapperPage>
    );
  }

  if (user && grantedPlans.length > 0 && !sourceData?.plans) {
    return <Loading />;
  }

  return (
    <WrapperPage className="max-w-[25rem] sm:max-w-3xl">
      <div className="flex flex-col gap-6 pt-6 w-full text-text-light dark:text-text-dark">
        <HomeHero
          eyebrow={heroDate}
          title={
            user
              ? `Welcome back, ${getDisplayName(
                  userPermission?.firstName,
                  userPermission?.lastName,
                  user.email ?? undefined
                )}`
              : "Welcome to Training Planner"
          }
        >
          {user && grantedPlans.length > 0 && (
            <>
              <HeroToday agenda={agendaFor(dayjs())} missedCount={missed.length} />
              <HeroStats
                stats={[
                  { label: "Week streak", value: momentum.weekStreak },
                  { label: "This week", value: momentum.sessionsThisWeek },
                  { label: "Logged", value: totalSessionsLogged },
                  { label: "Mood", value: avgMoodInfo?.label ?? "—" },
                ]}
              />
            </>
          )}
        </HomeHero>

        {user && <SuspendedNotice />}

        {user && <OrgHint />}

        {user && grantedPlans.length === 0 && (
          <Card className="flex flex-col gap-3">
            <p>Thank you for signing up for Training Planner.</p>
            <p>
              In order to start training, you need to be assigned at least one
              training program. If your trainer sent you an invite link, open it
              to join their organisation.
            </p>

            {userPermission?.accessRequested ? (
              <div className="flex items-start gap-3 rounded-xl bg-success-50 dark:bg-success-700/20 p-3">
                <span className="text-success-700 dark:text-success-500 mt-0.5">
                  <FontAwesomeIcon icon={faCircleCheck} />
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-text-light dark:text-text-dark">
                    Request sent
                  </span>
                  <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
                    An administrator will review it and grant you access to a
                    training program.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Input
                  label="Note for the administrator (optional)"
                  value={requestNote}
                  placeholder="e.g. which program you're after"
                  changeValue={setRequestNote}
                />
                <Button
                  label={isRequesting ? "Sending…" : "Request access"}
                  className="min-h-11 self-start"
                  disabled={isRequesting}
                  onClick={async () => {
                    setIsRequesting(true);
                    try {
                      await requestAccess(requestNote);
                    } finally {
                      setIsRequesting(false);
                    }
                  }}
                />
              </div>
            )}

            <a
              href={`mailto:${adminEmail}`}
              className="self-start min-h-11 flex items-center text-sm font-semibold text-primary dark:text-primary-300 underline"
            >
              Contact us
            </a>

            {orgs.length === 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <StartOrgForm />
              </div>
            )}
          </Card>
        )}

        {user && grantedPlans.length > 0 && !isImpersonating && (
          <DailyCheckInCard checkin={checkins[checkinId(dayjs())]} onSave={saveCheckin} />
        )}

        {user && (grantedPlans.length > 0 || events.length > 0 || activeOrgId) && (
          <div className="flex flex-col gap-3">
            {(grantedPlans.length > 0 || events.length > 0) && (
              <DayStrip
                selected={selectedDay}
                onSelect={setSelectedDay}
                statusFor={(day) => dayStatus(agendaFor(day), day)}
              />
            )}
            <DayAgendaCard
              day={selectedDay}
              agenda={grantedPlans.length > 0 ? agendaFor(selectedDay) : undefined}
              events={agendaFor(selectedDay).events}
              missed={missed}
              checkin={checkins[checkinId(selectedDay)]}
            >
              {(activeOrgId || events.length > 0) && (
                <DayEvents
                  events={agendaFor(selectedDay).events}
                  hasAnyEvents={events.length > 0}
                  {...(!isImpersonating && {
                    onAttendance: (eventId, value) => setAttendance(eventId, eventDay(selectedDay), value),
                    onEditEvent: setEventForm,
                    ...(activeOrgId && { onAddEvent: () => setEventForm("new") }),
                  })}
                />
              )}
            </DayAgendaCard>
          </div>
        )}

        {eventForm && (
          <RecurringEventForm event={eventForm === "new" ? undefined : eventForm} closeForm={() => setEventForm(null)} />
        )}

        {user && grantedPlans.length > 0 && (
          <>
            <QuickActions actions={CLIENT_ACTIONS} />

            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-text-light dark:text-text-dark">
                Your training plans
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {planStats.slice(0, planLimit).map((stats) => (
                  <PlanProgressCard
                    key={stats.planName}
                    planName={stats.planName}
                    unitLabel={stats.isOpen ? "sessions" : "weeks"}
                    totalWeeks={stats.totalWeeks}
                    completedWeeks={stats.completedWeeks}
                    currentWeekIndex={stats.currentWeekIndex}
                    sessionsLogged={stats.sessionsLogged}
                    onContinue={() => navigate("/training-planner/train")}
                  />
                ))}
              </div>
              <LoadMore shown={planLimit} total={planStats.length} onLoadMore={loadMorePlans} onShowAll={showAllPlans} />
            </div>

            {totalSessionsLogged === 0 && (
              <EmptyState message="You haven't logged any sessions yet — start your first workout from the Train page." />
            )}
          </>
        )}
      </div>
    </WrapperPage>
  );
};
