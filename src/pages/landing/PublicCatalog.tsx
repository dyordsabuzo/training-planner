import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faDumbbell } from "@fortawesome/free-solid-svg-icons";
import { callFunction } from "../../common/firebase";
import { ScrollRow } from "../../management/ScrollRow";

export type CatalogKind = "plans" | "sessions";

export type CatalogItem = {
  collection: CatalogKind;
  id: string;
  orgId: string;
  name: string;
  tags: string[];
  orgName: string;
  summary: { weeks?: number; sessions?: number; exercises?: number };
};

const KINDS: { id: CatalogKind; label: string }[] = [
  { id: "plans", label: "Plans" },
  { id: "sessions", label: "Sessions" },
];

const FOCUS_WHITE = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

export const summaryText = ({ collection, summary }: CatalogItem) =>
  collection === "plans"
    ? [summary.weeks ? plural(summary.weeks, "week") : null, plural(summary.sessions ?? 0, "session")]
        .filter(Boolean)
        .join(" · ")
    : plural(summary.exercises ?? 0, "exercise");

export const usePublicCatalog = () =>
  useQuery({
    queryKey: ["publicCatalog"],
    queryFn: async () => (await callFunction<{ items: CatalogItem[] }>("listPublicCatalog", {})).items,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

const CatalogCard = ({ item, onOpen }: { item: CatalogItem; onOpen: () => void }) => (
  <button
    type="button"
    onClick={onOpen}
    className={`flex flex-col gap-2 w-64 shrink-0 min-h-36 p-4 rounded-2xl text-left text-white
      bg-white/10 backdrop-blur border border-white/20 hover:bg-white/15 transition-colors ${FOCUS_WHITE}`}
  >
    <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary-100">
      <FontAwesomeIcon icon={item.collection === "plans" ? faCalendarDays : faDumbbell} />
      {item.collection === "plans" ? "Plan" : "Session"}
    </span>
    <span className="font-semibold leading-snug line-clamp-2">{item.name}</span>
    <span className="text-xs text-primary-100 truncate">by {item.orgName}</span>
    <span className="text-xs text-primary-50">{summaryText(item)}</span>
    {item.tags.length > 0 && (
      <span className="flex flex-wrap gap-1 mt-auto">
        {item.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/15">
            {tag}
          </span>
        ))}
      </span>
    )}
  </button>
);

// Public plans and sessions, as a sideways row of cards on the hero. Hidden
// when there's nothing to show or the list can't be loaded.
export const PublicCatalog = ({ onOpen }: { onOpen: (item: CatalogItem) => void }) => {
  const { data, isLoading, isError } = usePublicCatalog();
  const [chosen, setChosen] = useState<CatalogKind | null>(null);

  if (isLoading) {
    return (
      <div className="relative flex gap-2 overflow-hidden" aria-busy="true" aria-label="Loading public workouts">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-64 h-36 shrink-0 rounded-2xl bg-white/10 animate-pulse" />
        ))}
      </div>
    );
  }
  if (isError || !data?.length) return null;

  const kinds = KINDS.filter((k) => data.some((item) => item.collection === k.id));
  const kind = chosen && kinds.some((k) => k.id === chosen) ? chosen : kinds[0].id;
  const items = data.filter((item) => item.collection === kind);

  return (
    <section className="relative flex flex-col gap-3" aria-label="Public workouts">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary-100">Try a public workout</h2>
        {kinds.length > 1 && (
          <div role="group" aria-label="Show plans or sessions" className="flex gap-1 p-1 rounded-full bg-white/10">
            {kinds.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={kind === id}
                onClick={() => setChosen(id)}
                className={`min-h-9 px-3 rounded-full text-xs font-semibold transition-colors ${FOCUS_WHITE} ${
                  kind === id ? "bg-white text-primary-700" : "text-white hover:bg-white/15"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <ScrollRow ariaLabel={kind === "plans" ? "Public plans" : "Public sessions"}>
        {items.map((item) => (
          <CatalogCard key={`${item.orgId}/${item.collection}/${item.id}`} item={item} onOpen={() => onOpen(item)} />
        ))}
      </ScrollRow>
    </section>
  );
};
