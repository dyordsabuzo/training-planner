import { Input } from "../components/form/Input";
import { MultiSelect } from "../components/form/MultiSelect";
import { ReorderableSelect } from "../components/form/ReorderableSelect";
import { IncrementDecrement } from "../components/others/IncrementDecrement";
import { CollapsibleSection } from "../components/others/CollapsibleSection";
import React, { useContext, useMemo, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";
import { TagInput } from "../components/others/TagInput";
import { FormButtons } from "./FormButtons";
import { ButtonSelection } from "../components/form/ButtonSelection";
import { Modal } from "../components/others/Modal";
import { DetailField } from "./DetailField";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { useEntityForm } from "./useEntityForm";
import { findDuplicateName } from "../common/nameValidation";
import { toStringArray } from "../common/utils";
import {
  buildRelationshipGraph,
  getDirectReferencers,
  nodeId,
} from "../management/buildRelationshipGraph";

type FormData = {
  id?: string;
  name?: string;
  sessions?: string[];
  tags?: string[];
  exercises?: [];
  rest?: string;
  targetRep?: string;
  targetSet?: string;
  targetTime?: string;
  type: "Rep-based" | "Time-based" | null;
};

type Props = {
  data: FormData | null;
  entryType: string;
  closeForm: () => void;
};

export const SupersetForm = ({ data, entryType, closeForm }: Props) => {
  const formData = data;

  const id = formData?.id ?? "";
  const [name, setName] = useState(formData?.name ?? "");
  const [nameError, setNameError] = useState<string>();
  const [sessions, setSessions] = useState<string[]>(toStringArray(formData?.sessions));
  const [exercises, setExercises] = useState<string[]>(
    toStringArray(formData?.exercises)
  );

  const [rest, setRest] = useState<string>(formData?.rest ?? "");
  const [tags, setTags] = useState(toStringArray(formData?.tags));
  const [type, setType] = useState<string>(formData?.type ?? "Rep-based");

  const [targetRep, setTargetRep] = useState(formData?.targetRep ?? "");
  const [targetSet, setTargetSet] = useState<string>(formData?.targetSet ?? "");
  const [targetTime, setTargetTime] = useState<string>(
    formData?.targetTime ?? ""
  );

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;
  const exerciseOptions = Object.keys(sourceData.exercises ?? {});
  const sessionOptions = Object.keys(sourceData.sessions ?? {});

  const resetFields = () => {
    setName(formData?.name ?? "");
    setNameError(undefined);
    setSessions(toStringArray(formData?.sessions));
    setExercises(toStringArray(formData?.exercises));
    setRest(formData?.rest ?? "");
    setTags(toStringArray(formData?.tags));
    setType(formData?.type ?? "Rep-based");
    setTargetRep(formData?.targetRep ?? "");
    setTargetSet(formData?.targetSet ?? "");
    setTargetTime(formData?.targetTime ?? "");
  };

  const { isEditing, setIsEditing, headerAction, handleCancel, handleDelete } =
    useEntityForm({
      type: entryType,
      resetFields,
      onDelete: () => sourceDataContext.deleteSuperset(data),
      closeForm,
    });

  const graph = useMemo(() => buildRelationshipGraph(sourceData), [sourceData]);
  const usageCount =
    entryType === "edit" && name
      ? getDirectReferencers(nodeId("superset", name), graph.edges).length
      : 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (findDuplicateName(sourceData.supersets, name, id)) {
      setNameError("A superset with this name already exists.");
      return;
    }
    setNameError(undefined);

    if (entryType === "add") {
      sourceDataContext.addSuperset({
        name,
        sessions,
        exercises,
        tags,
        rest,
        type,
        targetRep,
        targetSet,
        targetTime,
      });
      closeForm();
    }

    if (entryType === "edit") {
      sourceDataContext.editSuperset({
        id,
        name,
        sessions,
        exercises,
        tags,
        rest,
        type,
        targetRep,
        targetSet,
        targetTime,
      });
      setIsEditing(false);
    }
  };

  return (
    <Modal
      title={entryType === "add" ? "Add superset" : "Superset"}
      isOpen={true}
      onClose={closeForm}
      size="lg"
      headerAction={headerAction}
    >
      {!isEditing ? (
        <div className="flex flex-col gap-4">
          <DetailField label="Superset name" value={name} />
          <DetailField label="Exercises" tags={exercises} />
          <DetailField label="Superset type" value={type} />
          <DetailField label="Linked sessions" tags={sessions} />
          <DetailField label="Tags" tags={tags} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {type === "Rep-based" && <DetailField label="Target rep" value={targetRep} />}
            {type === "Time-based" && <DetailField label="Target time (s)" value={targetTime} />}
            <DetailField label="Target set" value={targetSet} />
            <DetailField label="Rest (s)" value={rest} />
          </div>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <ConfirmDeleteButton
              onDelete={handleDelete}
              impactMessage={
                usageCount > 0
                  ? `This superset is used by ${usageCount} session${usageCount === 1 ? "" : "s"}. Deleting it will leave those references broken. This can't be undone.`
                  : undefined
              }
            />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={`flex flex-col gap-4`}>
          <Input
            label={"Superset Name"}
            required
            value={name}
            placeholder={"Exercise name"}
            error={nameError}
            changeValue={setName}
          />
          <ReorderableSelect
            label={"Exercises"}
            selected={exercises}
            options={exerciseOptions}
            onChange={setExercises}
            placeholder="Select an exercise to add"
            emptyMessage="No exercises added yet"
          />
          <ButtonSelection
            label="Superset type"
            options={["Rep-based", "Time-based"]}
            selection={type}
            onSelect={(value: string) => {
              setType(value);
            }}
          />
          <MultiSelect
            label={"Linked sessions"}
            selected={sessions}
            options={sessionOptions}
            onChange={setSessions}
            placeholder="Select sessions"
          />
          <IncrementDecrement
            label={"Rest time"}
            value={Number(rest) || 0}
            unit={"s"}
            nonZero
            fullWidth
            updateValue={(v) => setRest(String(v))}
          />
          <TagInput
            key={"tags"}
            label={"Tags"}
            list={tags}
            options={[]}
            updateList={setTags}
          />

          <CollapsibleSection label="Advanced settings">
            {type === "Rep-based" && (
              <IncrementDecrement
                label={"Target Rep"}
                value={Number(targetRep) || 0}
                nonZero
                fullWidth
                updateValue={(v) => setTargetRep(String(v))}
              />
            )}
            {type === "Time-based" && (
              <IncrementDecrement
                label={"Target Time"}
                value={Number(targetTime) || 0}
                unit={"s"}
                nonZero
                fullWidth
                updateValue={(v) => setTargetTime(String(v))}
              />
            )}
            <IncrementDecrement
              label={"Target Set"}
              value={Number(targetSet) || 0}
              nonZero
              fullWidth
              updateValue={(v) => setTargetSet(String(v))}
            />
          </CollapsibleSection>

          <FormButtons onCancel={handleCancel} onDelete={entryType === "edit" ? handleDelete : undefined} />
        </form>
      )}
    </Modal>
  );
};
