import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";

// How long a cache kept on the device stays usable. Content is still
// refreshed sooner whenever settings/app.contentVersion changes (see
// SourceDataContext).
export const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// Bump when the shape of cached data changes, to drop every device's old cache
// (v2: references and progress keys stored as ids, see refs.ts).
export const CACHE_BUSTER = "v2";

const CACHE_STORAGE_KEY = "training-planner-query-cache";

// The content version the device's cached content was loaded against.
export const CONTENT_VERSION_KEY = "training-planner-content-version";

// Firestore reads aren't free and mutations already write straight into the
// query cache, so a background refetch-on-focus buys no extra correctness —
// only cost. A 5 minute staleTime means revisiting a page (Manage, Home, ...)
// serves cached data instantly instead of re-fetching every collection.
// gcTime must be at least CACHE_MAX_AGE, or queries are dropped before they
// can be saved to the device.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: CACHE_MAX_AGE,
      refetchOnWindowFocus: false,
    },
  },
});

// IndexedDB rather than localStorage: the full content set can outgrow
// localStorage's ~5MB limit.
export const queryPersister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => get(key),
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
  key: CACHE_STORAGE_KEY,
});

// Called on sign-out so the next person on this device doesn't get the
// previous user's cached progress.
export const clearQueryCache = async () => {
  queryClient.clear();
  localStorage.removeItem(CONTENT_VERSION_KEY);
  await queryPersister.removeClient();
};
