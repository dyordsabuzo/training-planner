import { useContext, useState } from "react";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import AuthContext from "../../context/AuthContext";
import SessionContext from "../../context/SessionContext";
import SourceDataContext from "../../context/SourceDataContext";
import { ConfirmDeleteButton } from "../../forms/ConfirmDeleteButton";
import { OPEN_WEEK } from "../../common/planCycle";
import { unsavedRun } from "../../common/unsavedRun";
import { OUTLINE_PILL } from "./HeroTile";
import { FOCUS } from "./AgendaRow";

const plural = (count: number) => `${count} set${count === 1 ? "" : "s"}`;

// Offers to save a workout that never finished. Hidden during a run, whose
// in-progress sets aren't lost.
export const UnsavedRunBanner = () => {
  const { sourceData } = useContext(SourceDataContext);
  const { isImpersonating } = useContext(AuthContext);
  const { sessionData, recoverRun, discardProgress } = useContext(SessionContext);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  if (status === "saved") {
    return (
      <div role="status" className="flex items-center gap-3 rounded-xl bg-success-50 dark:bg-success-700/20 p-3 text-sm">
        <FontAwesomeIcon icon={faCircleCheck} className="text-success-700 dark:text-success-500" />
        Workout saved to History as incomplete.
      </div>
    );
  }

  const userdata = Object.values(sourceData?.userdata ?? {})[0];
  const run = isImpersonating || sessionData ? null : unsavedRun(userdata, sourceData?.plans);
  if (!run) return null;

  const save = async () => {
    setStatus("saving");
    try {
      await recoverRun(run);
      setStatus("saved");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <div role="status" className="flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-700/20 p-3 text-sm">
      <FontAwesomeIcon icon={faCircleExclamation} className="text-amber-700 dark:text-amber-400 mt-0.5" />
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <div className="text-text-light dark:text-text-dark">
          <strong className="break-words">Unsaved workout: {run.session}</strong>
          <p className="break-words">
            {[run.plan, run.week !== OPEN_WEEK && run.week, run.savedAt && dayjs(run.savedAt).format("ddd, MMM D HH:mm")]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p>
            {plural(run.sets)} logged, but the workout never finished.
            {run.replacesResults && " Saving replaces the results already recorded for this session and week."}
          </p>
          {status === "failed" && (
            <p className="text-danger dark:text-danger-500 font-semibold">Couldn't save. Check your connection and try again.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={status === "saving"}
            onClick={save}
            className={`min-h-11 px-4 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-500
              transition-colors disabled:opacity-50 ${FOCUS}`}
          >
            {status === "saving" ? "Saving…" : "Save to History"}
          </button>
          <ConfirmDeleteButton
            label="Discard"
            triggerClassName={OUTLINE_PILL}
            impactMessage={`Delete these ${plural(run.sets)}? This can't be undone.`}
            onDelete={discardProgress}
          />
        </div>
      </div>
    </div>
  );
};
