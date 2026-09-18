

import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import SourceDataContext from "../context/SourceDataContext";

import { FormButtons } from "./FormButtons";

import { DetailField } from "./DetailField";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { useEntityForm } from "./useEntityForm";
import { findDuplicateName } from "../common/nameValidation";
import { toStringArray } from "../common/utils";
import { Button, ButtonSelection, Input, ReorderableSelect, TagInput, Modal } from "@dyordsabuzo/ui-components";
import {
  buildRelationshipGraph,
  getDirectReferencers,
  nodeId,
} from "../management/buildRelationshipGraph";
import { resolveSessionSupersets } from "../pages/resolveSessionSupersets";

type FormData = {
  id?: string;
  name?: string;
  tags?: string[];
  supersets?: string[];
  isShareable?: boolean;
};

type Props = {
  data: FormData | null;
  type: string;
  closeForm: () => void;
  onClone?: (data: any) => void;
};

export const SessionForm = ({ data, type, closeForm, onClone }: Props) => {
  const formData = data;
  const navigate = useNavigate();

  const id = formData?.id;
  const [name, setName] = useState(formData?.name ?? "");
  const [nameError, setNameError] = useState<string>();
  const [tags, setTags] = useState(toStringArray(formData?.tags));
  const [supersets, setSupersets] = useState<string[]>(
    toStringArray(formData?.supersets)
  );
  const [isShareable, setIsShareable] = useState(formData?.isShareable ?? false);
  const [linkCopied, setLinkCopied] = useState(false);

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const resetFields = () => {
    setName(formData?.name ?? "");
    setNameError(undefined);
    setTags(toStringArray(formData?.tags));
    setSupersets(toStringArray(formData?.supersets));
    setIsShareable(formData?.isShareable ?? false);
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

  const handleClone = () => {
    onClone?.({
      name: `${name} (copy)`,
      tags,
      supersets,
    });
  };

  const handleSimulate = () => {
    closeForm();
    navigate(`/training-planner/manage/simulate/${encodeURIComponent(name)}`);
  };

  const shareUrl = id
    ? `${window.location.origin}/training-planner/share/${id}`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {}
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (findDuplicateName(sourceData.sessions, name, id)) {
      setNameError("A session with this name already exists.");
      return;
    }
    setNameError(undefined);

    // The shared link reads this snapshot directly (unauthenticated visitors
    // can't query the supersets/exercises collections), so it's regenerated
    // from the form's own selections on every save while shareable is on —
    // not read back from sourceData, which may not reflect this unsaved edit.
    const sharedSnapshot = isShareable
      ? resolveSessionSupersets(sourceData, supersets)
      : null;

    if (type === "add") {
      sourceDataContext.addSession({
        name,
        tags,
        supersets,
        isShareable,
        sharedSnapshot,
      });
      closeForm();
    }

    if (type === "edit") {
      sourceDataContext.editSession({
        id,
        name,
        tags,
        supersets,
        isShareable,
        sharedSnapshot,
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
          <DetailField label="Shareable" value={isShareable ? "Yes" : "No"} />
          {isShareable && shareUrl && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-text-muted-light dark:text-text-muted-dark">
                Shareable link
              </span>
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm text-text-light dark:text-text-dark">
                  {shareUrl}
                </span>
                <Button
                  label={linkCopied ? "Copied!" : "Copy"}
                  className="text-xs shrink-0"
                  onClick={handleCopyLink}
                />
              </div>
              <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                Anyone with this link can simulate this session without signing in.
              </span>
            </div>
          )}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <Button label="Simulate session" className="text-xs" onClick={handleSimulate} />
            <div className="flex gap-2">
              {onClone && (
                <Button label="Clone" className="text-xs" onClick={handleClone} />
              )}
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
          <ButtonSelection
            label="Shareable? (anyone with the link can simulate it without signing in)"
            options={["Yes", "No"]}
            selection={isShareable ? "Yes" : "No"}
            onSelect={(value: string) => {
              setIsShareable(value === "Yes");
            }}
          />

          <FormButtons onCancel={handleCancel} onDelete={type === "edit" ? handleDelete : undefined} />
        </form>
      )}
    </Modal>
  );
};
