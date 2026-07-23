import { Input } from "../components/form/Input";
import React, { useContext, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";
import { TagInput } from "../components/others/TagInput";
import { FormButtons } from "./FormButtons";

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

  // const [id, setId] = useState(data.id ?? "")
  const id = formData?.id;
  const [name, setName] = useState(formData?.name ?? "");
  const [tags, setTags] = useState(formData?.tags ?? []);
  const [supersets, setSupersets] = useState<string[]>(
    formData?.supersets ?? []
  );

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
      closeForm();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-4`}>
      <Input
        label={"Session Name"}
        required
        value={name}
        placeholder={"Exercise name"}
        changeValue={setName}
      />
      <TagInput
        label={"Tags"}
        list={tags}
        options={Object.keys(sourceData.tags ?? {})}
        updateList={setTags}
      />
      <TagInput
        label={"Supersets"}
        list={supersets}
        options={Object.keys(sourceData.supersets ?? {})}
        updateList={setSupersets}
      />

      <FormButtons
        onCancel={() => {
          closeForm();
        }}
        onDelete={() => {
          sourceDataContext.deleteSession(data);
          closeForm();
        }}
      />
    </form>
  );
};
