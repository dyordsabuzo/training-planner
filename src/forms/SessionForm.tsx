

import React, { useContext, useMemo, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";

import { FormButtons } from "./FormButtons";

import { DetailField } from "./DetailField";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { useEntityForm } from "./useEntityForm";
import { findDuplicateName } from "../common/nameValidation";
import { toStringArray } from "../common/utils";
import { Input, ReorderableSelect, TagInput, Modal } from "@dyordsabuzo/ui-components";
import {
  buildRelationshipGraph,
  getDirectReferencers,
  nodeId,
} from "../management/buildRelationshipGraph";

type FormData = {
  id?: string;
  name?: string;
  tags?: string[];
  supersets?: string[];
};

type Props = {
  data: FormData | null;
  type: string;
  closeForm: () => void;
};

export const SessionForm = ({ data, type, closeForm }: Props) => {
  const formData = data;

  const id = formData?.id;
  const [name, setName] = useState(formData?.name ?? "");
  const [nameError, setNameError] = useState<string>();
  const [tags, setTags] = useState(toStringArray(formData?.tags));
  const [supersets, setSupersets] = useState<string[]>(
    toStringArray(formData?.supersets)
  );

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const resetFields = () => {
    setName(formData?.name ?? "");
    setNameError(undefined);
    setTags(toStringArray(formData?.tags));
    setSupersets(toStringArray(formData?.supersets));
  };

  const { isEditing, setIsEditing, headerAction, handleCancel, handleDelete } =
    useEntityForm({
      type,
      resetFields,
      onDelete: () => sourceDataContext.deleteSession(data),
      closeForm,
    });

  const graph = useMemo(() => buildRelationshipGraph(sourceData), [sourceData]);
  const usageCount =
    type === "edit" && name
      ? getDirectReferencers(nodeId("session", name), graph.edges).length
      : 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (findDuplicateName(sourceData.sessions, name, id)) {
      setNameError("A session with this name already exists.");
      return;
    }
    setNameError(undefined);

    if (type === "add") {
      sourceDataContext.addSession({
        name,
        tags,
        supersets,
      });
      closeForm();
    }

    if (type === "edit") {
      sourceDataContext.editSession({
        id,
        name,
        tags,
        supersets,
      });
      setIsEditing(false);
    }
  };

  return (
    <Modal
      title={type === "add" ? "Add session" : "Session"}
      isOpen={true}
      onClose={closeForm}
      headerAction={headerAction}
    >
      {!isEditing ? (
        <div className="flex flex-col gap-4">
          <DetailField label="Session name" value={name} />
          <DetailField label="Tags" tags={tags} />
          <DetailField label="Supersets" tags={supersets} />
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <ConfirmDeleteButton
              onDelete={handleDelete}
              impactMessage={
                usageCount > 0
                  ? `This session is used by ${usageCount} plan${usageCount === 1 ? "" : "s"}. Deleting it will leave those references broken. This can't be undone.`
                  : undefined
              }
            />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={`flex flex-col gap-4`}>
          <Input
            label={"Session Name"}
            required
            value={name}
            placeholder={"Exercise name"}
            error={nameError}
            changeValue={setName}
          />
          <TagInput
            label={"Tags"}
            list={tags}
            options={[]}
            updateList={setTags}
          />
          <ReorderableSelect
            label={"Supersets"}
            selected={supersets}
            options={Object.keys(sourceData.supersets ?? {})}
            onChange={setSupersets}
            placeholder="Select a superset to add"
            emptyMessage="No supersets added yet"
          />

          <FormButtons onCancel={handleCancel} onDelete={type === "edit" ? handleDelete : undefined} />
        </form>
      )}
    </Modal>
  );
};
