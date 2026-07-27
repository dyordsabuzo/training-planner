import { Input } from "../components/form/Input";
import React, { useContext, useState } from "react";
import SourceDataContext from "../context/SourceDataContext";
import { TagInput } from "../components/others/TagInput";
import { FormButtons } from "./FormButtons";
import { Modal } from "../components/others/Modal";
import { DetailField } from "./DetailField";
import { EditIconButton } from "./EditIconButton";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";

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
  const [isEditing, setIsEditing] = useState(type !== "edit");
  const [name, setName] = useState(formData?.name ?? "");
  const [tags, setTags] = useState(formData?.tags ?? []);
  const [supersets, setSupersets] = useState<string[]>(
    formData?.supersets ?? []
  );

  const sourceDataContext = useContext(SourceDataContext);
  const sourceData: any = sourceDataContext.sourceData;

  const resetFields = () => {
    setName(formData?.name ?? "");
    setTags(formData?.tags ?? []);
    setSupersets(formData?.supersets ?? []);
  };

  const handleDelete = () => {
    sourceDataContext.deleteSession(data);
    closeForm();
  };

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
      setIsEditing(false);
    }
  };

  return (
    <Modal
      title={type === "add" ? "Add session" : "Session"}
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
          <DetailField label="Session name" value={name} />
          <DetailField label="Tags" tags={tags} />
          <DetailField label="Supersets" tags={supersets} />
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <ConfirmDeleteButton onDelete={handleDelete} />
          </div>
        </div>
      ) : (
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
