import React, { useContext, useRef, useState } from "react";

import SourceDataContext from "../context/SourceDataContext";

import { FormButtons } from "./FormButtons";

import { findDuplicateName } from "../common/nameValidation";
import { toStringArray } from "../common/utils";
import { Input, MultiSelect, IncrementDecrement, CollapsibleSection, TagInput, ButtonSelection, Modal } from "@dyordsabuzo/ui-components";

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
  const tagFieldRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (findDuplicateName(sourceData.exercises, name, id)) {
      setNameError("An exercise with this name already exists.");
      return;
    }
    setNameError(undefined);

    // TagInput only commits a tag on Enter/Tab/comma, so text still typed in
    // its box would be lost on Save. Pick it up here.
    const pendingTag = tagFieldRef.current?.querySelector("input")?.value.trim() ?? "";
    const finalTags = pendingTag && !tags.includes(pendingTag) ? [...tags, pendingTag] : tags;

    if (type === "add") {
      sourceDataContext.addExercise({
        name,
        videoLink,
        tags: finalTags,
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
        tags: finalTags,
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
  };

  return (
    <Modal
      title={type === "add" ? "Add exercise" : "Exercise"}
      isOpen={true}
      onClose={closeForm}
    >
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

          <CollapsibleSection label="Advanced settings">
            <MultiSelect
              label={"Supersets"}
              selected={supersets}
              options={Object.keys(sourceData.supersets ?? {})}
              onChange={setSupersets}
              placeholder="Select supersets"
            />
            <div ref={tagFieldRef}>
              <TagInput label={"Tags"} list={tags} options={[]} updateList={setTags} />
            </div>
            <MultiSelect
              label={"Alternatives"}
              selected={alternatives}
              options={Object.keys(sourceData.exercises ?? {}).filter(
                (n) => n !== name
              )}
              onChange={setAlternatives}
              placeholder="Select alternative exercises"
            />
          </CollapsibleSection>

          <FormButtons onCancel={closeForm} />
        </form>
    </Modal>
  );
};
