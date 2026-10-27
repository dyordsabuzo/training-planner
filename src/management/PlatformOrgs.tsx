import { useContext, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, ButtonSelection } from "@dyordsabuzo/ui-components";
import { callFunction } from "../common/firebase";
import AppSettingsContext from "../context/AppSettingsContext";
import { ConfirmDeleteButton } from "../forms/ConfirmDeleteButton";
import BaseListing from "./BaseListing";
import { EmptyState } from "./EmptyState";
import { ManageListHeader } from "./ManageListHeader";
import { Loading } from "../pages/helpers/Loading";

// One entry from listOrgs (functions/src/admin.ts).
export type PlatformOrg = {
  id: string;
  name: string;
  code: string | null;
  status: "active" | "suspended";
  createdAt: string | null;
  ownerEmail: string | null;
  members: { owner: number; trainer: number; client: number };
  items: { exercises: number; supersets: number; sessions: number; plans: number };
  publicItems: number;
  links: number;
};

export const PLATFORM_ORGS_KEY = ["platform", "orgs"];

export const usePlatformOrgs = () => {
  const { functionsSuspended } = useContext(AppSettingsContext);
  return useQuery({
    queryKey: PLATFORM_ORGS_KEY,
    queryFn: () => callFunction<{ orgs: PlatformOrg[] }>("listOrgs", {}),
    enabled: !functionsSuspended,
    staleTime: 60_000,
  });
};

const STATUSES = ["All", "Active", "Suspended"];

const messageOf = (error: unknown, fallback: string) =>
  (error as { message?: string })?.message || fallback;

// Platform → Organisations: every org with its size, and suspension.
// Suspending drops the org from every member's claim (suspendOrg).
export const PlatformOrgs = () => {
  const { functionsSuspended } = useContext(AppSettingsContext);
  const queryClient = useQueryClient();
  const { data, isPending, error } = usePlatformOrgs();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [working, setWorking] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const orgs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.orgs ?? [])
      .filter((org) => status === "All" || org.status === status.toLowerCase())
      .filter(
        (org) =>
          !term ||
          org.name.toLowerCase().includes(term) ||
          org.code?.toLowerCase().includes(term) ||
          org.ownerEmail?.toLowerCase().includes(term)
      );
  }, [data, search, status]);

  const setSuspended = async (org: PlatformOrg, suspended: boolean) => {
    setWorking(org.id);
    try {
      await callFunction("suspendOrg", { orgId: org.id, suspended });
      setResults((prev) => ({ ...prev, [org.id]: suspended ? "Suspended." : "Reactivated." }));
      await queryClient.invalidateQueries({ queryKey: PLATFORM_ORGS_KEY });
    } catch (e) {
      setResults((prev) => ({ ...prev, [org.id]: messageOf(e, "Couldn't update it. Try again.") }));
    } finally {
      setWorking(null);
    }
  };

  return (
    <BaseListing>
      <ManageListHeader
        title="Organisations"
        count={orgs.length}
        searchPlaceholder="Search name, code, owner..."
        search={search}
        onSearchChange={setSearch}
      />

      <ButtonSelection options={STATUSES} selection={status} onSelect={setStatus} />

      {functionsSuspended ? (
        <EmptyState message="Organisations are temporarily unavailable." />
      ) : isPending ? (
        <Loading />
      ) : error ? (
        <EmptyState message="Couldn't load organisations. Try again later." />
      ) : orgs.length === 0 ? (
        <EmptyState message={data?.orgs.length ? "No organisations match your search." : "No organisations yet."} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-text-light dark:text-text-dark">
            <thead className="text-xs text-text-muted-light dark:text-text-muted-dark">
              <tr>
                <th className="p-2">Organisation</th>
                <th className="p-2">Owner</th>
                <th className="p-2">Members</th>
                <th className="p-2">Items</th>
                <th className="p-2">Shared</th>
                <th className="p-2">Status</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => {
                const items = Object.values(org.items).reduce((sum, n) => sum + n, 0);
                const suspended = org.status === "suspended";
                return (
                  <tr key={org.id} className="border-t border-gray-200 dark:border-gray-700 align-top">
                    <td className="p-2">
                      <div className="font-bold">{org.name}</div>
                      <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
                        {org.code ?? "—"}
                        {org.createdAt && ` · ${new Date(org.createdAt).toLocaleDateString()}`}
                      </div>
                    </td>
                    <td className="p-2 break-all">{org.ownerEmail ?? "—"}</td>
                    <td className="p-2 whitespace-nowrap">
                      {org.members.owner + org.members.trainer} trainers · {org.members.client} clients
                    </td>
                    <td
                      className="p-2 whitespace-nowrap"
                      title={`${org.items.exercises} exercises, ${org.items.supersets} supersets, ${org.items.sessions} sessions, ${org.items.plans} plans`}
                    >
                      {items}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {org.publicItems} public · {org.links} links
                    </td>
                    <td className="p-2">
                      <Badge variant={suspended ? "danger" : "success"}>{suspended ? "Suspended" : "Active"}</Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col items-start gap-1">
                        {working === org.id ? (
                          <span className="text-xs">Working…</span>
                        ) : (
                          <ConfirmDeleteButton
                            label={suspended ? "Reactivate" : "Suspend"}
                            decoration={suspended ? "cancel" : "delete"}
                            impactMessage={
                              suspended
                                ? `Members of ${org.name} get it back the next time they open the app.`
                                : `Members of ${org.name} lose access until it's reactivated, and its items leave the library.`
                            }
                            onDelete={() => setSuspended(org, !suspended)}
                          />
                        )}
                        {results[org.id] && <span className="text-xs">{results[org.id]}</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </BaseListing>
  );
};
