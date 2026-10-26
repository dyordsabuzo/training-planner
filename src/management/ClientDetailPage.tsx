import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import dayjs from "dayjs";
import { Badge, Button } from "@dyordsabuzo/ui-components";
import AuthContext from "../context/AuthContext";
import SourceDataContext, { useClientUserdata } from "../context/SourceDataContext";
import UserManagementContext, { AppUser } from "../context/UserManagementContext";
import { UserForm } from "../forms/UserForm";
import WrapperPage from "../pages/WrapperPage";
import { Loading } from "../pages/helpers/Loading";
import { HistoryRunList } from "../pages/HistoryRunList";
import { SessionStats } from "../pages/others/SessionStats";
import { sessionOrder } from "../pages/resolveSessionSupersets";
import { EmptyState } from "./EmptyState";
import { getDisplayName, toStringArray } from "../common/utils";
import { completedRuns, HistoryRun, historyRuns } from "../common/sessionStats";
import { openPlanDoneSessions, sessionDueStatus } from "../common/planSessions";

const RECENT_RUNS = 20;

export const trainerOptions = (users: AppUser[] | null) =>
  (users ?? [])
    .filter((u) => u.orgRole === "owner" || u.orgRole === "trainer")
    .map((u) => ({ uid: u.id, name: getDisplayName(u.firstName, u.lastName, u.email) }));

// One plan's progress line: open plans count done/overdue dated sessions,
// cycle plans count completed runs.
const planProgress = (plan: any, planName: string, userdata: any, sessions: any) => {
  if (plan.open) {
    const names = toStringArray(plan.sessions);
    const done = openPlanDoneSessions(userdata, planName);
    const overdue = names.filter(
      (name) => sessionDueStatus(sessions?.[name]?.date, done.includes(name)) === "overdue"
    ).length;
    return { summary: `${done.length} of ${names.length} done`, overdue };
  }
  const runs = completedRuns(userdata, planName);
  return { summary: `${runs.length} ${runs.length === 1 ? "session" : "sessions"} completed`, overdue: 0 };
};

// A trainer's view of one client in the active org: assigned plans and how
// they're going, recent sessions, and shortcuts to edit or "View as".
export const ClientDetailPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { user, startImpersonation } = useContext(AuthContext);
  const sourceData: any = useContext(SourceDataContext).sourceData;
  const { users, fetchUsers, saveUser, saveTrainers, saveError } = useContext(UserManagementContext);
  const { userdata, isLoading } = useClientUserdata(uid);
  const [viewing, setViewing] = useState<HistoryRun | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (users === null) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const client = users?.find((u) => u.id === uid);
  const runs = useMemo(() => historyRuns(userdata).slice(0, RECENT_RUNS), [userdata]);
  const plans = Object.entries(sourceData.plans ?? {}).filter(([, plan]: [string, any]) =>
    client?.plans.includes(plan.id)
  ) as [string, any][];
  const trainers = trainerOptions(users);
  const trainerNames = (client?.trainerUids ?? []).map(
    (trainerUid) => trainers.find((t) => t.uid === trainerUid)?.name ?? trainerUid
  );

  if (users === null || isLoading) return <Loading />;
  if (!client) {
    return (
      <WrapperPage className="max-w-[25rem] sm:max-w-2xl">
        <div className="pt-8">
          <EmptyState message="This person isn't a member of your organisation." />
        </div>
      </WrapperPage>
    );
  }

  return (
    <WrapperPage className="max-w-[25rem] sm:max-w-2xl">
      <div className="flex flex-col gap-6 pt-8">
        <button
          type="button"
          onClick={() => navigate("/training-planner/admin")}
          className="self-start text-sm text-primary underline font-semibold rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          ← Clients
        </button>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-text-light dark:text-text-dark break-words">
            {getDisplayName(client.firstName, client.lastName, client.email)}
          </h1>
          <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
            {client.email || "No email on file"}
          </span>
          <div className="flex flex-wrap gap-1">
            <Badge variant={client.orgRole === "client" ? "neutral" : "primary"}>
              {client.orgRole === "owner" ? "Owner" : client.orgRole === "trainer" ? "Trainer" : "Client"}
            </Badge>
            {trainerNames.map((name) => (
              <Badge key={name} variant="neutral">
                Trainer: {name}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button label="Edit" className="min-h-11" onClick={() => setIsEditing(true)} />
            {client.id !== user?.uid && (
              <Button
                label="View as"
                decoration="cancel"
                className="min-h-11"
                onClick={async () => {
                  await startImpersonation(client.id);
                  navigate("/training-planner");
                }}
              />
            )}
          </div>
          {saveError && (
            <Badge variant="danger" className="w-fit">
              {saveError}
            </Badge>
          )}
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-text-light dark:text-text-dark">Assigned plans</h2>
          {plans.length === 0 && <EmptyState message="No plans assigned yet." />}
          {plans.map(([planName, plan]) => {
            const { summary, overdue } = planProgress(plan, planName, userdata, sourceData.sessions);
            return (
              <div
                key={plan.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-primary-200 dark:border-primary-700 bg-white dark:bg-surface-dark px-3 py-2.5"
              >
                <span className="font-semibold break-words min-w-0">{planName}</span>
                <span className="flex items-center gap-2 shrink-0 text-xs text-text-muted-light dark:text-text-muted-dark">
                  {summary}
                  {overdue > 0 && <Badge variant="danger">{overdue} overdue</Badge>}
                </span>
              </div>
            );
          })}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-text-light dark:text-text-dark">Recent sessions</h2>
          {runs.length === 0 ? (
            <EmptyState message="No completed sessions in this organisation yet." />
          ) : (
            <>
              {runs[0].completedAt && (
                <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                  Last trained {dayjs(runs[0].completedAt).format("ddd, MMM D")}
                </span>
              )}
              <HistoryRunList runs={runs} sourceData={sourceData} onView={setViewing} />
            </>
          )}
        </section>
      </div>

      {viewing && (
        <SessionStats
          title={viewing.session}
          planName={viewing.plan}
          week={viewing.week}
          session={viewing.session}
          logged={viewing.logged}
          userdata={userdata}
          order={sessionOrder(sourceData?.sessions?.[viewing.session], sourceData)}
          onClose={() => setViewing(null)}
        />
      )}

      {isEditing && (
        <UserForm
          data={client}
          closeForm={() => setIsEditing(false)}
          onSave={saveUser}
          trainers={trainers}
          onSaveTrainers={saveTrainers}
        />
      )}
    </WrapperPage>
  );
};
