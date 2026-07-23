import { Input } from "../components/form/Input";
import React, { useContext, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";
import { TagInput } from "../components/others/TagInput";
import { FormButtons } from "./FormButtons";
import { ButtonSelection } from "../components/form/ButtonSelection";

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
  const [sessions, setSessions] = useState<string[]>(formData?.sessions ?? []);
  const [exercises, setExercises] = useState<string[]>(
    formData?.exercises ?? []
  );

  const [exerciseCombo, setExerciseCombo] = useState<any>([]);

  const [rest, setRest] = useState<string>(formData?.rest ?? "");
  const [tags, setTags] = useState(formData?.tags ?? []);
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
      closeForm();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-4`}>
      <Input
        label={"Superset Name"}
        required
        value={name}
        placeholder={"Exercise name"}
        changeValue={setName}
      />
      {/* <TagInput
        key={"exercises"}
        label={"Exercises"}
        list={exercises}
        options={exerciseOptions}
        updateList={setExercises}
      /> */}
      <div className={`flex flex-col`}>
        <label>Exercises</label>
        <div className={`flex gap-1 py-1`}>
          <TagInput
            key={"exercises"}
            list={exercises}
            placeholder="Select main exercise"
            options={exerciseOptions}
            updateList={(e) => {
              // setExercises
              if (exerciseCombo.length > 0) {
                console.log("superset form");
              }
            }}
            className={`flex grow`}
          />
          <TagInput
            key={"exercises"}
            list={exercises}
            placeholder="Select alternatives"
            options={exerciseOptions}
            updateList={setExercises}
            className={`flex grow`}
          />
        </div>
        <div className={`flex gap-1 py-1`}>
          <TagInput
            key={"exercises"}
            list={exercises}
            placeholder="Select main exercise"
            options={exerciseOptions}
            updateList={setExercises}
            className={`flex grow`}
          />
          <TagInput
            key={"exercises"}
            list={exercises}
            placeholder="Select alternatives"
            options={exerciseOptions}
            updateList={setExercises}
            className={`flex grow`}
          />
        </div>
      </div>
      <ButtonSelection
        label="Superset type"
        options={["Rep-based", "Time-based"]}
        selection={type}
        onSelect={(value: string) => {
          console.log(value);
          setType(value);
        }}
      />
      <TagInput
        key={"sessions"}
        label={"Linked sessions"}
        list={sessions}
        options={sessionOptions}
        updateList={setSessions}
      />
      <Input
        label={"Rest time in seconds"}
        value={rest}
        placeholder={"Rest time in seconds"}
        changeValue={setRest}
      />
      <TagInput
        key={"tags"}
        label={"Tags"}
        list={tags}
        options={[]}
        updateList={setTags}
      />

      <details className={`duration-300`}>
        <summary className={`text-sm font-semibold cursor-pointer py-2`}>
          Advanced settings
        </summary>
        <div className={`grid grid-cols-2 gap-3 pt-2`}>
          {type === "Rep-based" && (
            <Input
              label={"Target Rep"}
              value={targetRep}
              placeholder={"Target Rep"}
              changeValue={setTargetRep}
            />
          )}
          {type === "Time-based" && (
            <Input
              label={"Target Time (in seconds)"}
              value={targetTime}
              placeholder={"Target Time"}
              changeValue={setTargetTime}
            />
          )}
          <Input
            label={"Target Set"}
            value={targetSet}
            placeholder={"Target Set"}
            changeValue={setTargetSet}
          />
        </div>
      </details>

      <FormButtons
        onCancel={() => {
          closeForm();
        }}
        onDelete={() => {
          sourceDataContext.deleteSuperset(data);
          closeForm();
        }}
      />
    </form>
  );
};
