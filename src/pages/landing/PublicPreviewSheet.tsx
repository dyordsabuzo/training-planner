import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Button, Modal } from "@dyordsabuzo/ui-components";
import { faCalendarDays, faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { callFunction } from "../../common/firebase";
import { AgendaRow, SectionLabel, StatusChip } from "../others/AgendaRow";
import { CatalogItem, summaryText } from "./PublicCatalog";

type PreviewUnit = { name: string; exercises: string[]; sets?: number; reps?: number | string; time?: number; distance?: number };
type PreviewSession = { name: string; units: PreviewUnit[] };
// publicLinkToken: the item's public link, if its owner published one.
type Preview = { publicLinkToken?: string | null } & (
  | ({ collection: "sessions" } & PreviewSession)
  | {
      collection: "plans";
      name: string;
      open: boolean;
      weeks: { week: string; targetRep?: number; targetSet?: number; targetTime?: number; annotation?: string }[];
      sessions: PreviewSession[];
    }
);

const targetsOf = ({ sets, reps, time, distance }: PreviewUnit) => {
  const each = time ? `${time}s` : distance ? `${distance} m` : reps ? `${reps}` : null;
  if (sets && each) return `${sets} × ${each}`;
  if (sets) return `${sets} sets`;
  return each;
};

const Units = ({ units }: { units: PreviewUnit[] }) => (
  <div className="flex flex-col gap-2">
    {units.map((unit, i) => {
      const targets = targetsOf(unit);
      return (
        <AgendaRow
          key={`${unit.name}-${i}`}
          icon={faLayerGroup}
          tone="primary"
          title={unit.name}
          subtitle={unit.exercises.join(", ")}
          trailing={targets && <StatusChip tone="neutral">{targets}</StatusChip>}
        />
      );
    })}
  </div>
);

const PreviewBody = ({ preview }: { preview: Preview }) => {
  if (preview.collection === "sessions") {
    return (
      <div className="flex flex-col gap-1">
        <SectionLabel>Exercises</SectionLabel>
        <Units units={preview.units} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {preview.weeks.length > 0 && (
        <div className="flex flex-col gap-1">
          <SectionLabel>{preview.weeks.length === 1 ? "1 week" : `${preview.weeks.length} weeks`}</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {preview.weeks.map(({ week }) => (
              <StatusChip key={week} tone="primary">
                {week}
              </StatusChip>
            ))}
          </div>
        </div>
      )}
      {preview.sessions.map((session, i) => (
        <div key={`${session.name}-${i}`} className="flex flex-col gap-1">
          <SectionLabel>{session.name}</SectionLabel>
          <Units units={session.units} />
        </div>
      ))}
    </div>
  );
};

// What's inside a public plan or session, with a way to sign up and use it.
export const PublicPreviewSheet = ({
  item,
  onClose,
  onSignup,
}: {
  item: CatalogItem;
  onClose: () => void;
  onSignup: () => void;
}) => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["publicPreview", item.orgId, item.collection, item.id],
    queryFn: () =>
      callFunction<Preview>("getPublicPreview", { orgId: item.orgId, collection: item.collection, id: item.id }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return (
    <Modal title={item.name} isOpen={true} onClose={onClose} size="lg">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
            {item.collection === "plans" ? "Plan" : "Session"} by {item.orgName} · {summaryText(item)}
          </p>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <StatusChip key={tag} tone="neutral">
                  {tag}
                </StatusChip>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : isError || !data ? (
          <AgendaRow icon={faCalendarDays} tone="neutral" title="Preview unavailable" subtitle="Sign up to see everything inside." />
        ) : (
          <PreviewBody preview={data} />
        )}

        {/* Runs through the public link page; nothing is saved there. */}
        {data?.publicLinkToken ? (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => navigate(`/training-planner/public/${item.orgId}/${data.publicLinkToken}`)}
              className="min-h-11"
            >
              Start workout
            </Button>
            <Button onClick={onSignup} decoration="cancel" className="min-h-11">
              Sign up to save your progress
            </Button>
          </div>
        ) : (
          <Button onClick={onSignup} className="min-h-11">
            Sign up to use
          </Button>
        )}
      </div>
    </Modal>
  );
};
