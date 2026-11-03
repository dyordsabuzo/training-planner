import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Dayjs } from "dayjs";
import SourceDataContext from "../context/SourceDataContext";

import { ExerciseForm } from "./ExerciseForm";
import { FormButtons } from "./FormButtons";
import { SessionGroupEditor } from "./SessionGroupEditor";

import { findDuplicateName } from "../common/nameValidation";
import { toDate } from "../common/planWeek";
import { toStringArray } from "../common/utils";
import { Button, DateInput, Input, MultiSelect, ReorderableSelect, TagInput, Modal, Toggle } from "@dyordsabuzo/ui-components";
import { SessionGroup, groupId, groupKeys, resolveSession } from "../pages/resolveSessionSupersets";

type Props = {
  data: any;
  type: string;
  closeForm: () => void;
};

const STATUS_TEXT = {
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save",
  invalid: "Not saved",
};

export const SessionForm = ({ data, type, closeForm }: Props) => {
  // Frozen at open: callers may pass a live lookup by name, which goes
  // undefined after an autosaved rename and would lose the id.
  const [formData] = useState(data);

  const id = formData?.id;
  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const [name, setName] = useState(formData?.name ?? "");
  const [nameError, setNameError] = useState<string>();
  const [tags, setTags] = useState(toStringArray(formData?.tags));
  const [date, setDate] = useState<Dayjs | null>(toDate(formData?.date));
  const [supersets, setSupersets] = useState<string[]>(toStringArray(formData?.supersets));
  // Every group gets an id so rows keep their identity when reordered. Groups
  // saved without one get the key-based id their logged progress already
  // maps to (see groupId), so saving doesn't detach it.
  const [groups, setGroups] = useState<SessionGroup[]>(() => {
    const stored: SessionGroup[] = formData?.groups ?? [];
    const keys = groupKeys(toStringArray(formData?.supersets), stored);
    return stored.map((group, i) => ({ ...group, id: groupId(group, keys[i]) }));
  });
  const [groupsError, setGroupsError] = useState<string>();
  const [isShareable, setIsShareable] = useState(formData?.isShareable ?? false);
  const [optional, setOptional] = useState(formData?.optional ?? false);
  // Plans list their sessions, so these are saved to the plans, not the session.
  // Linked plans belong to another org and can't be changed here.
  const editablePlans: any[] = Object.values(sourceData.plans ?? {}).filter(
    (plan: any) => !plan.linked && !plan.archived
  );
  const [planIds, setPlanIds] = useState<string[]>(() =>
    editablePlans
      .filter((plan) => toStringArray(plan.sessions).some((ref) => id && sourceData.sessions?.[ref]?.id === id))
      .map((plan) => plan.id)
  );
  const tagFieldRef = useRef<HTMLDivElement>(null);
  // Group waiting for an exercise created from the nested exercise modal,
  // plus the name to pre-fill (search text from the dropdown, if any).
  const [newExercise, setNewExercise] = useState<{ groupId: string; name: string } | null>(null);

  const [writeStatus, setWriteStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const status = nameError || groupsError ? "invalid" : writeStatus;

  // The fields a save writes, and what decides whether one is needed.
  const fieldsWith = (finalTags: string[]) => ({
    name: name.trim(),
    tags: finalTags,
    date: date ? date.format("YYYY-MM-DD") : null,
    optional,
    supersets,
    groups: groups.map((g) => ({ ...g, name: g.name.trim() })),
    isShareable,
  });
  const fieldsKey = JSON.stringify(fieldsWith(tags));
  const draftKey = JSON.stringify([fieldsKey, [...planIds].sort()]);

  // Last value read from the tag box. The box is gone by the time the unmount
  // flush runs, and forgetting its text there would write the tag back out.
  const pendingTag = useRef("");

  // Validates the form, showing any errors. Returns the session to save, or
  // null if it can't be saved yet.
  const buildSession = () => {
    const nameProblem = !name.trim()
      ? "Enter a session name."
      : findDuplicateName(sourceData.sessions, name, id)
        ? "A session with this name already exists."
        : undefined;
    setNameError(nameProblem);

    // TagInput only commits a tag on Enter/Tab/comma, so text still typed in
    // its box would be lost on Save. Pick it up here.
    const tagInput = tagFieldRef.current?.querySelector("input");
    if (tagInput) pendingTag.current = tagInput.value.trim();
    const finalTags =
      pendingTag.current && !tags.includes(pendingTag.current) ? [...tags, pendingTag.current] : tags;

    const fields = fieldsWith(finalTags);
    // Groups may share a name; their identity is made unique by groupKeys.
    const names = [...supersets, ...groupKeys(supersets, fields.groups)];
    const groupsProblem =
      names.length === 0
        ? "Add at least one superset or exercise group."
        : fields.groups.some((g) => !g.name || g.exercises.length === 0)
          ? "Each group needs a name and at least one exercise."
          : undefined;
    setGroupsError(groupsProblem);

    if (nameProblem || groupsProblem) return null;

    return {
      ...fields,
      // Order for the shared link (Firestore doesn't keep map key order).
      sharedOrder: names,
      // The shared link reads this snapshot directly (unauthenticated visitors
      // can't query the supersets/exercises collections), so it's regenerated
      // from the form's own selections on every save while shareable is on.
      sharedSnapshot: isShareable ? resolveSession(sourceData, { supersets, groups: fields.groups }) : null,
    };
  };

  // Changes to an existing session save on their own (debounced, and flushed
  // on close), writing only when the fields differ from the last save.
  const savedKey = useRef<string | null>(fieldsKey);
  const savedPlanIds = useRef(planIds);
  const retryPlanIds = useRef<string[]>([]);
  const lastWrite = useRef(0);
  const persist = async () => {
    if (type !== "edit" || formData?.linked || !id) return;

    const session = buildSession();
    if (!session) return;

    const key = JSON.stringify(fieldsWith(session.tags));
    const sessionChanged = key !== savedKey.current;
    const changedPlans = Array.from(new Set([...planIds, ...savedPlanIds.current, ...retryPlanIds.current])).filter(
      (plan) =>
        retryPlanIds.current.includes(plan) || planIds.includes(plan) !== savedPlanIds.current.includes(plan)
    );
    if (!sessionChanged && changedPlans.length === 0) return;
    savedKey.current = key;
    savedPlanIds.current = planIds;
    retryPlanIds.current = [];

    const stored: any = Object.values(sourceData.sessions ?? {}).find((s: any) => s.id === id) ?? formData;
    const write = ++lastWrite.current;
    setWriteStatus("saving");
    // Only what changed: a session write and a plan write each bump the version.
    const [savedSession, savedPlans] = await Promise.all([
      sessionChanged ? sourceDataContext.editSession({ ...stored, id, ...session }) : true,
      changedPlans.length > 0
        ? sourceDataContext.setSessionPlans(
            id,
            Object.fromEntries(changedPlans.map((plan) => [plan, planIds.includes(plan)]))
          )
        : true,
    ]);
    // Retried by the next change or flush, unless a newer edit already replaced it.
    if (!savedSession && savedKey.current === key) savedKey.current = null;
    if (!savedPlans) retryPlanIds.current.push(...changedPlans);
    if (write === lastWrite.current) setWriteStatus(savedSession && savedPlans ? "saved" : "error");
  };
  // Timers and the unmount flush must see the latest sourceData.
  const persistRef = useRef(persist);
  persistRef.current = persist;

  const debouncedKey = useRef(draftKey);
  useEffect(() => {
    if (draftKey === debouncedKey.current) return;
    debouncedKey.current = draftKey;
    const timer = setTimeout(() => persistRef.current(), 800);
    return () => clearTimeout(timer);
  }, [draftKey]);

  useEffect(() => {
    // A phone locking or switching apps may never come back to this page.
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") persistRef.current();
    };
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", flushWhenHidden);
      persistRef.current();
    };
  }, []);

  // Modal moves focus whenever onClose changes, so this must stay the same
  // function across renders or each save would pull focus from the field being
  // typed in. Escape is ignored while the exercise modal is open on top.
  const closeRef = useRef(() => {});
  closeRef.current = () => {
    if (newExercise) return;
    persist();
    closeForm();
  };
  const handleClose = useCallback(() => closeRef.current(), []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (type === "edit") {
      persist();
      return;
    }

    const session = buildSession();
    if (session && type === "add") {
      // Plans reference the session by id, so they're updated once it has one.
      sourceDataContext.addSession(session).then((saved) => {
        if (saved?.id && planIds.length > 0) {
          sourceDataContext.setSessionPlans(saved.id, Object.fromEntries(planIds.map((plan) => [plan, true])));
        }
      });
      closeForm();
    }
  };

  return (
    <>
    <Modal
      title={type === "add" ? "Add session" : "Session"}
      isOpen={true}
      onClose={handleClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={"Session name"}
          required
          value={name}
          placeholder={"Session name"}
          error={nameError}
          changeValue={setName}
        />

        <div className="flex items-end gap-2">
          <div className="grow">
            <DateInput
              label={"Date (optional)"}
              value={date}
              placeholder={"Planned date"}
              changeValue={setDate}
            />
          </div>
          {date && (
            <Button label="Clear date" decoration="cancel" className="text-xs" onClick={() => setDate(null)} />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Toggle label="Optional session?" labelDirection="row" value={optional} toggle={setOptional} />
          <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
            Shows only on its date and is never marked as missed or overdue.
          </span>
        </div>

        <div ref={tagFieldRef}>
          <TagInput label={"Tags"} list={tags} options={[]} updateList={setTags} />
        </div>

        {!formData?.linked && (
          <MultiSelect
            label={"Plans"}
            options={editablePlans.map((plan) => ({ value: plan.id, label: plan.name }))}
            selected={planIds}
            onChange={setPlanIds}
            placeholder="Add to a plan"
          />
        )}

        <ReorderableSelect
          label={"Supersets"}
          selected={supersets}
          options={Object.keys(sourceData.supersets ?? {})}
          onChange={setSupersets}
          placeholder="Select a superset to add"
          emptyMessage="No supersets added yet"
        />

        <SessionGroupEditor
          value={groups}
          onChange={setGroups}
          exerciseOptions={Object.keys(sourceData.exercises ?? {})}
          onCreateExercise={(groupId, name = "") => setNewExercise({ groupId, name })}
        />
        {groupsError && <span className="text-sm text-danger">{groupsError}</span>}

        <div className="flex flex-col gap-1">
          <Toggle label="Shareable?" labelDirection="row" value={isShareable} toggle={setIsShareable} />
          <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
            Anyone with the link can simulate it without signing in.
          </span>
        </div>

        {type === "edit" ? (
          <div className="flex items-center gap-3 py-4">
            <Button label="Done" type="button" decoration="save" onClick={handleClose} />
            {status !== "idle" && (
              <span
                role="status"
                className={`text-xs ${
                  status === "error" || status === "invalid"
                    ? "text-danger"
                    : "text-text-muted-light dark:text-text-muted-dark"
                }`}
              >
                {STATUS_TEXT[status]}
              </span>
            )}
          </div>
        ) : (
          <FormButtons onCancel={closeForm} />
        )}
      </form>
    </Modal>

    {/* Outside the session <form> so its submit doesn't bubble to handleSubmit. */}
    {newExercise && (
      <ExerciseForm
        key={newExercise.groupId}
        data={{ name: newExercise.name } as any}
        type="add"
        closeForm={() => setNewExercise(null)}
        onCreated={(exercise) =>
          setGroups((current) =>
            current.map((g) =>
              g.id === newExercise.groupId && !g.exercises.includes(exercise)
                ? { ...g, exercises: [...g.exercises, exercise] }
                : g
            )
          )
        }
      />
    )}
    </>
  );
};
