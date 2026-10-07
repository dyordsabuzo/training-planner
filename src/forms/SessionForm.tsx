import React, { useContext, useRef, useState } from "react";
import { Dayjs } from "dayjs";
import SourceDataContext from "../context/SourceDataContext";

import { FormButtons } from "./FormButtons";
import { SessionGroupEditor } from "./SessionGroupEditor";

import { findDuplicateName } from "../common/nameValidation";
import { toDate } from "../common/planWeek";
import { toStringArray } from "../common/utils";
import { Button, DateInput, Input, ReorderableSelect, TagInput, Modal, Toggle } from "@dyordsabuzo/ui-components";
import { SessionGroup, groupKeys, resolveSession } from "../pages/resolveSessionSupersets";

type Props = {
  data: any;
  type: string;
  closeForm: () => void;
};

export const SessionForm = ({ data, type, closeForm }: Props) => {
  const formData = data;

  const id = formData?.id;
  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const [name, setName] = useState(formData?.name ?? "");
  const [nameError, setNameError] = useState<string>();
  const [tags, setTags] = useState(toStringArray(formData?.tags));
  const [date, setDate] = useState<Dayjs | null>(toDate(formData?.date));
  const [supersets, setSupersets] = useState<string[]>(toStringArray(formData?.supersets));
  const [groups, setGroups] = useState<SessionGroup[]>(formData?.groups ?? []);
  const [groupsError, setGroupsError] = useState<string>();
  const [isShareable, setIsShareable] = useState(formData?.isShareable ?? false);
  const tagFieldRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (findDuplicateName(sourceData.sessions, name, id)) {
      setNameError("A session with this name already exists.");
      return;
    }
    setNameError(undefined);

    const cleanGroups = groups.map((g) => ({ ...g, name: g.name.trim() }));
    // Groups may share a name; their identity is made unique by groupKeys.
    const names = [...supersets, ...groupKeys(supersets, cleanGroups)];
    if (names.length === 0) {
      setGroupsError("Add at least one superset or exercise group.");
      return;
    }
    if (cleanGroups.some((g) => !g.name || g.exercises.length === 0)) {
      setGroupsError("Each group needs a name and at least one exercise.");
      return;
    }
    setGroupsError(undefined);

    // TagInput only commits a tag on Enter/Tab/comma, so text still typed in
    // its box would be lost on Save. Pick it up here.
    const pendingTag = tagFieldRef.current?.querySelector("input")?.value.trim() ?? "";
    const finalTags = pendingTag && !tags.includes(pendingTag) ? [...tags, pendingTag] : tags;

    // The shared link reads this snapshot directly (unauthenticated visitors
    // can't query the supersets/exercises collections), so it's regenerated
    // from the form's own selections on every save while shareable is on.
    const sharedSnapshot = isShareable
      ? resolveSession(sourceData, { supersets, groups: cleanGroups })
      : null;

    const session = {
      name,
      tags: finalTags,
      date: date ? date.format("YYYY-MM-DD") : null,
      supersets,
      groups: cleanGroups,
      // Order for the shared link (Firestore doesn't keep map key order).
      sharedOrder: names,
      isShareable,
      sharedSnapshot,
    };

    if (type === "add") {
      sourceDataContext.addSession(session);
      closeForm();
    }

    if (type === "edit") {
      sourceDataContext.editSession({ id, ...session });
      closeForm();
    }
  };

  return (
    <Modal
      title={type === "add" ? "Add session" : "Session"}
      isOpen={true}
      onClose={closeForm}
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

        <div ref={tagFieldRef}>
          <TagInput label={"Tags"} list={tags} options={[]} updateList={setTags} />
        </div>

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
        />
        {groupsError && <span className="text-sm text-danger">{groupsError}</span>}

        <div className="flex flex-col gap-1">
          <Toggle label="Shareable?" labelDirection="row" value={isShareable} toggle={setIsShareable} />
          <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
            Anyone with the link can simulate it without signing in.
          </span>
        </div>

        <FormButtons onCancel={closeForm} />
      </form>
    </Modal>
  );
};
