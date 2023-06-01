import Input from "../components/Input";
import React, {useContext, useState} from "react";
import SourceDataContext from "../context/SourceDataContext";
import TagInput from "../components/TagInput";

type FormData = {
    id?: string
    name?: string
    sessions?: string[]
    tags?: string
    exercises?: []
    rest?: string
}

type Props = {
    data: FormData
    type: string
    closeForm: () => void
}

const SupersetForm: React.FC<Props> = ({data, type, closeForm}) => {
    // const [id, setId] = useState(data.id ?? "")
    const id = data.id ?? ""
    const [name, setName] = useState(data.name ?? "")
    const [sessions, setSessions] = useState<string[]>(data.sessions ?? [])
    const [exercises, setExercises] = useState<string[]>(data.exercises ?? [])
    const [rest, setRest] = useState<string>(data.rest ?? "")
    const [tags, setTags] = useState(data.tags ?? "")

    const sourceDataContext = useContext(SourceDataContext)
    const sourceData: any = sourceDataContext.sourceData
    const exerciseOptions = Object.keys(sourceData.exercises ?? {})
    const sessionOptions = Object.keys(sourceData.sessions ?? {})

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        console.log('Form submitted')

        if (type === "add") {
            sourceDataContext.addSuperset({
                name,
                sessions,
                exercises,
                tags,
                rest,
            })
            closeForm()
        }

        if (type === "edit") {
            sourceDataContext.editSuperset({
                id,
                name,
                sessions,
                exercises,
                tags,
                rest,
            })
            closeForm()
        }
    }

    return (
        <form onSubmit={handleSubmit} className={`flex flex-col gap-4`}>
            <Input label={"Superset Name"} required
                   value={name}
                   placeholder={"Exercise name"} changeValue={setName}/>
            <Input label={"Tags"}
                   value={tags}
                   placeholder={"Tags"} changeValue={setTags}/>
            <TagInput key={"sessions"} label={"Linked sessions"} list={sessions} options={sessionOptions}
                      updateList={setSessions}/>
            <Input label={"Rest time in seconds"}
                   value={rest}
                   placeholder={"Rest time in seconds"} changeValue={setRest}/>
            <TagInput key={"exercises"} label={"Exercises"} list={exercises} options={exerciseOptions}
                      updateList={setExercises}/>

            {/*<Input label={"Exercises"}*/}
            {/*       value={exercises.join(",")}*/}
            {/*       placeholder={"Exercises"} changeValue={(value) => setExercises(value.split(","))}/>*/}

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
                            sourceDataContext.deleteSuperset(data)
                            closeForm()
                        }}>
                    Delete
                </button>
            </div>
        </form>
    )
}

export default SupersetForm