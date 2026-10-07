import { useEffect, useState } from "react";

// Client-side "load more": data is fetched in full once (see getFromDB), so
// this only limits how many items a list renders. The limit resets to one
// page whenever `resetKey` changes (e.g. the search text).
export const useLoadMore = (pageSize: number, resetKey?: unknown) => {
  const [limit, setLimit] = useState(pageSize);

  useEffect(() => {
    setLimit(pageSize);
  }, [resetKey, pageSize]);

  return {
    limit,
    loadMore: () => setLimit((current) => current + pageSize),
    showAll: () => setLimit(Infinity),
  };
};
