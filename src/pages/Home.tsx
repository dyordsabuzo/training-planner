import WrapperPage from "./WrapperPage";
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import AuthContext from "../context/AuthContext";
import SourceDataContext from "../context/SourceDataContext";
import { Loading } from "./helpers/Loading";
import { Link } from "react-router";
import { getDisplayName } from "../common/utils";
import { getCurrentWeekNumber } from "../common/planWeek";
import { PlanProgressCard } from "./others/PlanProgressCard";
import { RATINGS } from "../components/others/MoodCheckIn";
import { Card } from "../components/others/Card";
import { EmptyState } from "../management/EmptyState";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDumbbell,
  faListCheck,
  faCalendarWeek,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

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

export const Home = () => {
  const authContext = useContext(AuthContext);
  const sourceDataContext = useContext(SourceDataContext);
  const { user, userPermission, isLoading } = authContext;
  const { sourceData } = sourceDataContext;
  const { role, plans: grantedPlans = [] } = userPermission || {};
  const navigate = useNavigate();

  const [isDataInitialised, setIsDataInitialised] = useState(false);

  useEffect(() => {
    if (user && role !== "admin" && !isDataInitialised) {
      sourceDataContext.initialise();
      setIsDataInitialised(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role, isDataInitialised]);

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
    return (
      <WrapperPage>
        <div className="flex flex-col pt-6 w-full px-8 justify-left relative text-text-light dark:text-text-dark">
          <h1 className="text-2xl font-bold w-full">
            Welcome to Training Planner
          </h1>
          <p>
            You are logged in as an administrator. You can manage users and
            training programs.
          </p>
          <p>
            <Link to="/training-planner/manage" className={linkClassName}>
              Click here to manage training programs.
            </Link>
          </p>
          <p>
            <Link to="/training-planner/admin" className={linkClassName}>
              Click here to manage users.
            </Link>
          </p>
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
