import Input from "../components/Input";
import React, {useContext, useEffect, useReducer, useState} from "react";
import SessionContext from "../context/SessionContext";
import RestPage from "./RestPage";
import SupersetCompletePage from "./SupersetCompletePage";
import FinishPage from "./FinishPage";
import WrapperPage from "./WrapperPage";
import Widget from "../components/Widget";

type State = {
    exerciseCounter: number
    exerciseSet: number
    supersetCounter: number
    supersetRest: boolean
    supersetComplete: boolean
}

type Action = { type: 'reset' }
    | { type: 'update', payload: any }
    | { type: 'continue', payload?: any }

const initialState = {
    exerciseCounter: 0,
    exerciseSet: 0,
    supersetCounter: 0,
    supersetRest: false,
    supersetComplete: false
}

const reducer = (state: State, action: Action) => {
    switch (action.type) {
        case "reset":
            return {
                ...initialState,
                supersetCounter: state.supersetCounter + 1
            }
        case 'update':
            return {
                ...state,
                ...action.payload
            }
        case 'continue':
            const exerciseCounter = state.exerciseCounter + 1
            let {exerciseSet, supersetRest, supersetComplete} = state

            if (exerciseCounter % action.payload.exerciseLength === 0) {
                exerciseSet++
                supersetRest = true
            }

            supersetComplete = (exerciseSet >= action.payload.targetSet)

            return {
                ...state,
                ...action.payload,
                exerciseSet,
                exerciseCounter,
                supersetRest,
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

    const [supersetData, setSupersetData] = useState<any>({})
    const [exerciseData, setExerciseData] = useState<any>({})

    const [actualWeight, setActualWeight] = useState<string>("")
    const [actualRep, setActualRep] = useState<string>("")

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const targetSet = parseInt(supersetData.targetSet)
        const exerciseLength = supersetData.exercises.length

        dispatch({
            type: 'continue',
            payload: {
                targetSet,
                exerciseLength,
            }
        })
    }

    useEffect(() => {
        if (supersetData && Object.keys(supersetData).length) {
            const exerciseLength = supersetData.exercises.length
            const exercise = supersetData.exercises[exerciseState.exerciseCounter % exerciseLength]
            setExerciseData(exercise)
        }

        return () => {
        }
    }, [exerciseState.exerciseCounter, supersetData])

    useEffect(() => {
        const superset: any = Object.values(sessionData.supersets)[exerciseState.supersetCounter]
        if (superset) {
            setActualRep(superset.targetRep)
            setSupersetData(superset)

        }

        return () => {
        }
    }, [exerciseState.supersetCounter, sessionData])

    if (exerciseState.supersetCounter >= Object.keys(sessionData.supersets).length) {
        return (
            <FinishPage wrapSession={() => {
                sessionContext.wrapSession()
            }}/>
        )
    }

    if (exerciseState.supersetComplete) {
        return (
            <SupersetCompletePage superset={supersetData.name}
                                  nextPageHandler={(flag) => dispatch({type: 'reset'})}/>
        )
    }

    if (exerciseState.supersetRest) {
        return (
            <RestPage length={parseInt(supersetData.rest)}
                      toggleRest={(supersetRest: boolean) => {
                          dispatch({
                              type: 'update',
                              payload: {supersetRest,}
                          })
                      }}/>
        )
    }

    if (Object.keys(supersetData).length === 0) {
        return (
            <div>Loading</div>
        )
    }

    console.log(supersetData)
    return (
        <WrapperPage>
            <div className={`h-[55vh] 
                    grid place-content-center
                    gap-4 shadow-md 
                    border rounded-lg mx-4 mt-8`}>
                <div className={`grid place-content-center pb-6`}>
                    <span className={`grid place-content-center
                        text-xs bg-blue-200 font-bold
                        rounded-xl p-2`}>
                        Exercise Set {exerciseState.exerciseSet + 1}
                    </span>
                    <div className={`leading-none py-6`}>
                        <span className={`grid place-content-center text-3xl`}>
                            {exerciseData.name}
                        </span>
                        <span className={`grid place-content-center text-sm font-extralight`}>
                            {sessionData.week} - {supersetData.annotation}
                        </span>
                    </div>
                    <span className={`grid place-content-center
                        text-xs bg-green-200 font-bold
                        p-2 rounded-xl`}> {supersetData.name} </span>
                </div>
                <div className={`grid grid-cols-2 gap-8`}>
                    <Widget label={"Target Weight"} value={exerciseData.targetWeight} unit={"kg"}/>
                    <Widget label={"Target Rep"} value={supersetData.targetRep} unit={"reps"}/>
                </div>
            </div>
            <form className={`grid grid-cols-2 gap-4 p-4`} onSubmit={handleSubmit}>
                <Input label={"Actual Weight"} required
                       value={actualWeight || '0'}
                       placeholder={"Weight in kg"} changeValue={setActualWeight}/>

                <Input label={"Actual Rep"} required
                       value={actualRep}
                       placeholder={"Actual rep"} changeValue={setActualRep}/>

                <button type={"submit"}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    DONE
                </button>
            </form>
        </WrapperPage>
    )
}

export default ExercisePage;