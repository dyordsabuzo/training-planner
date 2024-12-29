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
  const [rest, setRest] = useState<string>(formData?.rest ?? "");
  const [tags, setTags] = useState(formData?.tags ?? []);
  const [type, setType] = useState<string>(formData?.type ?? "Rep-based");

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
      <TagInput
        key={"exercises"}
        label={"Exercises"}
        list={exercises}
        options={exerciseOptions}
        updateList={setExercises}
      />
      <ButtonSelection
        label="Superset type"
        options={["Rep-based", "Time-based"]}
        selection={type}
        onSelect={(value: string) => {
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
