import WrapperPage from "./WrapperPage";
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import AuthContext from "../context/AuthContext";
import SourceDataContext from "../context/SourceDataContext";
import UserManagementContext from "../context/UserManagementContext";
import { Loading } from "./helpers/Loading";
import { getDisplayName } from "../common/utils";
import { getCurrentWeekNumber } from "../common/planWeek";
import { PlanProgressCard } from "./others/PlanProgressCard";

import { EmptyState } from "../management/EmptyState";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDumbbell,
  faListCheck,
  faCalendarWeek,
  faUsers,
  faUserShield,
  faLayerGroup,
  faClipboardList,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { Card, Button } from "@dyordsabuzo/ui-components";
import { RATINGS } from "../components/others/MoodCheckIn";

const linkClassName =
  "font-bold text-primary hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded";

type PlanStats = {
  planName: string;
  totalWeeks: number;
  completedWeeks: number;
  currentWeekIndex: number | null;
  sessionsLogged: number;
};

const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: IconDefinition;
  label: string;
  value: string | number;
}) => (
  <Card className="flex flex-col gap-1 items-start">
    <span className="text-primary dark:text-primary-300">
      <FontAwesomeIcon icon={icon} />
    </span>
    <span className="text-xl font-bold text-text-light dark:text-text-dark">
      {value}
    </span>
    <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
      {label}
    </span>
  </Card>
);

const AdminActionCard = ({
  icon,
  title,
  description,
  buttonLabel,
  onClick,
}: {
  icon: IconDefinition;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}) => (
  <Card className="flex flex-col gap-3">
    <div className="flex items-center gap-3">
      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-800/40 text-primary dark:text-primary-300">
        <FontAwesomeIcon icon={icon} />
      </span>
      <span className="text-base font-bold text-text-light dark:text-text-dark">
        {title}
      </span>
    </div>
    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
      {description}
    </p>
    <Button label={buttonLabel} onClick={onClick} className="min-h-11" />
  </Card>
);

export const Home = () => {
  const authContext = useContext(AuthContext);
  const sourceDataContext = useContext(SourceDataContext);
  const userManagementContext = useContext(UserManagementContext);
  const { user, userPermission, isLoading } = authContext;
  const { sourceData } = sourceDataContext;
  const { users, fetchUsers } = userManagementContext;
  const { role, plans: grantedPlans = [] } = userPermission || {};
  const navigate = useNavigate();

  const [isDataInitialised, setIsDataInitialised] = useState(false);

  useEffect(() => {
    if (user && !isDataInitialised) {
      sourceDataContext.initialise();
      setIsDataInitialised(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isDataInitialised]);

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

  const planStats: PlanStats[] = useMemo(() => {
    const plans = sourceData?.plans ?? {};
    return Object.entries(plans).map(([planName, plan]: [string, any]) => {
      const planWeeks = userdata[planName] ?? {};
      // A week counts as done as soon as it has any logged session data —
      // the same rule SessionPage already uses to hide completed weeks from
      // the week picker, so this stays consistent with that behavior.
      const completedWeekKeys = Object.keys(planWeeks);
      const sessionsLogged = completedWeekKeys.reduce(
        (sum, weekKey) => sum + Object.keys(planWeeks[weekKey] ?? {}).length,
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

  const totalSessionsLogged = planStats.reduce((sum, p) => sum + p.sessionsLogged, 0);
  const totalWeeksCompleted = planStats.reduce((sum, p) => sum + p.completedWeeks, 0);

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

  if (role === "admin") {
    if (!sourceData?.plans || !users) {
      return <Loading />;
    }

    const planCount = Object.keys(sourceData.plans).length;
    const exerciseCount = Object.keys(sourceData.exercises ?? {}).length;
    const userCount = users.length;
    const adminCount = users.filter((u) => u.role === "admin").length;

    return (
      <WrapperPage className="max-w-[25rem] sm:max-w-3xl">
        <div className="flex flex-col gap-6 pt-6 w-full text-text-light dark:text-text-dark">
          <h1 className="text-2xl font-bold">
            {`Welcome back, ${getDisplayName(
              userPermission?.firstName,
              userPermission?.lastName,
              user?.email ?? undefined
            )}`}
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={faDumbbell}
              label={planCount === 1 ? "Training plan" : "Training plans"}
              value={planCount}
            />
            <StatCard
              icon={faListCheck}
              label={exerciseCount === 1 ? "Exercise in library" : "Exercises in library"}
              value={exerciseCount}
            />
            <StatCard
              icon={faUsers}
              label={userCount === 1 ? "Registered user" : "Registered users"}
              value={userCount}
            />
            <StatCard
              icon={faUserShield}
              label={adminCount === 1 ? "Administrator" : "Administrators"}
              value={adminCount}
            />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-text-light dark:text-text-dark">
              Quick actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AdminActionCard
                icon={faDumbbell}
                title="Manage training plans"
                description="Create and edit exercises, supersets, sessions, and training plans."
                buttonLabel="Go to training setup"
                onClick={() => navigate("/training-planner/manage/plans")}
              />
              <AdminActionCard
                icon={faListCheck}
                title="Manage exercises"
                description="Create and edit the exercise library used across every plan."
                buttonLabel="Go to exercises"
                onClick={() => navigate("/training-planner/manage/exercises")}
              />
              <AdminActionCard
                icon={faLayerGroup}
                title="Manage supersets"
                description="Group exercises into supersets to reuse across sessions."
                buttonLabel="Go to supersets"
                onClick={() => navigate("/training-planner/manage/supersets")}
              />
              <AdminActionCard
                icon={faClipboardList}
                title="Manage sessions"
                description="Build workout sessions from your supersets."
                buttonLabel="Go to sessions"
                onClick={() => navigate("/training-planner/manage/sessions")}
              />
              <AdminActionCard
                icon={faUsers}
                title="Manage users"
                description="Review registered users, grant plan access, and update roles."
                buttonLabel="Go to user management"
                onClick={() => navigate("/training-planner/admin")}
              />
            </div>
          </div>
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
        <h1 className="text-2xl font-bold">
          {user
            ? `Welcome back, ${getDisplayName(
                userPermission?.firstName,
                userPermission?.lastName,
                user.email ?? undefined
              )}`
            : "Welcome to Training Planner"}
        </h1>

        {user && grantedPlans.length === 0 && (
          <>
            <p>Thank you for signing up for Training Planner.</p>
            <p>
              In order to start training, you need to be assigned at least one
              training program.
            </p>
            <p>
              Please contact the administrator at{" "}
              <a href="mailto:trainingplanner6@gmail.com" className={linkClassName}>
                trainingplanner6@gmail.com
              </a>{" "}
              to get access to specific training program(s).
            </p>
          </>
        )}

        {user && grantedPlans.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={faDumbbell}
                label={planStats.length === 1 ? "Training plan" : "Training plans"}
                value={planStats.length}
              />
              <StatCard
                icon={faCalendarWeek}
                label={totalWeeksCompleted === 1 ? "Week done" : "Weeks done"}
                value={totalWeeksCompleted}
              />
              <StatCard
                icon={faListCheck}
                label={totalSessionsLogged === 1 ? "Session logged" : "Sessions logged"}
                value={totalSessionsLogged}
              />
              <Card className="flex flex-col gap-1 items-start">
                {avgMoodInfo ? (
                  <>
                    <span className="text-primary dark:text-primary-300 text-lg">
                      <FontAwesomeIcon icon={avgMoodInfo.icon} />
                    </span>
                    <span className="text-xl font-bold text-text-light dark:text-text-dark">
                      {avgMoodInfo.label}
                    </span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-text-light dark:text-text-dark">
                    —
                  </span>
                )}
                <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                  Average mood
                </span>
              </Card>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-text-light dark:text-text-dark">
                Your training plans
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {planStats.map((stats) => (
                  <PlanProgressCard
                    key={stats.planName}
                    planName={stats.planName}
                    totalWeeks={stats.totalWeeks}
                    completedWeeks={stats.completedWeeks}
                    currentWeekIndex={stats.currentWeekIndex}
                    sessionsLogged={stats.sessionsLogged}
                    onContinue={() => navigate("/training-planner/train")}
                  />
                ))}
              </div>
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
