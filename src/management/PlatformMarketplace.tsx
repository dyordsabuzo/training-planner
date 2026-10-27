import { useContext, useMemo, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, ButtonSelection, Input } from "@dyordsabuzo/ui-components";
import { callFunction } from "../common/firebase";
import AppSettingsContext from "../context/AppSettingsContext";
import BaseListing from "./BaseListing";
import { EmptyState } from "./EmptyState";
import { ManageListHeader } from "./ManageListHeader";
import { Loading } from "../pages/helpers/Loading";

type Collection = "exercises" | "supersets" | "sessions" | "plans";
type Cursor = { collection: Collection; after: string } | null;

// One entry from listMarketplace (functions/src/library.ts).
type MarketplaceItem = {
  collection: Collection;
  id: string;
  orgId: string;
  orgName: string;
  orgSuspended: boolean;
  name: string;
  tags: string[];
  visibility: string;
  archived: boolean;
  linkCount: number;
  moderation: { blocked: boolean; reason: string | null; at: string | null } | null;
};
type Page = { items: MarketplaceItem[]; next: Cursor };

const MARKETPLACE_KEY = ["platform", "marketplace"];
const FILTERS = ["All", "Public", "Blocked"];
const TYPE_LABELS: Record<Collection, string> = {
  exercises: "Exercise",
  supersets: "Superset",
  sessions: "Session",
  plans: "Plan",
};

const messageOf = (error: unknown, fallback: string) =>
  (error as { message?: string })?.message || fallback;

// Platform → Marketplace: every public item and every blocked one. Blocking
// makes an item private and stops its org publishing it again (moderateItem).
export const PlatformMarketplace = () => {
  const { functionsSuspended } = useContext(AppSettingsContext);
  const queryClient = useQueryClient();
  const { data, isPending, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: MARKETPLACE_KEY,
    queryFn: ({ pageParam }) => callFunction<Page>("listMarketplace", { cursor: pageParam }),
    initialPageParam: null as Cursor,
    getNextPageParam: (last) => last.next,
    enabled: !functionsSuspended,
    staleTime: 60_000,
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [blocking, setBlocking] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const keyOf = (item: MarketplaceItem) => `${item.orgId}/${item.collection}/${item.id}`;

  const items = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter((item) =>
        filter === "Blocked" ? item.moderation?.blocked : filter === "Public" ? item.visibility === "public" : true
      )
      .filter(
        (item) =>
          !term ||
          item.name.toLowerCase().includes(term) ||
          item.orgName.toLowerCase().includes(term) ||
          item.tags.some((tag) => tag.toLowerCase().includes(term))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data, search, filter]);

  const moderate = async (item: MarketplaceItem, blocked: boolean) => {
    const key = keyOf(item);
    setWorking(key);
    try {
      await callFunction("moderateItem", {
        orgId: item.orgId,
        collection: item.collection,
        id: item.id,
        blocked,
        ...(blocked && reason.trim() && { reason: reason.trim() }),
      });
      setResults((prev) => ({ ...prev, [key]: blocked ? "Blocked." : "Unblocked. Its org can publish it again." }));
      setBlocking(null);
      await queryClient.invalidateQueries({ queryKey: MARKETPLACE_KEY });
    } catch (e) {
      setResults((prev) => ({ ...prev, [key]: messageOf(e, "Couldn't update it. Try again.") }));
    } finally {
      setWorking(null);
    }
  };

  return (
    <BaseListing>
      <ManageListHeader
        title="Marketplace"
        count={items.length}
        searchPlaceholder="Search name, tag, organisation..."
        search={search}
        onSearchChange={setSearch}
      />

      <ButtonSelection options={FILTERS} selection={filter} onSelect={setFilter} />

      {functionsSuspended ? (
        <EmptyState message="The marketplace is temporarily unavailable." />
      ) : isPending ? (
        <Loading />
      ) : error ? (
        <EmptyState message="Couldn't load the marketplace. Try again later." />
      ) : items.length === 0 ? (
        <EmptyState message={data?.pages[0]?.items.length ? "No items match your search." : "Nothing in the marketplace yet."} />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const key = keyOf(item);
            const blocked = !!item.moderation?.blocked;
            return (
              <div
                key={key}
                className="flex flex-col gap-2 p-3 rounded-md border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-surface-dark text-text-light dark:text-text-dark"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold break-words">{item.name}</div>
                    <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
                      By {item.orgName}
                      {item.linkCount > 0 && ` · linked by ${item.linkCount} org${item.linkCount === 1 ? "" : "s"}`}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Badge variant="neutral">{TYPE_LABELS[item.collection]}</Badge>
                    {item.orgSuspended && <Badge variant="warning">Org suspended</Badge>}
                    {item.archived && <Badge variant="neutral">Archived</Badge>}
                    {blocked ? <Badge variant="danger">Blocked</Badge> : <Badge variant="success">Public</Badge>}
                  </div>
                </div>

                {blocked && item.moderation?.reason && <p className="text-sm">Reason: {item.moderation.reason}</p>}

                {blocking === key && working !== key ? (
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="flex-1 min-w-48">
                      <Input
                        label="Reason (shown to the org)"
                        value={reason}
                        placeholder="e.g. copyrighted content"
                        changeValue={setReason}
                      />
                    </div>
                    <Button label="Block" decoration="delete" className="min-h-11 text-xs" onClick={() => moderate(item, true)} />
                    <Button label="Cancel" decoration="cancel" className="min-h-11 text-xs" onClick={() => setBlocking(null)} />
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {working === key ? (
                      <span className="text-xs">Working…</span>
                    ) : blocked ? (
                      <Button
                        label="Unblock"
                        decoration="cancel"
                        className="min-h-11 text-xs"
                        disabled={working !== null}
                        onClick={() => moderate(item, false)}
                      />
                    ) : (
                      <Button
                        label="Block…"
                        decoration="delete"
                        className="min-h-11 text-xs"
                        disabled={working !== null}
                        onClick={() => {
                          setBlocking(key);
                          setReason("");
                        }}
                      />
                    )}
                    {results[key] && <span className="text-xs">{results[key]}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasNextPage && (
        <Button
          label={isFetchingNextPage ? "Loading…" : "Load more"}
          decoration="cancel"
          className="min-h-11 self-center"
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        />
      )}
    </BaseListing>
  );
};
