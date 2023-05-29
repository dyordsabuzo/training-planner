import {createContext, ReactNode, useState} from "react";
// import {ExerciseType} from "../types/ExerciseType";
// import {DataSourceType} from "../types/DataSourceType";

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
    addSession: (session: any) => {
    },
    editSession: (session: any) => {
    },
    addPlan: (plan: any) => {
    },
    editPlan: (plan: any) => {
    },
    updateWeekPlan: (planName: string, weekData: any) => {
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
        getLocalStorage()
    }

    const saveToStorage = (data: any) => {
        if (process.env.NODE_ENV !== "production") {
            localStorage.setItem('sourceData', JSON.stringify(data));
        }

        setSourceData(data)
    }

    const getLocalStorage = () => {
        if (process.env.NODE_ENV !== "production") {
            let data = localStorage.getItem('sourceData')
            if (data) {
                setSourceData(JSON.parse(data))
            } else {
                setSourceData({
                    exercises: {},
                    supersets: {},
                    sessions: {},
                    plans: {},
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

        saveToStorage({
            ...sourceData,
            exercises: sortData(exercises),
            supersets: sortData(supersets)
        })
    }

    const addExercise = (exercise: any) => {
        let exercises = sourceData.exercises
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

        saveToStorage({
            ...sourceData,
            exercises: sortData(exercises),
            supersets: sortData(supersets)
        })
    }

    const addSuperset = (superset: any) => {
        let supersets = sourceData.supersets
        supersets = {
            ...supersets,
            [superset.name]: superset
        }

        saveToStorage({
            ...sourceData,
            supersets,
        })
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

        saveToStorage({
            ...sourceData,
            supersets,
            sessions
        })
    }

    const addSession = (session: any) => {

    }

    const editSession = (session: any) => {
        let sessions = sourceData.sessions
        sessions = {
            ...sessions,
            [session.name]: session
        }
        // console.log(sourceData)

        // session.supersets((superset: string) => {
        //     supersets = {
        //         ...supersets,
        //         [superset] : superset
        //     }
        // })

        saveToStorage({
            ...sourceData,
            sessions
        })
    }

    const addPlan = (plan: any) => {
        let weeks = {}
        Array.from(Array(parseInt(plan.numberOfWeeks ?? '0'))
            .keys())
            .forEach(week => {
                weeks = {
                    ...weeks,
                    [`Week ${week + 1}`]: {
                        weekNumber: week,
                        targetRep: plan.targetRep,
                        targetSet: plan.targetSet,
                        annotation: ""
                    }
                }
            })

        plan = {
            ...plan,
            weeks
        }

        let plans = sourceData.plans ?? {}
        plans = {
            ...plans,
            [plan.name]: {
                ...plan,
                id: Object.keys(plans).length + 1
            }
        }
        saveToStorage({
            ...sourceData,
            plans
        })
    }

    const editPlan = (plan: any) => {
        let plans = sourceData.plans ?? {}
        let _plan: any = Object.values(plans as any).find(obj => (obj as any).name === plan.name)

        plans = {
            ...plans,
            [plan.name]: {
                ..._plan,
                ...plan
            }
        }
        saveToStorage({
            ...sourceData,
            plans
        })
    }

    const updateWeekPlan = (planName: string, weekData: any) => {
        let plans = sourceData.plans ?? {}
        let _plan: any = Object.values(plans as any).find(obj => (obj as any).name === planName)

        _plan = {
            ..._plan,
            weeks: {
                ..._plan.weeks,
                [`Week ${weekData.weekNumber + 1}`]: weekData
            }
        }

        plans = {
            ...plans,
            [_plan.name]: _plan
        }

        saveToStorage({
            ...sourceData,
            plans
        })


    }

    return (
        <SourceDataContext.Provider
            value={{
                sourceData,
                addExercise,
                addSuperset,
                editExercise,
                editSuperset,
                addSession,
                editSession,
                addPlan,
                editPlan,
                updateWeekPlan,
                initialise,
            }}>
            {children}
        </SourceDataContext.Provider>
    )
}