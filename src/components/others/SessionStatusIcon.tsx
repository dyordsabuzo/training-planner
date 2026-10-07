import dayjs from "dayjs";
import { faCircle, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
  date?: string;
  done: boolean;
};

// Done sessions get a green check. Not-done sessions get an empty circle, red
// once their date has passed. Sessions dated in the future show no icon.
export const SessionStatusIcon = ({ date, done }: Props) => {
  if (done) {
    return (
      <span role="img" aria-label="Done" title="Done" className="text-success-500">
        <FontAwesomeIcon icon={faCircleCheck} />
      </span>
    );
  }

  if (date && dayjs(date).isAfter(dayjs(), "day")) {
    return null;
  }

  const overdue = !!date && dayjs(date).isBefore(dayjs(), "day");
  return (
    <span
      role="img"
      aria-label={overdue ? "Overdue" : "Not done"}
      title={overdue ? "Overdue" : "Not done"}
      className={overdue ? "text-danger" : "text-text-muted-light dark:text-text-muted-dark"}
    >
      <FontAwesomeIcon icon={faCircle} />
    </span>
  );
};
