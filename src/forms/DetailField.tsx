import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge } from "../components/others/Badge";

type Props = {
  label: string;
  value?: string | number | null;
  tags?: string[];
  isLink?: boolean;
  className?: string;
};

export const DetailField = ({ label, value, tags, isLink, className }: Props) => {
  return (
    <div className={className}>
      <div className="text-xs font-normal uppercase tracking-wide text-text-muted-light/70 dark:text-text-muted-dark/70 mb-1">
        {label}
      </div>
      {tags ? (
        tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="primary">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-sm text-text-muted-light dark:text-text-muted-dark italic">
            None
          </div>
        )
      ) : isLink && value ? (
        <a
          href={String(value)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-700
            hover:underline break-words focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary rounded"
        >
          {value}
          <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs shrink-0" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : (
        <div className="text-sm text-text-light dark:text-text-dark break-words">
          {value || value === 0 ? (
            value
          ) : (
            <span className="italic text-text-muted-light dark:text-text-muted-dark">
              Not set
            </span>
          )}
        </div>
      )}
    </div>
  );
};
