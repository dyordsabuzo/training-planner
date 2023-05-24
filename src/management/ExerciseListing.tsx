import React, {useContext, useState} from "react";
import SourceDataContext from "../context/SourceDataContext";
import Input from "../components/Input";
// import AlertModal from "../modal/AlertModal";

const ExerciseListing = () => {
    const [isAdd, setIsAdd] = useState<boolean>(false)
    const [isEdit, setIsEdit] = useState<boolean>(false)
    const [exerciseId, setExerciseId] = useState<string>("")
    const [exerciseName, setExerciseName] = useState<string>("")
    const [videoLink, setVideoLink] = useState<string>("")
    const [tags, setTags] = useState<string>("")
    const [targetRep, setTargetRep] = useState<string>("")
    const [targetSet, setTargetSet] = useState<string>("")
    const [rest, setRest] = useState<string>("")
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
                targetSet,
                rest,
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
                targetSet,
                rest,
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
        setTargetSet("")
        setRest("")
        setSupersets("")
        setIsAdd(true)
    }

    if (isAdd || isEdit) {
        return (
            <form onSubmit={handleSubmit} className={`flex flex-col gap-4`}>
                <Input label={"Exercise Name"} required
                       value={exerciseName} readonly={isAdd}
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
                <Input label={"Target Set"}
                       value={targetSet}
                       placeholder={"Target Set"} changeValue={setTargetSet}/>
                <Input label={"Rest in seconds"}
                       value={rest}
                       placeholder={"Rest time in seconds"} changeValue={setRest}/>
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
            {/*<AlertModal/>*/}
            <div className={`flex place-content-end`}>
                <button type={"button"}
                        className={`text-sm hover:bg-green-700 hover:text-white text-green-700 font-bold py-2 px-4 rounded-md`}
                        onClick={() => resetForm()}>+ Add Exercise
                </button>
            </div>
            <>
                {Object.entries((sourceDataContext.sourceData as any).exercises)
                    .sort((a,b) => (b as any)[0] - (a as any)[0])
                    .map(([key, value]) => (
                    <div key={key}
                         className={`border border-1 border-blue-200 p-4 rounded-md text-sm cursor-pointer`}
                         onClick={() => {
                             setExerciseId((value as any).exercise)
                             setExerciseName((value as any).name)
                             setVideoLink((value as any).videoLink)
                             setTargetRep((value as any).targetRep)
                             setTargetSet((value as any).targetSet)
                             setRest((value as any).rest)
                             setTags((value as any).tags)
                             setSupersets((value as any).supersets)
                             setIsEdit(true)
                         }}>
                        {key}
                    </div>
                ))}
            </>

        </div>
    )
}

export default ExerciseListing