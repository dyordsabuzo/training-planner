import React, { useContext, useState } from "react";
import { Input } from "../components/form/Input";
import SourceDataContext from "../context/SourceDataContext";
import { TagInput } from "../components/others/TagInput";
import { FormButtons } from "./FormButtons";

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
  const [videoLink, setVideoLink] = useState(exerciseData?.videoLink ?? "");
  const [tags, setTags] = useState(exerciseData?.tags ?? []);
  const [targetRep, setTargetRep] = useState(exerciseData?.targetRep ?? "");
  const [targetSet, setTargetSet] = useState<string>(
    exerciseData?.targetSet ?? ""
  );
  // const [isTimeBased, setIsTimeBased] = useState<boolean>(
  //   exerciseData?.isTimeBased ?? false
  // );
  const [rest, setRest] = useState<string>(exerciseData?.rest ?? "");
  const [supersets, setSupersets] = useState<string[]>(
    exerciseData?.supersets ?? []
  );
  const [alternatives, setAlternatives] = useState<string[]>(
    exerciseData?.alternatives ?? []
  );

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

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
        // isTimeBased,
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
        // isTimeBased,
      });
      closeForm();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-4 px-2`}>
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
      {/* <Toggle
        label="Is this exercise time based?"
        value={isTimeBased}
        toggle={setIsTimeBased}
      /> */}
      <TagInput
        label={"Supersets"}
        list={supersets}
        options={Object.keys(sourceData.supersets ?? {})}
        updateList={setSupersets}
      />
      {/* <Input
        label={"Tags"}
        value={tags}
        placeholder={"Tags"}
        changeValue={setTags}
      /> */}
      <TagInput label={"Tags"} list={tags} options={[]} updateList={setTags} />

      <details className={`duration-300`}>
        <summary className={`text-sm font-light`}>Advanced settings</summary>
        <div className={`grid grid-cols-2 gap-3 pt-2`}>
          <TagInput
            label={"Alternatives"}
            list={alternatives}
            options={Object.keys(sourceData.exercises ?? {})}
            updateList={setAlternatives}
            className={`col-span-2 pt-2`}
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
          closeForm();
        }}
        onDelete={() => {
          sourceDataContext.deleteExercise(data);
          closeForm();
        }}
      />
    </form>
  );
};
