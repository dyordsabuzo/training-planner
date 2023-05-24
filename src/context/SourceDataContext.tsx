import {createContext, ReactNode, useState} from "react";
import {ExerciseType} from "../types/ExerciseType";
import {DataSourceType} from "../types/DataSourceType";

const SourceDataContext = createContext({
    sourceData: {},
    editExercise: (exercise: any) => {
    },
    addExercise: (exercise: any) => {
    },
    addSuperset: (superset: any) => {
    },
    editSuperset: (superset: any) => {
    },
    initialise: () => {
    },
})

export default SourceDataContext

type _Props = {
    children: ReactNode
}

export const SourceDataContextProvider: React.FC<_Props> = ({children}) => {
    const [sourceData, setSourceData] = useState<any>({})

    const sortData = (data: any) => {
        return Object.keys(data).sort()
            .reduce((accumulator: any, key: string) => {
                accumulator[key] = data[key];
                return accumulator
            }, {})
    }

    const initialise = () => {
        // setSourceData({
        //     exercises: {},
        //     supersets: {}
        // })
        getFromLocalStorage()
    }

    const saveToLocaStorage = () => {
        if (process.env.NODE_ENV !== "production") {
            localStorage.setItem('sourceData', JSON.stringify(sourceData));
        }
    }

    const getFromLocalStorage = () => {
        if (process.env.NODE_ENV !== "production") {
            let data = localStorage.getItem('sourceData')
            if (data) {
                setSourceData(JSON.parse(data))
            } else {
                setSourceData({
                    exercises: {},
                    supersets: {},
                    sessions: {},
                })
            }
        }
    }

    const editExercise = (exercise: any) => {
        let exercises = sourceData.exercises
        let _exercise: any = Object.values(exercises as any).find(obj => (obj as any).name === exercise.name)

        exercises = {
            ...exercises,
            [exercise.name]: {
                ..._exercise,
                ...exercise
            }
        }

        let supersets = sourceData.supersets
        Object.values(supersets).forEach((s: any) => {
            const itemIndex = s.exercises.indexOf(exercise.name)
            if (itemIndex >= 0) {
                if (!exercise.supersets.split(",").includes(s.name)) {
                    s.exercises.splice(itemIndex, 1)
                    supersets = {
                        ...supersets,
                        [s.name]: s
                    }
                }
            }
        })

        exercise.supersets.split(",").forEach((s: string) => {
            if (!s) {
                return
            }

            let _superset: any = Object.values(supersets).find((sObject: any) => sObject.name === s)
            let exerciseList: string[] = _superset?.exercises ?? []
            if (!exerciseList.includes(exercise.name)) {
                exerciseList.push(exercise.name)
                _superset = {
                    ..._superset,
                    name: s,
                    exercises: exerciseList
                }
            }

            supersets = {
                ...supersets,
                [_superset.name]: _superset
            }
        })


        setSourceData({
            ...sourceData,
            exercises: sortData(exercises),
            supersets: sortData(supersets)
        })
        saveToLocaStorage()
    }

    const addExercise = (exercise: any) => {
        let exercises = sourceData.exercises

        // let _exercise = {
        //     ...exercise,
        //     exercise: Object.keys(exercises).length + 1
        // }
        //
        // exercises = {
        //     ...exercises,
        //     [exercise.name]: _exercise
        // }

        exercises = {
            ...exercises,
            [exercise.name]: {
                ...exercise,
                exercise: Object.keys(exercises).length + 1
            }
        }

        let supersets = sourceData.supersets
        exercise.supersets.split(",").forEach((s: string) => {
            if (!s) {
                return
            }

            let _superset: any = Object.values(supersets).find((sObject: any) => sObject.name === s)
            let exerciseList: string[] = _superset?.exercises ?? []
            if (!exerciseList.includes(s)) {
                exerciseList.push(s)
                _superset = {
                    ..._superset,
                    name: s,
                    exercises: exerciseList
                }
            }

            supersets = {
                ...supersets,
                [_superset.name]: _superset
            }
        })

        setSourceData({
            ...sourceData,
            exercises: sortData(exercises),
            supersets: sortData(supersets)
        })
        saveToLocaStorage()
    }

    const addSuperset = (superset: any) => {

    }

    const editSuperset = (superset: any) => {

        let supersets = sourceData.supersets
        supersets = {
            ...supersets,
            [superset.name]: superset
        }

        let sessions = sourceData.sessions
        if (superset.session) {
            let supersetList: string[] = sessions[superset.session]?.supersets ?? []
            if (!supersetList.includes(superset.name)) {
                supersetList.push(superset.name)
                sessions = {
                    ...sessions,
                    [superset.session]: {
                        name: superset.session,
                        supersets: supersetList
                    }
                }
            }
        }

        setSourceData({
            ...sourceData,
            supersets,
            sessions
        })
        saveToLocaStorage()
    }

    return (
        <SourceDataContext.Provider
            value={{
                sourceData,
                addExercise,
                addSuperset,
                editExercise,
                editSuperset,
                initialise,
            }}>
            {children}
        </SourceDataContext.Provider>
    )
}