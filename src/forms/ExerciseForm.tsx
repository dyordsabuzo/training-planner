import Input from "../components/Input";
import React, {useContext, useState} from "react";
import SourceDataContext from "../context/SourceDataContext";
import TagInput from "../components/TagInput";

type FormData = {
    id?: string
    name?: string
    videoLink?: string
    tags?: string
    targetRep?: string
    targetSet?: string
    rest?: string
    supersets?: string[]
}

type Props = {
    data: FormData
    type: string
    closeForm: () => void
}

const ExerciseForm: React.FC<Props> = ({data, type, closeForm}) => {
    // const [id, setId] = useState(data.id ?? "")
    const id = data.id ?? ""
    const [name, setName] = useState(data.name ?? "")
    const [videoLink, setVideoLink] = useState(data.videoLink ?? "")
    const [tags, setTags] = useState(data.tags ?? "")
    const [targetRep, setTargetRep] = useState(data.targetRep ?? "")
    const [targetSet, setTargetSet] = useState<string>(data.targetSet ?? "")
    const [rest, setRest] = useState<string>(data.rest ?? "")
    const [supersets, setSupersets] = useState<string[]>(data.supersets ?? [])

    const sourceDataContext = useContext(SourceDataContext)
    const sourceData: any = sourceDataContext.sourceData

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (type === "add") {
            sourceDataContext.addExercise({
                name,
                videoLink,
                tags,
                targetRep,
                targetSet,
                rest,
                supersets,
                targetWeight: 0,
            })
            closeForm()
        }

        if (type === "edit") {
            sourceDataContext.editExercise({
                id,
                name,
                videoLink,
                tags,
                targetRep,
                targetSet,
                rest,
                supersets,
                targetWeight: 0,
            })
            closeForm()
        }
    }

    return (
        <form onSubmit={handleSubmit} className={`flex flex-col gap-4`}>
            <Input label={"Exercise Name"} required
                   value={name}
                   placeholder={"Exercise name"} changeValue={setName}/>
            <Input label={"Video link"}
                   value={videoLink}
                   placeholder={"Video link"} changeValue={setVideoLink}/>
            <Input label={"Tags"}
                   value={tags}
                   placeholder={"Tags"} changeValue={setTags}/>
            <Input label={"Target Rep"}
                   value={targetRep}
                   placeholder={"Target Rep"} changeValue={setTargetRep}/>
            <Input label={"Target Set"}
                   value={targetSet}
                   placeholder={"Target Set"} changeValue={setTargetSet}/>
            <Input label={"Rest in seconds"}
                   value={rest}
                   placeholder={"Rest time in seconds"} changeValue={setRest}/>
            {/*<Input label={"Supersets"}*/}
            {/*       value={supersets}*/}
            {/*       placeholder={"Supersets"} changeValue={setSupersets}/>*/}
            <TagInput label={"Supersets"} list={supersets} options={Object.keys(sourceData.supersets)}
                      updateList={setSupersets}/>


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
                            sourceDataContext.deleteExercise(name)
                            closeForm()
                        }}>
                    Delete
                </button>
            </div>

        </form>
    )
}

export default ExerciseForm