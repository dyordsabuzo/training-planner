import React, { useState } from "react";

// Edit forms stay open after Save. `saved` is true while the form still
// matches what was last saved, so any further change hides the "Saved" note.
export const useSavedFlag = (values: unknown) => {
  const current = JSON.stringify(values);
  const [savedSnapshot, setSavedSnapshot] = useState<string>();
  // Pass `saved` when the stored values differ from the form state at submit
  // (e.g. a normalised name), so the note matches what the form shows next.
  const markSaved = (saved: unknown = values) => setSavedSnapshot(JSON.stringify(saved));
  return [savedSnapshot === current, markSaved] as const;
};

export const SavedStatus = ({ show }: { show: boolean }) =>
  show ? (
    <span role="status" className="text-xs text-text-muted-light dark:text-text-muted-dark">
      Saved
    </span>
  ) : null;
