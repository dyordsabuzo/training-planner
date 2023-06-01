import {createContext, ReactNode, useState} from "react";
import {addDoc, getDocs, updateDoc, deleteDoc} from "firebase/firestore";
import {getCollection, getDocumentReference} from "../common/firebase";

enum SourceDbReferences {
    EXERCISES = "exercises",
    SUPERSETS = "supersets",
    SESSIONS = "sessions",
    PLANS = "plans"
}

const SourceDataContext = createContext({
    sourceData: {},
    editExercise: (exercise: any) => {
    },
    addExercise: (exercise: any) => {
    },
    deleteExercise: (data: any) => {
    },
    addSuperset: (superset: any) => {
    },
    editSuperset: (superset: any) => {
    },
    deleteSuperset: (superset: any) => {
    },
    addSession: (session: any) => {
    },
    editSession: (session: any) => {
    },
    deleteSession: (session: any) => {
    },
    addPlan: (plan: any) => {
    },
    editPlan: (plan: any) => {
    },
    deletePlan: (plan: any) => {
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

    const initialise = async () => {
        // getLocalStorage()
        const exercises = await getFromDB(SourceDbReferences.EXERCISES)
        const supersets = await getFromDB(SourceDbReferences.SUPERSETS)
        const sessions = await getFromDB(SourceDbReferences.SESSIONS)
        const plans = await getFromDB(SourceDbReferences.PLANS)

        setSourceData({
            ...sourceData,
            exercises,
            supersets,
            sessions,
            plans
        })
    }

    const saveToStorage = (data: any) => {
        // if (process.env.NODE_ENV !== "production") {
        // localStorage.setItem('sourceData', JSON.stringify(data));
        // }

        setSourceData(data)
    }

    const deleteFromDB = (sourceDb: SourceDbReferences, data: any) => {
        deleteDoc(getDocumentReference(sourceDb, data.id))
            .then(() => {
                let sourceDataElement = sourceData[sourceDb] ?? {}
                delete sourceDataElement[data.name]
                setSourceData({
                    ...sourceData,
                    [sourceDb]: sourceDataElement
                })
            })
    }

    const saveToDB = async (sourceDb: SourceDbReferences, data: any) => {
        const collection = getCollection(sourceDb)

        if (!(data.id ?? '')) {
            await addDoc(collection, data)
                .then((doc) => {
                    const sourceDataElement = sourceData[sourceDb] ?? {}
                    setSourceData({
                        ...sourceData,
                        [sourceDb]: {
                            ...sourceDataElement,
                            [data.name]: {
                                ...data,
                                id: doc.id
                            }
                        }
                    })
                })
                .catch((error) => {
                    console.log(error)
                })
        } else {
            const docRef = getDocumentReference(sourceDb, data.id)
            const {id, ...plainData} = data

            await updateDoc(docRef, plainData)
                .then((doc) => {
                    const sourceDataElement = sourceData[sourceDb] ?? {}
                    setSourceData({
                        ...sourceData,
                        [sourceDb]: {
                            ...sourceDataElement,
                            [data.name]: data
                        }
                    })
                })
        }
    }

    const getFromDB = async (sourceDb: SourceDbReferences): Promise<any> => {
        try {
            const collection = getCollection(sourceDb)
            const snapshot = await getDocs(collection)

            let data = {}
            snapshot.docs.forEach((doc) => {
                const docData = doc.data()
                data = {
                    ...data,
                    [docData.name]: {...docData, id: doc.id}
                }
            })

            return data
        } catch (error) {
            console.log(error)
        }
    }

    // const getLocalStorage = () => {
    //     // if (process.env.NODE_ENV !== "production") {
    //     let data = localStorage.getItem('sourceData')
    //     if (data) {
    //         setSourceData(JSON.parse(data))
    //     } else {
    //         setSourceData({
    //             exercises: {},
    //             supersets: {},
    //             sessions: {},
    //             plans: {},
    //         })
    //     }
    //     // }
    // }

    const linkExerciseWithSupersets = (exercise: any) => {
        exercise.supersets.forEach(async (s: string) => {
                if (s) {
                    let superset: any = Object.values(sourceData.supersets ?? {})
                        .find((sObject: any) => sObject.name === s)

                    const exerciseList: string[] = superset?.exercises ?? []
                    if (!exerciseList.includes(exercise.name)) {
                        exerciseList.push(exercise.name)
                    }
                    superset = {
                        ...superset,
                        name: s,
                        exercises: exerciseList
                    }

                    await saveToDB(SourceDbReferences.SUPERSETS, superset)
                }
            }
        )
    }

    const linkSupersetWithSessions = (superset: any) => {
        superset.sessions.forEach(async (session: string) => {
            if (session) {
                let sessionObject: any = Object.values(sourceData.sessions ?? {})
                    .find((s: any) => s.name === session)

                const supersetList: string[] = sessionObject?.supersets ?? []
                if (!supersetList.includes(superset.name)) {
                    supersetList.push(superset.name)
                }
                sessionObject = {
                    ...sessionObject,
                    name: session,
                    supersets: supersetList
                }
                await saveToDB(SourceDbReferences.SESSIONS, sessionObject)
            }
        })
    }

    const editExercise = async (exercise: any) => {
        await saveToDB(SourceDbReferences.EXERCISES, exercise)
        linkExerciseWithSupersets(exercise)
    }

    const addExercise = async (exercise: any) => {
        await saveToDB(SourceDbReferences.EXERCISES, exercise)
        linkExerciseWithSupersets(exercise)
    }

    const deleteExercise = (exercise: any) => {
        deleteFromDB(SourceDbReferences.EXERCISES, exercise)
    }

    const addSuperset = async (superset: any) => {
        await saveToDB(SourceDbReferences.SUPERSETS, superset)
        linkSupersetWithSessions(superset)
    }

    const editSuperset = async (superset: any) => {
        const exercises = Object.keys(sourceData.exercises ?? {})
        superset = {
            ...superset,
            exercises: (superset.exercises ?? []).filter((e: string) => exercises.includes(e))
        }
        await saveToDB(SourceDbReferences.SUPERSETS, superset)
        linkSupersetWithSessions(superset)
    }

    const deleteSuperset = (superset: any) => {
        deleteFromDB(SourceDbReferences.SUPERSETS, superset)
    }

    const addSession = async (session: any) => {
        await saveToDB(SourceDbReferences.SESSIONS, session)
    }

    const editSession = async (session: any) => {
        await saveToDB(SourceDbReferences.SESSIONS, session)
    }

    const deleteSession = (session: any) => {
        deleteFromDB(SourceDbReferences.SESSIONS, session)
    }

    const addPlan = async (plan: any) => {
        let weeks = {}
        Array.from(Array(parseInt(plan.numberOfWeeks ?? '0'))
            .keys())
            .forEach(week => {
                weeks = {
                    ...weeks,
                    [`Week ${week + 1}`]: {
                        weekNumber: week,
                        targetRep: plan.baselineRep,
                        targetSet: plan.baselineSet,
                        annotation: ""
                    }
                }
            })

        plan = {
            ...plan,
            weeks
        }
        await saveToDB(SourceDbReferences.PLANS, plan)
    }

    const editPlan = async (plan: any) => {
        let currentWeeks = (sourceData.plan as any).weeks
        if (parseInt(plan.numberOfWeeks ?? '0') > currentWeeks.length) {
            Array.from(Array(parseInt(plan.numberOfWeeks) - currentWeeks.length)
                .keys())
                .forEach(week => {
                    currentWeeks = {
                        ...currentWeeks,
                        [`Week ${week + 1 + currentWeeks.length}`]: {
                            weekNumber: week + currentWeeks.length,
                            targetRep: plan.baselineRep,
                            targetSet: plan.baselineSet,
                            annotation: ""
                        }
                    }
                })

        }
        await saveToDB(SourceDbReferences.PLANS, plan)
    }

    const deletePlan = (plan: any) => {
        deleteFromDB(SourceDbReferences.PLANS, plan)
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
                editExercise,
                deleteExercise,
                addSuperset,
                editSuperset,
                deleteSuperset,
                addSession,
                editSession,
                deleteSession,
                addPlan,
                editPlan,
                deletePlan,
                updateWeekPlan,
                initialise,
            }}>
            {children}
        </SourceDataContext.Provider>
    )
}