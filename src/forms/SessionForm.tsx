import Input from "../components/Input";
import React, {useContext, useState} from "react";
import SourceDataContext from "../context/SourceDataContext";
import TagInput from "../components/TagInput";

type FormData = {
    id?: string
    name?: string
    tags?: string
    supersets?: string[]
}

type Props = {
    data: FormData
    type: string
    closeForm: () => void
}

const SessionForm: React.FC<Props> = ({data, type, closeForm}) => {
    // const [id, setId] = useState(data.id ?? "")
    const id = data.id ?? ""
    const [name, setName] = useState(data.name ?? "")
    const [tags, setTags] = useState(data.tags ?? "")
    const [supersets, setSupersets] = useState<string[]>(data.supersets ?? [])

    const sourceDataContext = useContext(SourceDataContext)
    const sourceData: any = sourceDataContext.sourceData

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (type === "add") {
            sourceDataContext.addSession({
                name,
                tags,
                supersets,
            })
            closeForm()
        }

        if (type === "edit") {
            sourceDataContext.editSession({
                id,
                name,
                tags,
                supersets,
            })
            closeForm()
        }
    }

    return (
        <form onSubmit={handleSubmit} className={`flex flex-col gap-4`}>
            <Input label={"Session Name"} required
                   value={name}
                   placeholder={"Exercise name"} changeValue={setName}/>
            <Input label={"Tags"}
                   value={tags}
                   placeholder={"Tags"} changeValue={setTags}/>
            <TagInput label={"Supersets"} list={supersets} options={Object.keys(sourceData.supersets ?? {})} updateList={setSupersets}/>

            <div className={`flex justify-between gap-2 py-4`}>
                <div className={`flex gap-2`}>
                    <button type={"submit"}
                            className={`text-xs bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl`}>
                        Save
                    </button>
                    <button type={"button"}
                            className={`text-xs font-bold py-2 px-4 rounded-xl border border-black`}
                            onClick={() => {
                                closeForm()
                            }}>
                        Cancel
                    </button>
                </div>
                <button type={"button"}
                        className={`text-xs bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl`}
                        onClick={() => {
                            sourceDataContext.deleteSession(name)
                            closeForm()
                        }}>
                    Delete
                </button>
            </div>

        </form>
    )
}

export default SessionForm