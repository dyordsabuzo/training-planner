import Dropdown from "../components/Dropdown";
import React, {useContext, useState} from "react";
import SessionContext from "../context/SessionContext";
import SummaryPage from "./SummaryPage";
import ExercisePage from "./ExercisePage";
import SourceDataContext from "../context/SourceDataContext";

const SessionPage = () => {
    const [sessionData, setSessionData] = useState<any>({})
    const sessionContext = useContext(SessionContext)
    const sourceDataContext = useContext(SourceDataContext)

    const [weekOptions, setWeekOptions] = useState<string[]>([])
    const [sessionOptions, setSessionOptions] = useState<string[]>([])

    const sourceData: any = sourceDataContext.sourceData

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        // let _session: any = Object.values(sourceData.sessions)
        //     .find((s: any) => s.name === session)
        //
        // _session.supersets.forEach((supersetName: string) => {
        //     let _supersetData = Object.values(sourceData.supersets)
        //         .find((_superset: any) => _superset.name === supersetName)
        //     console.log(_supersetData)
        // })

        // sessionContext.initialiseSession(plan, week, session)
        sessionContext.initialiseSession(sessionData)
    }

    if (sessionContext.sessionData && !sessionContext.isRunning) {
        return <SummaryPage/>
    }

    if (sessionContext.isRunning) {
        return <ExercisePage/>
    }

    console.log(sourceData)

    return (
        <div className={`flex flex-col gap-2 p-8 min-w-[30rem]`}>
            <form onSubmit={handleSubmit} className={`flex flex-col gap-8`}>
                <Dropdown label={"Training plan"}
                          options={Object.keys(sourceData.plans ?? {})} required
                          valueHandler={(plan) => {
                              let planData: any = Object.values(sourceData.plans)
                                  .find((value: any) => value.name === plan)
                              setWeekOptions(Object.keys(planData.weeks))
                              setSessionOptions(planData.sessions)

                              setSessionData({
                                  ...sessionData,
                                  plan
                              })
                          }}/>

                <Dropdown label={"Week"} options={weekOptions} required
                          valueHandler={(week: string) => {
                              let weekData: any = sourceData.plans[sessionData.plan].weeks[week]

                              console.log(weekData)
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
                                  let superset = sourceData.supersets[s]
                                  let exercises = superset.exercises.map((e: string) => sourceData.exercises[e])

                                  supersets = {
                                      ...supersets,
                                      [superset.name]: {
                                          ...superset,
                                          exercises
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

                {/*<Button label={"LOAD"} clickHandler={handleClick}/>*/}
                <button type={"submit"}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-6 px-4 rounded">
                    LOAD
                </button>
            </form>
        </div>
    )
}

export default SessionPage