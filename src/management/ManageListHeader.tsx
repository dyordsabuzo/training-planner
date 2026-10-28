import { faPlus, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FOCUS } from "../pages/others/AgendaRow";

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
        <h2 className="flex items-center gap-2 text-lg font-bold text-text-light dark:text-text-dark">
          {title}
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary dark:bg-primary-800/30 dark:text-primary-200">
            {count} <span className="sr-only">{count === 1 ? "item" : "items"}</span>
          </span>
        </h2>
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
            className="min-h-11 w-full sm:w-64 pl-9 pr-4 bg-gray-50 dark:bg-gray-800/40
              border border-transparent text-text-light dark:text-text-dark
              text-sm rounded-full focus:bg-white dark:focus:bg-surface-dark focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {addLabel && onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className={`flex items-center justify-center gap-2 min-h-11 px-4 rounded-full whitespace-nowrap bg-primary
              text-white text-sm font-semibold shadow-sm shadow-primary/30 hover:bg-primary-500 transition-colors ${FOCUS}`}
          >
            <FontAwesomeIcon icon={faPlus} />
            {addLabel}
          </button>
        )}
      </div>
    </div>
  );
};
