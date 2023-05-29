import React, {useContext, useState} from "react";
import SourceDataContext from "../context/SourceDataContext";
import Input from "../components/Input";

const SupersetListing = () => {
    const [isAdd, setIsAdd] = useState<boolean>(false)
    const [isEdit, setIsEdit] = useState<boolean>(false)
    const [supersetName, setSupersetName] = useState<string>("")
    const [session, setSession] = useState<string>("")
    const [exercises, setExercises] = useState<string[]>([])
    const [rest, setRest] = useState<string>("")
    const [tags, setTags] = useState<string>("")
    const sourceDataContext = useContext(SourceDataContext)

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (isAdd) {
            sourceDataContext.addSuperset({
                name: supersetName,
                session,
                exercises,
                rest,
                tags,
            })
            setIsAdd(false)
        }

        if (isEdit) {
            sourceDataContext.editSuperset({
                name: supersetName,
                session,
                exercises,
                rest,
                tags,
            })
            setIsEdit(false)
        }
    }

    const resetForm = () => {
        setSupersetName("")
        setSession("")
        setTags("")
        setRest("")
        setExercises([])
        setIsAdd(true)
    }

    if (isAdd || isEdit) {
        return (
            <form onSubmit={handleSubmit} className={`flex flex-col gap-4`}>
                <Input label={"Superset Name"} required
                       value={supersetName}
                       placeholder={"Exercise name"} changeValue={setSupersetName}/>
                <Input label={"Tags"}
                       value={tags}
                       placeholder={"Tags"} changeValue={setTags}/>
                <Input label={"Linked to session"}
                       value={session}
                       placeholder={"Session name"} changeValue={setSession}/>
                <Input label={"Exercises"}
                       value={exercises.join(",")}
                       placeholder={"Exercises"} changeValue={(value) => setExercises(value.split(","))}/>
                <Input label={"Rest time in seconds"}
                       value={rest}
                       placeholder={"Rest time in seconds"} changeValue={setRest}/>
                <div className={`flex gap-2 py-4`}>
                    <button type={"submit"}
                            className={`text-xs bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl`}>
                        Save
                    </button>
                    <button type={"button"}
                            className={`text-xs font-bold py-2 px-4 rounded-xl border border-black`}
                            onClick={() => {
                                setIsAdd(false)
                                setIsEdit(false)
                            }}>
                        Cancel
                    </button>
                </div>
            </form>
        )
    }

    return (
        <div className={`flex flex-col gap-4`}>
            <div className={`flex place-content-end`}>
                <button type={"button"}
                        className={`text-sm hover:bg-blue-700 hover:text-white text-blue-700 font-bold py-2 px-4 rounded-md`}
                        onClick={() => resetForm()}>+ Add Superset
                </button>
            </div>

            <>
                {Object.entries((sourceDataContext.sourceData as any).supersets ?? {})
                    .map(([key, value]) => (
                        <div key={key}
                             className={`flex flex-col border border-1 border-blue-200 p-4 rounded-md text-sm cursor-pointer`}
                             onClick={(e) => {
                                 e.preventDefault()
                                 setSupersetName((value as any).name)
                                 setSession((value as any).session)
                                 setExercises((value as any).exercises)
                                 setRest((value as any).rest)
                                 setTags((value as any).tags)
                                 setIsEdit(true)
                             }}>
                            <span className={`font-bold`}>{(value as any).name}</span>
                            <>
                                {(value as any).exercises.map((e: any) => (
                                    <div className={`text-xs`}
                                         key={e}>
                                        {e}
                                    </div>
                                ))}
                            </>
                        </div>
                    ))}
            </>

        </div>
    )
}

export default SupersetListing