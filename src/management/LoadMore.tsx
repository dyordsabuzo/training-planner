import { Button } from "@dyordsabuzo/ui-components";

type Props = {
  shown: number;
  total: number;
  onLoadMore: () => void;
  onShowAll: () => void;
};

// Footer for paged lists; renders nothing once everything is visible.
export const LoadMore = ({ shown, total, onLoadMore, onShowAll }: Props) => {
  if (shown >= total) return null;

  return (
    <div className="flex flex-col items-center gap-2 pt-2">
      <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
        Showing {shown} of {total}
      </span>
      <div className="flex gap-2">
        <Button label="Load more" onClick={onLoadMore} />
        <Button label="Show all" decoration="cancel" onClick={onShowAll} />
      </div>
    </div>
  );
};
