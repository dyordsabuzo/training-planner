import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  onClick: () => void;
};

export const EditIconButton = ({ onClick }: Props) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Edit"
    className="min-h-11 min-w-11 flex items-center justify-center rounded-full
      text-secondary dark:text-secondary-200
      hover:bg-gray-100 dark:hover:bg-gray-700
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
  >
    <FontAwesomeIcon icon={faPen} />
  </button>
);
