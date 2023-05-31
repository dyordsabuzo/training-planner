import Input from "../components/Input";
import React, {useContext, useEffect, useReducer, useState} from "react";
import SessionContext from "../context/SessionContext";
import RestPage from "./RestPage";
import SupersetCompletePage from "./SupersetCompletePage";
import FinishPage from "./FinishPage";
import WrapperPage from "./WrapperPage";
// import sessionPage from "./SessionPage";

type State = {
    counter: number
    exercise: number
    exerciseSet: number
    rest: boolean
    supersetCounter: number
    supersetComplete: boolean
}

type Action = { type: 'reset' }
    | { type: 'update', payload: any }
    | { type: 'updateRest', flag: boolean }
    | { type: 'incrementCounter', listLength: number, totalSet: number }

const initialState = {
    counter: 0,
    exercise: 0,
    exerciseSet: 0,
    rest: false,
    supersetCounter: 0,
    supersetComplete: false
}

const reducer = (state: State, action: Action) => {
    switch (action.type) {
        case "reset":
            return {
                ...initialState,
                counter: state.counter,
                supersetCounter: state.supersetCounter
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
            const totalSet = action.totalSet
            const listLength = action.listLength
            const counter = state.counter + 1
            const exercise = counter % listLength
            const exerciseSet = (exercise === 0) ? state.exerciseSet + 1 : state.exerciseSet
            const rest = (exercise === 0 && counter > 0 && exerciseSet < totalSet)

            const supersetComplete = (exerciseSet === totalSet)
            const supersetCounter = supersetComplete ? state.supersetCounter + 1 : state.supersetCounter

            console.log(exerciseSet, totalSet, supersetCounter)
            return {
                ...state,
                counter,
                exercise,
                exerciseSet,
                rest,
                supersetCounter,
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
        dispatch({
            type: 'incrementCounter',
            listLength: supersetData.exercises.length,
            totalSet: parseInt(sessionData.targetSet)
        })
    }

    useEffect(() => {
        setExerciseData(supersetData.exercises[exerciseState.exercise])
        return () => {
        }
    }, [exerciseState.exercise, supersetData.exercises])

    useEffect(() => {
        console.log(exerciseState.supersetCounter)
        if (exerciseState.supersetCounter < Object.keys(sessionData.supersets).length) {
            setSupersetData(Object.values(sessionData.supersets)[exerciseState.supersetCounter])
        }
        return () => {
        }
    }, [exerciseState.supersetCounter, sessionData.supersets])

    const handleNextSuperset = (flag: boolean) => {
        console.log(`handle next superset`)
        dispatch({type: 'reset'})
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
                <RestPage length={parseInt(supersetData.rest) || 10}
                          toggleRest={(flag: boolean) => dispatch({type: 'updateRest', flag})}/>
            </div>
        )
    }

    if (exerciseState.supersetCounter >= Object.keys(sessionData.supersets).length) {
        return (
            <div className={`flex flex-col gap-2 p-8 min-w-[30rem]`}>
                <FinishPage/>
            </div>
        )
    }


    return (
        <WrapperPage>
            <div className={`w-full flex flex-col gap-4 shadown-md p-4 border rounded-md`}>
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
                    {exerciseData.name}
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
        </WrapperPage>
    )
}

export default ExercisePage;