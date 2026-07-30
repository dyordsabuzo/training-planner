import { faPlus, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "../components/form/Button";

type Props = {
  title: string;
  count: number;
  addLabel?: string;
  onAdd?: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
};

export const ManageListHeader = ({
  title,
  count,
  addLabel,
  onAdd,
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
}: Props) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-text-light dark:text-text-dark">
          {title}
        </h2>
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
          {count} {count === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
        <div className="relative">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark text-sm"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="min-h-11 w-full sm:w-56 pl-9 pr-3 bg-white dark:bg-surface-dark
              border border-gray-300 dark:border-gray-600 text-text-light dark:text-text-dark
              text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {addLabel && onAdd && (
          <Button onClick={onAdd} className="whitespace-nowrap">
            <span className="flex items-center gap-2 px-2">
              <FontAwesomeIcon icon={faPlus} />
              {addLabel}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
};
