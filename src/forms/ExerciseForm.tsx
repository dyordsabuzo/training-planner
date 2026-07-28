import React, { useContext, useState } from "react";
import { Input } from "../components/form/Input";
import SourceDataContext from "../context/SourceDataContext";
import { TagInput } from "../components/others/TagInput";
import { FormButtons } from "./FormButtons";
import { ButtonSelection } from "../components/form/ButtonSelection";
import { Modal } from "../components/others/Modal";
import { DetailField } from "./DetailField";
import { EditIconButton } from "./EditIconButton";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";

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
  const [isEditing, setIsEditing] = useState(type !== "edit");
  const [name, setName] = useState(exerciseData?.name ?? "");
  const [videoLink, setVideoLink] = useState(exerciseData?.videoLink ?? "");
  const [isWeightExercise, setIsWeightExercise] = useState(
    exerciseData?.isWeightExercise ?? true
  );
  const [tags, setTags] = useState(exerciseData?.tags ?? []);
  const [targetRep, setTargetRep] = useState(exerciseData?.targetRep ?? "");
  const [targetSet, setTargetSet] = useState<string>(
    exerciseData?.targetSet ?? ""
  );
  const [rest, setRest] = useState<string>(exerciseData?.rest ?? "");
  const [supersets, setSupersets] = useState<string[]>(
    exerciseData?.supersets ?? []
  );
  const [alternatives, setAlternatives] = useState<string[]>(
    exerciseData?.alternatives ?? []
  );

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const resetFields = () => {
    setName(exerciseData?.name ?? "");
    setVideoLink(exerciseData?.videoLink ?? "");
    setIsWeightExercise(exerciseData?.isWeightExercise ?? true);
    setTags(exerciseData?.tags ?? []);
    setTargetRep(exerciseData?.targetRep ?? "");
    setTargetSet(exerciseData?.targetSet ?? "");
    setRest(exerciseData?.rest ?? "");
    setSupersets(exerciseData?.supersets ?? []);
    setAlternatives(exerciseData?.alternatives ?? []);
  };

  const handleDelete = () => {
    sourceDataContext.deleteExercise(data);
    closeForm();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
      headerAction={
        type === "edit" && !isEditing ? (
          <EditIconButton onClick={() => setIsEditing(true)} />
        ) : undefined
      }
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
            <ConfirmDeleteButton onDelete={handleDelete} />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={`flex flex-col gap-4`}>
          <Input
            label={"Exercise Name"}
            required
            value={name}
            placeholder={"Exercise name"}
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
          <TagInput
            label={"Supersets"}
            list={supersets}
            options={Object.keys(sourceData.supersets ?? {})}
            updateList={setSupersets}
          />
          <TagInput label={"Tags"} list={tags} options={[]} updateList={setTags} />

          <details className={`duration-300`}>
            <summary className="text-sm font-light text-text-light dark:text-text-dark">Advanced settings</summary>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2`}>
              <TagInput
                label={"Alternatives"}
                list={alternatives}
                options={Object.keys(sourceData.exercises ?? {})}
                updateList={setAlternatives}
                className={`sm:col-span-2 pt-2`}
              />
              <Input
                label={"Target Rep"}
                value={targetRep}
                placeholder={"Target Rep"}
                changeValue={setTargetRep}
              />
              <Input
                label={"Target Set"}
                value={targetSet}
                placeholder={"Target Set"}
                changeValue={setTargetSet}
              />
              <Input
                label={"Rest in seconds"}
                value={rest}
                placeholder={"Rest time in seconds"}
                changeValue={setRest}
              />
            </div>
          </details>

          <FormButtons
            onCancel={() => {
              if (type === "edit") {
                resetFields();
                setIsEditing(false);
              } else {
                closeForm();
              }
            }}
            onDelete={type === "edit" ? handleDelete : undefined}
          />
        </form>
      )}
    </Modal>
  );
};
