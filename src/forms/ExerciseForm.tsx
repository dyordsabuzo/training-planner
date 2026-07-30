import React, { useContext, useMemo, useState } from "react";
import { Input } from "../components/form/Input";
import { MultiSelect } from "../components/form/MultiSelect";
import { IncrementDecrement } from "../components/others/IncrementDecrement";
import { CollapsibleSection } from "../components/others/CollapsibleSection";
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

type ExerciseData = {
  id?: string;
  name?: string;
  videoLink?: string;
  tags?: string[];
  targetRep?: string;
  targetSet?: string;
  rest?: string;
  supersets?: string[];
  alternatives: string[];
  isTimeBased: boolean;
  isWeightExercise: boolean;
};

type Props = {
  data: ExerciseData | null;
  type: string;
  closeForm: () => void;
};

export const ExerciseForm = ({ data, type, closeForm }: Props) => {
  const exerciseData: ExerciseData | null = data;

  const id = exerciseData?.id ?? "";
  const [name, setName] = useState(exerciseData?.name ?? "");
  const [nameError, setNameError] = useState<string>();
  const [videoLink, setVideoLink] = useState(exerciseData?.videoLink ?? "");
  const [isWeightExercise, setIsWeightExercise] = useState(
    exerciseData?.isWeightExercise ?? true
  );
  const [tags, setTags] = useState(toStringArray(exerciseData?.tags));
  const [targetRep, setTargetRep] = useState(exerciseData?.targetRep ?? "");
  const [targetSet, setTargetSet] = useState<string>(
    exerciseData?.targetSet ?? ""
  );
  const [rest, setRest] = useState<string>(exerciseData?.rest ?? "");
  const [supersets, setSupersets] = useState<string[]>(
    toStringArray(exerciseData?.supersets)
  );
  const [alternatives, setAlternatives] = useState<string[]>(
    toStringArray(exerciseData?.alternatives)
  );

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const resetFields = () => {
    setName(exerciseData?.name ?? "");
    setNameError(undefined);
    setVideoLink(exerciseData?.videoLink ?? "");
    setIsWeightExercise(exerciseData?.isWeightExercise ?? true);
    setTags(toStringArray(exerciseData?.tags));
    setTargetRep(exerciseData?.targetRep ?? "");
    setTargetSet(exerciseData?.targetSet ?? "");
    setRest(exerciseData?.rest ?? "");
    setSupersets(toStringArray(exerciseData?.supersets));
    setAlternatives(toStringArray(exerciseData?.alternatives));
  };

  const { isEditing, setIsEditing, headerAction, handleCancel, handleDelete } =
    useEntityForm({
      type,
      resetFields,
      onDelete: () => sourceDataContext.deleteExercise(data),
      closeForm,
    });

  const graph = useMemo(() => buildRelationshipGraph(sourceData), [sourceData]);
  const usageCount =
    type === "edit" && name
      ? getDirectReferencers(nodeId("exercise", name), graph.edges).length
      : 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (findDuplicateName(sourceData.exercises, name, id)) {
      setNameError("An exercise with this name already exists.");
      return;
    }
    setNameError(undefined);

    if (type === "add") {
      sourceDataContext.addExercise({
        name,
        videoLink,
        tags,
        targetRep,
        targetSet,
        rest,
        supersets,
        alternatives,
        targetWeight: 0,
        isWeightExercise,
      });
      closeForm();
    }

    if (type === "edit") {
      sourceDataContext.updateExercise({
        id,
        name,
        videoLink,
        tags,
        targetRep,
        targetSet,
        rest,
        supersets,
        alternatives,
        targetWeight: 0,
        isWeightExercise,
      });
      setIsEditing(false);
    }
  };

  return (
    <Modal
      title={type === "add" ? "Add exercise" : "Exercise"}
      isOpen={true}
      onClose={closeForm}
      headerAction={headerAction}
    >
      {!isEditing ? (
        <div className="flex flex-col gap-4">
          <DetailField label="Exercise name" value={name} />
          <DetailField label="Video link" value={videoLink} isLink />
          <DetailField label="Weight exercise" value={isWeightExercise ? "Yes" : "No"} />
          <DetailField label="Supersets" tags={supersets} />
          <DetailField label="Tags" tags={tags} />
          <DetailField label="Alternatives" tags={alternatives} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DetailField label="Target rep" value={targetRep} />
            <DetailField label="Target set" value={targetSet} />
            <DetailField label="Rest (s)" value={rest} />
          </div>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <ConfirmDeleteButton
              onDelete={handleDelete}
              impactMessage={
                usageCount > 0
                  ? `This exercise is used by ${usageCount} superset${usageCount === 1 ? "" : "s"}. Deleting it will leave those references broken. This can't be undone.`
                  : undefined
              }
            />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={`flex flex-col gap-4`}>
          <Input
            label={"Exercise Name"}
            required
            value={name}
            placeholder={"Exercise name"}
            error={nameError}
            changeValue={setName}
          />
          <Input
            label={"Video link"}
            value={videoLink}
            placeholder={"Video link"}
            changeValue={setVideoLink}
          />
          <ButtonSelection
            label="Weight exercise?"
            options={["Yes", "No"]}
            selection={isWeightExercise ? "Yes" : "No"}
            onSelect={(value: string) => {
              setIsWeightExercise(value === "Yes");
            }}
          />
          <CollapsibleSection label="Advanced settings">
            <MultiSelect
              label={"Supersets"}
              selected={supersets}
              options={Object.keys(sourceData.supersets ?? {})}
              onChange={setSupersets}
              placeholder="Select supersets"
            />
            <TagInput label={"Tags"} list={tags} options={[]} updateList={setTags} />
            <MultiSelect
              label={"Alternatives"}
              selected={alternatives}
              options={Object.keys(sourceData.exercises ?? {}).filter(
                (n) => n !== name
              )}
              onChange={setAlternatives}
              placeholder="Select alternative exercises"
            />
            <IncrementDecrement
              label={"Target Rep"}
              value={Number(targetRep) || 0}
              nonZero
              fullWidth
              updateValue={(v) => setTargetRep(String(v))}
            />
            <IncrementDecrement
              label={"Target Set"}
              value={Number(targetSet) || 0}
              nonZero
              fullWidth
              updateValue={(v) => setTargetSet(String(v))}
            />
            <IncrementDecrement
              label={"Rest"}
              value={Number(rest) || 0}
              unit={"s"}
              nonZero
              fullWidth
              updateValue={(v) => setRest(String(v))}
            />
          </CollapsibleSection>

          <FormButtons onCancel={handleCancel} onDelete={type === "edit" ? handleDelete : undefined} />
        </form>
      )}
    </Modal>
  );
};
