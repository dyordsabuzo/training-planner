import { useContext, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, ButtonSelection, SingleSelect } from "@dyordsabuzo/ui-components";
import { callFunction } from "../common/firebase";
import AppSettingsContext from "../context/AppSettingsContext";
import AuthContext from "../context/AuthContext";
import SourceDataContext from "../context/SourceDataContext";
import BaseListing from "./BaseListing";
import { EmptyState } from "./EmptyState";
import { ManageListHeader } from "./ManageListHeader";
import { Loading } from "../pages/helpers/Loading";

// One entry from listLibrary (functions/src/library.ts).
type LibraryItem = {
  collection: "exercises" | "supersets" | "sessions" | "plans";
  id: string;
  orgId: string;
  orgName: string;
  name: string;
  tags: string[];
  uses: number;
};
type CopyResult = { id: string; created: number; skipped: number };

// Exercises, supersets and sessions can be linked; plans only copied (they're
// assigned to clients by id).
const LINKABLE: LibraryItem["collection"][] = ["exercises", "supersets", "sessions"];

const VIEWS = { "Shared with me": "shared", Marketplace: "public" } as const;
type ViewLabel = keyof typeof VIEWS;

const TYPE_LABELS: Record<LibraryItem["collection"], string> = {
  exercises: "Exercise",
  supersets: "Superset",
  sessions: "Session",
  plans: "Plan",
};
const ALL_TYPES = "All types";

const messageOf = (error: unknown, fallback: string) =>
  (error as { message?: string })?.message || fallback;

const copyMessage = ({ created, skipped }: CopyResult) =>
  created === 0
    ? "Already in your library."
    : `Copied ${created} item${created === 1 ? "" : "s"}${skipped ? ` (${skipped} already in your library)` : ""}.`;

// Manage → Library: items other orgs share with this org, and the public
// marketplace. "Copy to my org" runs copyToOrg, which copies the item and
// everything it uses; "Link" (linkToOrg) uses it read-only, following the
// owner's edits.
export const LibraryBrowser = () => {
  const { activeOrgId } = useContext(AuthContext);
  const { functionsSuspended } = useContext(AppSettingsContext);
  const { sourceData, reloadContent, linkItem } = useContext(SourceDataContext);
  const [viewLabel, setViewLabel] = useState<ViewLabel>("Shared with me");
  const [search, setSearch] = useState("");
  const [type, setType] = useState(ALL_TYPES);
  const [copying, setCopying] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const view = VIEWS[viewLabel];

  const { data, isPending, error } = useQuery({
    queryKey: ["library", view, activeOrgId],
    queryFn: () => callFunction<{ items: LibraryItem[] }>("listLibrary", { orgId: activeOrgId, view }),
    enabled: !!activeOrgId && !functionsSuspended,
    staleTime: 60_000,
  });

  const items = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.items ?? [])
      .filter((item) => type === ALL_TYPES || TYPE_LABELS[item.collection] === type)
      .filter(
        (item) =>
          !term ||
          item.name.toLowerCase().includes(term) ||
          item.orgName.toLowerCase().includes(term) ||
          item.tags.some((tag) => tag.toLowerCase().includes(term))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data, search, type]);

  const keyOf = (item: LibraryItem) => `${item.orgId}/${item.collection}/${item.id}`;

  // Already linked or copied here, by source (an item and its copies).
  const inLibrary = useMemo(() => {
    const found = new Map<string, "Linked" | "Copied">();
    Object.entries(sourceData)
      .filter(([db]) => db !== "userdata")
      .forEach(([db, byName]) =>
        Object.values(byName ?? {}).forEach((e: any) => {
          if (e?.linked) found.set(`${e.linked.orgId}/${db}/${e.linked.srcId}`, "Linked");
          else if (e?.source?.orgId) found.set(`${e.source.orgId}/${db}/${e.source.id}`, "Copied");
        })
      );
    return found;
  }, [sourceData]);

  const link = async (item: LibraryItem) => {
    const key = keyOf(item);
    setCopying(key);
    try {
      const { linked } = await linkItem(item.orgId, item.collection, item.id);
      setResults((prev) => ({
        ...prev,
        [key]: linked ? `Linked${linked > 1 ? ` with ${linked - 1} item${linked === 2 ? "" : "s"} it uses` : ""}.` : "Already in your library.",
      }));
    } catch (e) {
      setResults((prev) => ({ ...prev, [key]: messageOf(e, "Couldn't link it. Try again.") }));
    } finally {
      setCopying(null);
    }
  };

  const copy = async (item: LibraryItem) => {
    const key = keyOf(item);
    setCopying(key);
    try {
      const result = await callFunction<CopyResult>("copyToOrg", {
        srcOrgId: item.orgId,
        collection: item.collection,
        id: item.id,
        targetOrgId: activeOrgId,
      });
      if (result.created > 0) await reloadContent();
      setResults((prev) => ({ ...prev, [key]: copyMessage(result) }));
    } catch (e) {
      setResults((prev) => ({ ...prev, [key]: messageOf(e, "Couldn't copy it. Try again.") }));
    } finally {
      setCopying(null);
    }
  };

  const emptyMessage =
    view === "shared"
      ? "Nothing has been shared with your organisation yet. Other trainers can share with you using your org code."
      : "Nothing in the marketplace yet.";

  return (
    <BaseListing>
      <ManageListHeader
        title="Library"
        count={items.length}
        searchPlaceholder="Search name, tag, organisation..."
        search={search}
        onSearchChange={setSearch}
      />

      <div className="flex flex-wrap items-center gap-2">
        <ButtonSelection
          options={Object.keys(VIEWS)}
          selection={viewLabel}
          onSelect={(label) => setViewLabel(label as ViewLabel)}
        />
        <SingleSelect
          options={[ALL_TYPES, ...Object.values(TYPE_LABELS)]}
          selected={type}
          onChange={setType}
          className="w-40"
        />
      </div>

      {functionsSuspended ? (
        <EmptyState message="The library is temporarily unavailable." />
      ) : isPending ? (
        <Loading />
      ) : error ? (
        <EmptyState message="Couldn't load the library. Try again later." />
      ) : items.length === 0 ? (
        <EmptyState message={data?.items.length ? "No items match your search." : emptyMessage} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => {
            const key = keyOf(item);
            return (
              <div
                key={key}
                className="flex flex-col gap-2 p-3 rounded-md border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-surface-dark text-text-light dark:text-text-dark"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold break-words">{item.name}</span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {inLibrary.has(key) && <Badge variant="success">{inLibrary.get(key)}</Badge>}
                    <Badge variant="neutral">{TYPE_LABELS[item.collection]}</Badge>
                  </div>
                </div>
                <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                  By {item.orgName}
                  {item.uses > 0 && ` · uses ${item.uses} item${item.uses === 1 ? "" : "s"}`}
                </span>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="primary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <Button
                    label={copying === key ? "Working…" : "Copy to my org"}
                    className="min-h-11 text-xs"
                    disabled={copying !== null}
                    onClick={() => copy(item)}
                  />
                  {LINKABLE.includes(item.collection) && (
                    <Button
                      label="Link"
                      decoration="cancel"
                      className="min-h-11 text-xs"
                      disabled={copying !== null || inLibrary.get(key) === "Linked"}
                      onClick={() => link(item)}
                    />
                  )}
                  {results[key] && <span className="text-xs">{results[key]}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BaseListing>
  );
};
