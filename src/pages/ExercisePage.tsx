import Input from "../components/Input";
import React, {useContext, useEffect, useReducer, useState} from "react";
import SessionContext from "../context/SessionContext";
import RestPage from "./RestPage";
import SupersetCompletePage from "./SupersetCompletePage";
// import FinishPage from "./FinishPage";
// import sessionPage from "./SessionPage";

type State = {
    counter: number
    exercise: number
    exerciseSet: number
    rest: boolean
    supersetComplete: boolean
}

type Action = { type: 'reset' }
    | { type: 'update', payload: any }
    | { type: 'updateRest', flag: boolean }
    | { type: 'incrementCounter', listLength: number }

const initialState = {
    counter: 0,
    exercise: 0,
    exerciseSet: 0,
    rest: false,
    supersetComplete: false
}

const reducer = (state: State, action: Action) => {
    switch (action.type) {
        case "reset":
            return {
                ...initialState,
                counter: state.counter
            }
        case 'update':
            return {
                ...state,
                ...action.payload
            }
        case 'updateRest':
            return {
                ...state,
                rest: action.flag
            }
        case 'incrementCounter':
            const totalSet = 3
            const listLength = action.listLength
            const counter = state.counter + 1
            const exercise = counter % listLength
            const exerciseSet = (exercise === 0) ? state.exerciseSet + 1 : state.exerciseSet
            const rest = (exercise === 0 && counter > 0 && exerciseSet < totalSet)
            const supersetComplete = (exerciseSet === totalSet)

            return {
                ...state,
                counter,
                exercise,
                exerciseSet,
                rest,
                supersetComplete
            }
        default:
            return state
    }
}

const ExercisePage = () => {
    const sessionContext = useContext(SessionContext)
    const sessionData: any = sessionContext.sessionData

    const [exerciseState, dispatch] = useReducer(reducer, initialState)
    const [supersetData, setSupersetData] = useState<any>(
        Object.values(sessionData.supersets)[0]
    )
    const [exerciseData, setExerciseData] = useState<any>(
        supersetData.exercises[0]
    )
    const [targetRep, setTargetRep] = useState(
        exerciseData.targetRep || sessionData.targetRep
    )

    const [targetWeight, setTargetWeight] = useState<string>("")
    const [actualWeight, setActualWeight] = useState<string>("")
    const [actualRep, setActualRep] = useState<string>(targetRep)

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        dispatch({type: 'incrementCounter', listLength: supersetData.exercises.length})
    }

    useEffect(() => {
        setExerciseData(supersetData.exercises[exerciseState.exercise])
        return () => {
        }
    }, [exerciseState.exercise, supersetData.exercises])

    const handleNextSuperset = (flag: boolean) => {
        dispatch({type: 'reset'})
        setSupersetData(Object.values(sessionData.supersets)[exerciseState.exerciseSet])
    }

    if (exerciseState.supersetComplete) {
        return (
            <div className={`flex flex-col gap-2 p-8 min-w-[30rem]`}>
                <SupersetCompletePage nextPageHandler={handleNextSuperset} superset={supersetData.name}/>
            </div>
        )
    }

    if (exerciseState.rest && exerciseState.exerciseSet > 0) {
        return (
            <div className={`flex flex-col gap-2 p-8 min-w-[30rem]`}>
                <RestPage length={supersetData.rest ?? exerciseData.rest ?? 60}
                          toggleRest={(flag: boolean) => dispatch({type: 'updateRest', flag})}/>
            </div>
        )
    }

    // if (superset > (sessionContext.sessionData as any).exerciseCombinations.length - 1) {
    //     return (
    //         <div className={`flex flex-col gap-2 p-8 min-w-[30rem]`}>
    //             <FinishPage/>
    //         </div>
    //     )
    // }

    return (
        <div className={`flex flex-col gap-2 p-8 min-w-[30rem]`}>
            <div className={`flex flex-col gap-4 shadown-md p-4 border rounded-md`}>
                <div className={`flex gap-1`}>
                <span className={`text-xs bg-green-500 hover:bg-green-700 text-white font-bold 
                                py-2 px-4 rounded-xl`}>
                    {/*Set {exerciseState.exerciseSet + 1}*/}
                    {supersetData.name}
                </span>
                    <span className={`text-xs bg-blue-500 hover:bg-blue-700 text-white font-bold 
                                py-2 px-4 rounded-xl`}>
                    Exercise {exerciseState.exercise + 1}
                </span>
                </div>
                <span className={`text-xl px-2`}>
                        {/*{supersetData.exercises[exerciseState.exercise].name}*/}
                    {exerciseData.name}
                    {/*{sessionData.exerciseCombinations[superset][exerciseState.exercise].name}*/}
                </span>
            </div>
            <form className={`flex flex-col gap-4 p-4`} onSubmit={handleSubmit}>

                <div className={`flex gap-2`}>
                    <Input label={"Target Weight"} readonly
                        // value={targetWeight || (sessionContext.sessionData as any).exerciseCombinations[superset][exerciseState.exercise].targetWeight.toString()}
                           value={targetWeight || '0'}
                           placeholder={"Weight in kg"} changeValue={setTargetWeight}/>

                    <Input label={"Target Rep"} readonly
                           value={targetRep}
                           placeholder={"Target rep"} changeValue={setTargetRep}/>
                </div>

                <div className={`flex gap-2`}>
                    <Input label={"Actual Weight"} required
                        // value={actualWeight || (sessionContext.sessionData as any).exerciseCombinations[superset][exerciseState.exercise].targetWeight.toString()}
                           value={actualWeight || '0'}
                           placeholder={"Weight in kg"} changeValue={setActualWeight}/>

                    <Input label={"Actual Rep"} required
                        // value={actualRep || (sessionContext.sessionData as any).exerciseCombinations[superset][exerciseState.exercise].targetRep.toString()}
                           value={actualRep || '0'}
                           placeholder={"Actual rep"} changeValue={setActualRep}/>
                </div>

                <button type={"submit"}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    DONE
                </button>
            </form>
        </div>
    )
}

export default ExercisePage;