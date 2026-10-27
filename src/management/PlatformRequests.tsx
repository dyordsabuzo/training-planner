import { useContext, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDocs, query, updateDoc, where } from "firebase/firestore";
import { Button, SingleSelect } from "@dyordsabuzo/ui-components";
import { callFunction, getCollection, getDocumentReference } from "../common/firebase";
import { getDisplayName } from "../common/utils";
import AppSettingsContext from "../context/AppSettingsContext";
import BaseListing from "./BaseListing";
import { EmptyState } from "./EmptyState";
import { ManageListHeader } from "./ManageListHeader";
import { PLATFORM_ORGS_KEY, usePlatformOrgs } from "./PlatformOrgs";
import { Loading } from "../pages/helpers/Loading";

// A users/{uid} doc with accessRequested set (Home's "Request access").
type AccessRequest = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  accessRequestedAt?: string;
  accessRequestNote?: string;
};

const REQUESTS_KEY = ["platform", "requests"];
const ROLES = { Client: "client", Trainer: "trainer" } as const;
type RoleLabel = keyof typeof ROLES;

const messageOf = (error: unknown, fallback: string) =>
  (error as { message?: string })?.message || fallback;

// Same field UserForm's Dismiss clears.
const clearRequest = (uid: string) => updateDoc(getDocumentReference("users", uid), { accessRequested: false });

// Platform → Requests: accounts that asked for access, newest first. Only
// super admins can list users. Sorted here, so no composite index is needed.
export const PlatformRequests = () => {
  const { functionsSuspended } = useContext(AppSettingsContext);
  const queryClient = useQueryClient();
  const { data, isPending, error } = useQuery({
    queryKey: REQUESTS_KEY,
    queryFn: async () => {
      const snap = await getDocs(query(getCollection("users"), where("accessRequested", "==", true)));
      return snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as AccessRequest)
        .sort((a, b) => (b.accessRequestedAt ?? "").localeCompare(a.accessRequestedAt ?? ""));
    },
  });
  const { data: orgData } = usePlatformOrgs();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [orgLabel, setOrgLabel] = useState("");
  const [roleLabel, setRoleLabel] = useState<RoleLabel>("Client");
  const [working, setWorking] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  // Suspended orgs refuse new members (addMember).
  const orgsByLabel = useMemo(
    () =>
      new Map(
        (orgData?.orgs ?? [])
          .filter((org) => org.status === "active")
          .map((org) => [`${org.name}${org.code ? ` (${org.code})` : ""}`, org.id])
      ),
    [orgData]
  );

  const requests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter(
      (r) =>
        !term ||
        `${r.email ?? ""} ${r.firstName ?? ""} ${r.lastName ?? ""} ${r.accessRequestNote ?? ""}`
          .toLowerCase()
          .includes(term)
    );
  }, [data, search]);

  const run = async (uid: string, action: () => Promise<string>) => {
    setWorking(uid);
    try {
      const message = await action();
      setResults((prev) => ({ ...prev, [uid]: message }));
      setAdding(null);
      await queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });
    } catch (e) {
      setResults((prev) => ({ ...prev, [uid]: messageOf(e, "Couldn't update it. Try again.") }));
    } finally {
      setWorking(null);
    }
  };

  const dismiss = (uid: string) =>
    run(uid, async () => {
      await clearRequest(uid);
      return "Dismissed.";
    });

  const addToOrg = (uid: string) =>
    run(uid, async () => {
      const orgId = orgsByLabel.get(orgLabel)!;
      const { added } = await callFunction<{ added: boolean }>("addMember", { orgId, uid, role: ROLES[roleLabel] });
      await clearRequest(uid);
      await queryClient.invalidateQueries({ queryKey: PLATFORM_ORGS_KEY });
      return added ? `Added to ${orgLabel}.` : `Already in ${orgLabel}.`;
    });

  const openAdd = (uid: string) => {
    setAdding(uid);
    setOrgLabel("");
    setRoleLabel("Client");
  };

  return (
    <BaseListing>
      <ManageListHeader
        title="Access requests"
        count={requests.length}
        searchPlaceholder="Search name, email, note..."
        search={search}
        onSearchChange={setSearch}
      />

      {isPending ? (
        <Loading />
      ) : error ? (
        <EmptyState message="Couldn't load access requests. Try again later." />
      ) : requests.length === 0 ? (
        <EmptyState message={data?.length ? "No requests match your search." : "No one is waiting for access."} />
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-2 p-3 rounded-md border border-gray-200 dark:border-gray-700
                bg-white dark:bg-surface-dark text-text-light dark:text-text-dark"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold break-words">{getDisplayName(r.firstName, r.lastName, r.email)}</div>
                  <div className="text-xs text-text-muted-light dark:text-text-muted-dark break-all">
                    {r.email || "No email on file"}
                    {r.accessRequestedAt && ` · asked on ${new Date(r.accessRequestedAt).toLocaleDateString()}`}
                  </div>
                </div>
                {working === r.id ? (
                  <span className="text-xs">Working…</span>
                ) : (
                  adding !== r.id && (
                    <div className="flex gap-2">
                      <Button
                        label="Add to org…"
                        className="min-h-11 text-xs"
                        disabled={functionsSuspended || working !== null}
                        onClick={() => openAdd(r.id)}
                      />
                      <Button
                        label="Dismiss"
                        decoration="cancel"
                        className="min-h-11 text-xs"
                        disabled={working !== null}
                        onClick={() => dismiss(r.id)}
                      />
                    </div>
                  )
                )}
              </div>

              {r.accessRequestNote && <p className="text-sm">"{r.accessRequestNote}"</p>}

              {adding === r.id && working !== r.id && (
                <div className="flex flex-wrap items-end gap-2">
                  <SingleSelect
                    options={Array.from(orgsByLabel.keys())}
                    selected={orgLabel}
                    onChange={setOrgLabel}
                    placeholder="Organisation"
                    className="w-64"
                  />
                  <SingleSelect
                    options={Object.keys(ROLES)}
                    selected={roleLabel}
                    onChange={(label) => setRoleLabel(label as RoleLabel)}
                    className="w-32"
                  />
                  <Button
                    label="Add"
                    className="min-h-11 text-xs"
                    disabled={!orgsByLabel.has(orgLabel)}
                    onClick={() => addToOrg(r.id)}
                  />
                  <Button label="Cancel" decoration="cancel" className="min-h-11 text-xs" onClick={() => setAdding(null)} />
                </div>
              )}

              {results[r.id] && <span className="text-xs">{results[r.id]}</span>}
            </div>
          ))}
        </div>
      )}
    </BaseListing>
  );
};
