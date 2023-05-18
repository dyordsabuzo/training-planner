import Input from "../components/Input";
import React, {useContext, useReducer, useState} from "react";
import SessionContext from "../context/SessionContext";
import RestPage from "./RestPage";
import SupersetCompletePage from "./SupersetCompletePage";
import FinishPage from "./FinishPage";

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
    const [targetWeight, setTargetWeight] = useState<string>("")
    const [targetRep, setTargetRep] = useState<string>("")
    const [actualWeight, setActualWeight] = useState<string>("")
    const [actualRep, setActualRep] = useState<string>("")
    const [superset, setSuperset] = useState(0)

    const sessionContext = useContext(SessionContext)

    const [exerciseState, dispatch] = useReducer(reducer, initialState)

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const listLength = (sessionContext.sessionData as any).exerciseCombinations[superset].length
        dispatch({type: 'incrementCounter', listLength})
    }

    const handleNextSuperset = (flag: boolean) => {
        dispatch({type: 'reset'})
        setSuperset(superset + 1)
    }

    if (exerciseState.supersetComplete) {
        return (
            <div className={`flex flex-col gap-2 p-8 min-w-[30rem]`}>
                <SupersetCompletePage nextPageHandler={handleNextSuperset} superset={superset}/>
            </div>
        )
    }

    if (exerciseState.rest && exerciseState.exerciseSet > 0) {
        return (
            <div className={`flex flex-col gap-2 p-8 min-w-[30rem]`}>
                <RestPage length={2} toggleRest={(flag: boolean) => dispatch({type: 'updateRest', flag})}/>
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
                <h1>Exercise {exerciseState.exercise + 1}</h1>
                <h3>Set {exerciseState.exerciseSet + 1}</h3>
                <h3>{(sessionContext.sessionData as any).exerciseCombinations[superset][exerciseState.exercise].name}</h3>
            </div>
            <form className={`flex flex-col gap-4 p-4`} onSubmit={handleSubmit}>

                <Input label={"Target Weight"} readonly
                       value={targetWeight || (sessionContext.sessionData as any).exerciseCombinations[superset][exerciseState.exercise].targetWeight.toString()}
                       placeholder={"Weight in kg"} changeValue={setTargetWeight}/>

                <Input label={"Target Rep"} readonly
                       value={targetRep || (sessionContext.sessionData as any).exerciseCombinations[superset][exerciseState.exercise].targetRep.toString()}
                       placeholder={"Target rep"} changeValue={setTargetRep}/>

                <Input label={"Actual Weight"} required
                       value={actualWeight || (sessionContext.sessionData as any).exerciseCombinations[superset][exerciseState.exercise].targetWeight.toString()}
                       placeholder={"Weight in kg"} changeValue={setActualWeight}/>

                <Input label={"Actual Rep"} required
                       value={actualRep || (sessionContext.sessionData as any).exerciseCombinations[superset][exerciseState.exercise].targetRep.toString()}
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