import React, { useContext, useEffect, useMemo, useState } from "react";
import UserManagementContext, { AppUser } from "../context/UserManagementContext";
import SourceDataContext from "../context/SourceDataContext";
import { UserForm } from "../forms/UserForm";
import { DataTable, DataTableColumn } from "../components/form/DataTable";
import { Badge } from "../components/others/Badge";
import { ManageListHeader } from "./ManageListHeader";
import BaseListing from "./BaseListing";
import { Loading } from "../pages/helpers/Loading";
import { getDisplayName } from "../common/utils";

const buildColumns = (planNameById: Record<string, string>): DataTableColumn<AppUser>[] => [
  {
    key: "user",
    header: "User",
    render: (u) => (
      <div className="min-w-0">
        <div className="font-bold truncate">
          {getDisplayName(u.firstName, u.lastName, u.email)}
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
        {u.role === "admin" ? "Admin" : "User"}
      </Badge>
    ),
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
];

// Admin-only listing of everyone who has signed up (a users/{uid} Firestore
// doc, auto-created on first login — see AuthContext.tsx). There's no "add"
// action: a user must sign up themselves first, since creating a Firebase
// Auth account from here would require the Admin SDK this app doesn't have.
export const UserListing = () => {
  const { users, fetchUsers, saveUser } = useContext(UserManagementContext);
  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;
  const [isInitialised, setIsInitialised] = useState(false);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (!isInitialised) {
      fetchUsers();
      // AdminPage is a separate route from /manage, so sourceData.plans
      // (needed here to resolve a granted plan id to its display name) may
      // not have been loaded yet — ensure it has been.
      sourceDataContext.initialise();
      setIsInitialised(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialised]);

  const planNameById = useMemo(() => {
    const entries = Object.entries(sourceData.plans ?? {}) as [string, any][];
    return Object.fromEntries(entries.map(([name, plan]) => [plan.id, name]));
  }, [sourceData.plans]);

  const columns = useMemo(() => buildColumns(planNameById), [planNameById]);

  const entries = useMemo(
    () =>
      (users ?? []).filter((u) =>
        `${u.email} ${u.displayName} ${u.firstName} ${u.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [users, search]
  );

  if (users === null) {
    return <Loading />;
  }

  return (
    <BaseListing>
      <ManageListHeader
        title="Users"
        count={users.length}
        searchPlaceholder="Search users..."
        search={search}
        onSearchChange={setSearch}
      />

      <DataTable
        columns={columns}
        rows={entries}
        getRowKey={(u) => u.id}
        onRowClick={setEditingUser}
        emptyMessage={search ? "No users match your search." : "No registered users yet."}
      />

      {editingUser && (
        <UserForm
          data={editingUser}
          closeForm={() => setEditingUser(null)}
          onSave={saveUser}
        />
      )}
    </BaseListing>
  );
};
