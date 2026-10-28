import { FOCUS } from "../pages/others/AgendaRow";

type Props = {
  shown: number;
  total: number;
  onLoadMore: () => void;
  onShowAll: () => void;
};

const PILL = `min-h-11 px-4 rounded-full text-sm font-semibold transition-colors ${FOCUS}`;

// Footer for paged lists; renders nothing once everything is visible.
export const LoadMore = ({ shown, total, onLoadMore, onShowAll }: Props) => {
  if (shown >= total) return null;

  return (
    <div className="flex flex-col items-center gap-2 pt-2">
      <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
        Showing {shown} of {total}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onLoadMore}
          className={`${PILL} bg-primary text-white shadow-sm shadow-primary/30 hover:bg-primary-500`}
        >
          Load more
        </button>
        <button
          type="button"
          onClick={onShowAll}
          className={`${PILL} border border-primary-200 dark:border-primary-700 text-primary
            hover:bg-primary-50 dark:hover:bg-primary-800/20`}
        >
          Show all
        </button>
      </div>
    </div>
  );
};
