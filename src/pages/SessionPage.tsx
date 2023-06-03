import Dropdown from "../components/Dropdown";
import React, {useContext, useEffect, useState} from "react";
import SessionContext from "../context/SessionContext";
import SummaryPage from "./SummaryPage";
import ExercisePage from "./ExercisePage";
import SourceDataContext from "../context/SourceDataContext";
import WrapperPage from "./WrapperPage";

const SessionPage = () => {
    const [sessionData, setSessionData] = useState<any>({})
    const sessionContext = useContext(SessionContext)
    const sourceDataContext = useContext(SourceDataContext)

    const [weekOptions, setWeekOptions] = useState<string[]>([])
    const [sessionOptions, setSessionOptions] = useState<string[]>([])
    const [isContextInitialised, setIsContextInitialised] = useState(false)

    const sourceData: any = sourceDataContext.sourceData

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        sessionContext.initialiseSession(sessionData)
    }

    useEffect(() => {
        if (!isContextInitialised) {
            sessionContext.setIsSessionOn(true)
            sourceDataContext.initialise()
            setIsContextInitialised(true)
        }
        return () => {
        }
    }, [isContextInitialised, sessionContext, sourceDataContext])

    if (sessionContext.sessionData && !sessionContext.isRunning) {
        return <SummaryPage/>
    }

    if (sessionContext.isRunning) {
        return <ExercisePage/>
    }

    return (
        <WrapperPage>
            <form onSubmit={handleSubmit} className={`flex flex-col gap-8 pt-12`}>
                <Dropdown label={"Training plan"}
                          options={Object.keys(sourceData.plans ?? {})} required
                          valueHandler={(plan) => {
                              let planData: any = Object.values(sourceData.plans)
                                  .find((value: any) => value.name === plan)
                              setWeekOptions(Object.keys(planData.weeks).sort())
                              setSessionOptions(planData.sessions.sort())

                              setSessionData({
                                  ...sessionData,
                                  plan
                              })
                          }}/>

                <Dropdown label={"Week"} options={weekOptions} required
                          valueHandler={(week: string) => {
                              let weekData: any = sourceData.plans[sessionData.plan].weeks[week]

                              setSessionData({
                                  ...sessionData,
                                  week,
                                  annotation: weekData.annotation,
                                  targetRep: weekData.targetRep,
                                  targetSet: weekData.targetSet
                              })
                              // setWeek(week)
                          }}/>

                <Dropdown label={"Session"} options={sessionOptions} required
                          valueHandler={(session: string) => {
                              let supersets = {}
                              let sessionSupersets = sourceData.sessions[session].supersets
                              sessionSupersets.forEach((s: string) => {
                                  let {targetRep, targetSet, annotation} = sessionData
                                  let {sessions, rest, tags, ...superset} = sourceData.supersets[s]
                                  let exercises = superset.exercises.map((e: string) => sourceData.exercises[e])

                                  // override if there is only 1 exercise
                                  if (exercises.length === 1) {
                                      const exerciseRep = parseInt(exercises[0].targetRep)
                                      const exerciseSet = parseInt(exercises[0].targetSet)
                                      const exerciseRest = parseInt(exercises[0].rest)
                                      targetRep = exerciseRep || targetRep
                                      targetSet = exerciseSet || targetSet
                                      rest = exerciseRest || rest
                                  }

                                  supersets = {
                                      ...supersets,
                                      [superset.name]: {
                                          ...superset,
                                          exercises,
                                          targetRep,
                                          targetSet,
                                          annotation,
                                          rest
                                      }
                                  }
                              })

                              setSessionData({
                                  ...sessionData,
                                  session,
                                  supersets
                              })
                          }}
                />

                <button type={"submit"}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-6 px-4 rounded">
                    LOAD
                </button>
            </form>
        </WrapperPage>
    )
}

export default SessionPage
