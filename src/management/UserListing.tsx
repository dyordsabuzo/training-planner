import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import UserManagementContext, {
  AppUser,
  hasPendingAccessRequest,
} from "../context/UserManagementContext";
import AuthContext from "../context/AuthContext";
import AppSettingsContext from "../context/AppSettingsContext";
import SourceDataContext from "../context/SourceDataContext";
import { UserForm } from "../forms/UserForm";
import { AddUserForm } from "../forms/AddUserForm";
import { InviteForm } from "../forms/InviteForm";

import { ManageListHeader } from "./ManageListHeader";
import BaseListing from "./BaseListing";
import { Loading } from "../pages/helpers/Loading";
import { getDisplayName } from "../common/utils";
import { useLoadMore } from "../common/useLoadMore";
import { LoadMore } from "./LoadMore";
import { DataTable, DataTableColumn, Badge, Button, ButtonSelection, Toggle } from "@dyordsabuzo/ui-components";
import { trainerOptions } from "./ClientDetailPage";

const ROLE_LABELS: Record<string, string> = { owner: "Owner", trainer: "Trainer", client: "Client" };
const FILTERS = ["Clients", "Trainers", "All"];

const buildColumns = (
  planNameById: Record<string, string>,
  trainerNameById: Record<string, string>,
  currentUid: string | undefined,
  onViewAs: (u: AppUser) => void,
  onEdit: (u: AppUser) => void
): DataTableColumn<AppUser>[] => [
  {
    key: "user",
    header: "User",
    render: (u) => (
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold truncate">
            {getDisplayName(u.firstName, u.lastName, u.email)}
          </span>
          {hasPendingAccessRequest(u) && (
            <Badge variant="warning" className="shrink-0">
              Requested access
            </Badge>
          )}
        </div>
        <div
          className={`text-xs text-text-muted-light dark:text-text-muted-dark truncate ${
            u.email ? "" : "italic"
          }`}
        >
          {u.email || "No email on file"}
        </div>
      </div>
    ),
  },
  {
    key: "role",
    header: "Role",
    render: (u) => (
      <Badge variant={u.role === "admin" ? "primary" : "neutral"}>
        {u.orgRole ? ROLE_LABELS[u.orgRole] : "Not a member"}
      </Badge>
    ),
  },
  {
    key: "trainers",
    header: "Trainers",
    render: (u) =>
      u.orgRole === "client" && (u.trainerUids ?? []).length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {(u.trainerUids ?? []).map((uid) => (
            <Badge key={uid} variant="neutral">
              {trainerNameById[uid] ?? uid}
            </Badge>
          ))}
        </div>
      ) : null,
  },
  {
    key: "plans",
    header: "Granted plans",
    render: (u) =>
      u.plans.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {u.plans.map((planId) => (
            <Badge key={planId} variant="neutral">
              {planNameById[planId] ?? planId}
            </Badge>
          ))}
        </div>
      ) : (
        <span className="text-text-muted-light dark:text-text-muted-dark italic">None</span>
      ),
  },
  {
    key: "actions",
    header: "",
    render: (u) => (
      <div className="flex gap-3">
        <button
          type="button"
          onClick={(e) => {
            // Don't also open the client page via the row click.
            e.stopPropagation();
            onEdit(u);
          }}
          className="text-sm text-primary underline font-semibold whitespace-nowrap rounded
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Edit
        </button>
        {u.id !== currentUid && u.isMember && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewAs(u);
            }}
            className="text-sm text-primary underline font-semibold whitespace-nowrap rounded
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            View as
          </button>
        )}
      </div>
    ),
  },
];

// The active org's roster for its trainers: clients by default, with
// trainers and (for the platform admin) everyone who has signed up under
// "All". Opening a member goes to their client page; Edit changes role,
// plans and (owner) trainers. "Add missing user" is the platform admin's
// repair path for an account without a users/{uid} doc.
const PAGE_SIZE = 20;

export const UserListing = () => {
  const { users, fetchUsers, saveUser, createUser, saveTrainers, saveError } = useContext(UserManagementContext);
  const { functionsSuspended } = useContext(AppSettingsContext);
  const { user, startImpersonation, orgRole } = useContext(AuthContext);
  const navigate = useNavigate();
  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;
  const [isInitialised, setIsInitialised] = useState(false);
  const [search, setSearch] = useState("");
  // Keep only the id so the open form always shows the latest saved user,
  // not a stale snapshot from when the row was clicked.
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [filter, setFilter] = useState("Clients");
  const [onlyMine, setOnlyMine] = useState(false);
  const { limit, loadMore, showAll } = useLoadMore(PAGE_SIZE, search);

  useEffect(() => {
    if (!isInitialised) {
      fetchUsers();
      setIsInitialised(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialised]);

  const planNameById = useMemo(() => {
    const entries = Object.entries(sourceData.plans ?? {}) as [string, any][];
    return Object.fromEntries(entries.map(([name, plan]) => [plan.id, name]));
  }, [sourceData.plans]);

  const trainers = useMemo(() => trainerOptions(users), [users]);
  const trainerNameById = useMemo(
    () => Object.fromEntries(trainers.map((t) => [t.uid, t.name])),
    [trainers]
  );

  const columns = useMemo(
    () =>
      buildColumns(
        planNameById,
        trainerNameById,
        user?.uid,
        async (u) => {
          await startImpersonation(u.id);
          navigate("/training-planner");
        },
        (u) => setEditingUserId(u.id)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [planNameById, trainerNameById, user?.uid]
  );

  // Users waiting on a request float to the top, so an admin sees them first
  // without having to search or sort.
  const entries = useMemo(
    () =>
      (users ?? [])
        .filter((u) =>
          filter === "Clients"
            ? u.orgRole === "client" && (!onlyMine || (u.trainerUids ?? []).includes(user?.uid ?? ""))
            : filter === "Trainers"
              ? u.orgRole === "owner" || u.orgRole === "trainer"
              : true
        )
        .filter((u) =>
          `${u.email} ${u.displayName} ${u.firstName} ${u.lastName}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
        .sort(
          (a, b) => Number(hasPendingAccessRequest(b)) - Number(hasPendingAccessRequest(a))
        ),
    [users, search, filter, onlyMine, user?.uid]
  );

  if (users === null) {
    return <Loading />;
  }

  const editingUser = users.find((u) => u.id === editingUserId);
  const pendingCount = users.filter(hasPendingAccessRequest).length;

  return (
    <BaseListing>
      <ManageListHeader
        title="Clients"
        count={entries.length}
        addLabel="Add missing user"
        searchPlaceholder="Search people..."
        search={search}
        onSearchChange={setSearch}
        onAdd={() => setIsAdding(true)}
      />

      <div className="flex flex-wrap items-center gap-4">
        <ButtonSelection label="Show" options={FILTERS} selection={filter} onSelect={setFilter} />
        {filter === "Clients" && (
          <div className="flex items-center gap-2">
            <Toggle label="My clients" value={onlyMine} toggle={setOnlyMine} />
            <span className="text-sm font-medium text-text-light dark:text-text-dark">My clients</span>
          </div>
        )}
      </div>

      {(orgRole === "owner" || orgRole === "trainer") && !functionsSuspended && (
        <Button label="Invite someone" className="min-h-11 self-start" onClick={() => setIsInviting(true)} />
      )}

      {functionsSuspended && (
        <Badge variant="warning" className="w-fit">
          Changing roles and plans is temporarily unavailable.
        </Badge>
      )}
      {saveError && !functionsSuspended && (
        <Badge variant="danger" className="w-fit">
          {saveError}
        </Badge>
      )}

      {pendingCount > 0 && (
        <Badge variant="warning" className="w-fit">
          {pendingCount} {pendingCount === 1 ? "user" : "users"} waiting for plan access
        </Badge>
      )}

      <DataTable
        columns={columns}
        rows={entries.slice(0, limit)}
        getRowKey={(u) => u.id}
        onRowClick={(u) =>
          u.isMember ? navigate(`/training-planner/admin/clients/${u.id}`) : setEditingUserId(u.id)
        }
        emptyMessage={search ? "No one matches your search." : `No ${filter.toLowerCase()} yet.`}
      />

      <LoadMore shown={limit} total={entries.length} onLoadMore={loadMore} onShowAll={showAll} />

      {editingUser && (
        <UserForm
          data={editingUser}
          closeForm={() => setEditingUserId(null)}
          onSave={saveUser}
          trainers={trainers}
          onSaveTrainers={saveTrainers}
        />
      )}

      {isInviting && <InviteForm closeForm={() => setIsInviting(false)} />}

      {isAdding && (
        <AddUserForm
          existingIds={users.map((u) => u.id)}
          closeForm={() => setIsAdding(false)}
          onSave={(data) => {
            createUser(data);
            setIsAdding(false);
          }}
        />
      )}
    </BaseListing>
  );
};
