import Input from "../components/Input";
import React, {useContext, useEffect, useState} from "react";
import SessionContext from "../context/SessionContext";
import {ExerciseType} from "../types/ExerciseType";
import RestPage from "./RestPage";
import SupersetCompletePage from "./SupersetCompletePage";
import FinishPage from "./FinishPage";

const ExercisePage = () => {
    const [exercise, setExercise] = useState(0)
    const [exerciseSet, setExerciseSet] = useState(1)
    const [exerciseCounter, setExerciseCounter] = useState(0)
    const [targetWeight, setTargetWeight] = useState<string>("")
    const [targetRep, setTargetRep] = useState<string>("")
    const [actualWeight, setActualWeight] = useState<string>("")
    const [actualRep, setActualRep] = useState<string>("")
    const [rest, setRest] = useState(false)
    const [superset, setSuperset] = useState(0)
    const [supersetComplete, setSupersetComplete] = useState(false)

    const sessionContext = useContext(SessionContext)

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setExerciseCounter(exerciseCounter + 1)
        const listLength = (sessionContext.sessionData as any).exerciseCombinations[superset].length
        if (exercise < listLength - 1) {
            setExercise(exercise + 1)
        } else {
            setExercise(0)
        }
    }

    useEffect(() => {
        if (exercise === 0) {
            if (exerciseSet >= 3) {
                setSupersetComplete(true)
            } else {
                if (exerciseCounter > 0) {
                    setRest(true)
                }
            }
        }
        return () => {
        }
    }, [exercise])

    useEffect(() => {
        if (rest) {
            setExerciseSet(exerciseSet + 1)
        }
        return () => {
        }
    }, [rest])

    const handleNextSuperset = (flag: boolean) => {
        setSuperset(superset + 1)
        setExercise(0)
        setExerciseSet(1)
        setRest(false)
        setSupersetComplete(false)
    }

    if (supersetComplete) {
        return (
            <div className={`flex flex-col gap-2 p-8 min-w-[30rem]`}>
                <SupersetCompletePage nextPageHandler={handleNextSuperset} superset={superset}/>
            </div>
        )
    }

    if (rest && exerciseSet > 0) {
        return (
            <div className={`flex flex-col gap-2 p-8 min-w-[30rem]`}>
                <RestPage length={2} toggleRest={(flag: boolean) => setRest(flag)}/>
            </div>
        )
    }

    if (superset > (sessionContext.sessionData as any).exerciseCombinations.length - 1) {
        return (
            <div className={`flex flex-col gap-2 p-8 min-w-[30rem]`}>
                <FinishPage/>
            </div>
        )
    }

    return (
        <div className={`flex flex-col gap-2 p-8 min-w-[30rem]`}>
            <div className={`flex flex-col gap-4 shadown-md p-4 border rounded-md`}>
                <h1>Exercise {exercise + 1}</h1>
                <h3>Set {exerciseSet}</h3>
                <h3>{(sessionContext.sessionData as any).exerciseCombinations[superset][exercise].name}</h3>
            </div>
            <form className={`flex flex-col gap-4 p-4`} onSubmit={handleSubmit}>

                <Input label={"Target Weight"} readonly
                       value={targetWeight || (sessionContext.sessionData as any).exerciseCombinations[superset][exercise].targetWeight.toString()}
                       placeholder={"Weight in kg"} changeValue={setTargetWeight}/>

                <Input label={"Target Rep"} readonly
                       value={targetRep || (sessionContext.sessionData as any).exerciseCombinations[superset][exercise].targetRep.toString()}
                       placeholder={"Target rep"} changeValue={setTargetRep}/>

                <Input label={"Actual Weight"} required
                       value={actualWeight || (sessionContext.sessionData as any).exerciseCombinations[superset][exercise].targetWeight.toString()}
                       placeholder={"Weight in kg"} changeValue={setActualWeight}/>

                <Input label={"Actual Rep"} required
                       value={actualRep || (sessionContext.sessionData as any).exerciseCombinations[superset][exercise].targetRep.toString()}
                       placeholder={"Actual rep"} changeValue={setActualRep}/>

                <button type={"submit"}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    DONE
                </button>
            </form>
        </div>
    )
}

export default ExercisePage;