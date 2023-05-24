import React, {useContext, useState} from "react";
import SourceDataContext from "../context/SourceDataContext";
import Input from "../components/Input";
import AlertModal from "../modal/AlertModal";

const SessionListing = () => {
    const [isAdd, setIsAdd] = useState<boolean>(false)
    const [isEdit, setIsEdit] = useState<boolean>(false)
    const [exerciseId, setExerciseId] = useState<string>("")
    const [exerciseName, setExerciseName] = useState<string>("")
    const [videoLink, setVideoLink] = useState<string>("")
    const [tags, setTags] = useState<string>("")
    const [targetRep, setTargetRep] = useState<string>("")
    const [supersets, setSupersets] = useState<string>("")
    const sourceDataContext = useContext(SourceDataContext)

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (isAdd) {
            sourceDataContext.addExercise({
                name: exerciseName,
                videoLink,
                tags,
                targetRep,
                supersets,
                targetWeight: 0,
            })
            setIsAdd(false)
        }

        if (isEdit) {
            sourceDataContext.editExercise({
                exercise: exerciseId,
                name: exerciseName,
                videoLink,
                tags,
                targetRep,
                supersets,
                targetWeight: 0,
            })
            setIsEdit(false)
        }
    }

    const resetForm = () => {
        setExerciseName("")
        setVideoLink("")
        setTags("")
        setTargetRep("")
        setSupersets("")
        setIsAdd(true)
    }

    if (isAdd || isEdit) {
        return (
            <form onSubmit={handleSubmit} className={`flex flex-col gap-4`}>
                <Input label={"Exercise Name"} required
                       value={exerciseName}
                       placeholder={"Exercise name"} changeValue={setExerciseName}/>
                <Input label={"Video link"}
                       value={videoLink}
                       placeholder={"Video link"} changeValue={setVideoLink}/>
                <Input label={"Tags"}
                       value={tags}
                       placeholder={"Tags"} changeValue={setTags}/>
                <Input label={"Target Rep"}
                       value={targetRep}
                       placeholder={"Target Rep"} changeValue={setTargetRep}/>
                <Input label={"Supersets"}
                       value={supersets}
                       placeholder={"Supersets"} changeValue={setSupersets}/>
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
                        className={`text-sm hover:bg-green-700 hover:text-white text-green-700 font-bold p-2 rounded-md`}
                        onClick={() => resetForm()}>+ Add Session
                </button>
            </div>
            <>
                {Object.entries((sourceDataContext.sourceData as any).sessions).map(([key, value]) => (
                    <div key={key}
                         className={`border border-1 border-blue-200 p-4 rounded-md text-sm cursor-pointer`}
                         onClick={() => {
                             setExerciseId((value as any).exercise)
                             setExerciseName((value as any).name)
                             setVideoLink((value as any).videoLink)
                             setTargetRep((value as any).targetRep)
                             setTags((value as any).tags)
                             setSupersets((value as any).supersets)
                             setIsEdit(true)
                         }}>
                        <span className={`font-bold`}>{key}</span>
                        <>
                            {(value as any).supersets.map((e: string) => (
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

export default SessionListing