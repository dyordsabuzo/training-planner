import React, {useContext, useState} from "react";
import SourceDataContext from "../context/SourceDataContext";
import Input from "../components/Input";
import Checkbox from "../components/Checkbox";
import IncrementDecrement from "../components/IncrementDecrement";
import WeekForm from "../forms/WeekForm";
// import AlertModal from "../modal/AlertModal";

const PlanListing = () => {
    const sourceDataContext = useContext(SourceDataContext)

    const [isAdd, setIsAdd] = useState<boolean>(false)
    const [isEdit, setIsEdit] = useState<boolean>(false)
    const [planName, setPlanName] = useState<string>("")
    const [numberOfWeeks, setNumberOfWeeks] = useState<string>("")
    const [baselineRep, setBaselineRep] = useState<string>("")
    const [baselineSet, setBaselineSet] = useState<string>("")

    const [selectedWeekData, setSelectedWeekData] = useState<any>(null)
    const [selectedPlan, setSelectedPlan] = useState("")

    const [selectedSessions, setSelectedSessions] = useState<string[]>(
        Object.keys((sourceDataContext.sourceData as any).sessions ?? {})
    )


    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (isAdd) {
            sourceDataContext.addPlan({
                name: planName,
                numberOfWeeks,
                selectedSessions,
                targetRep: baselineRep,
                targetSet: baselineSet,
                targetWeight: 0,
            })
            setIsAdd(false)
        }

        if (isEdit) {
            sourceDataContext.editPlan({
                name: planName,
                numberOfWeeks,
                selectedSessions,
                targetRep: baselineRep,
                targetSet: baselineSet,
                targetWeight: 0,
            })
            setIsEdit(false)
        }
    }

    const resetForm = () => {
        setNumberOfWeeks("")
        setPlanName("")
        setSelectedWeekData(null)
        setBaselineRep("")
        setBaselineSet("")
        setIsAdd(true)
    }

    // const loadSelectedWeek = (e: React.MouseEvent<HTMLDivElement>) => {
    //
    // }


    if (selectedWeekData) {
        return (
            <WeekForm planName={selectedPlan} weekData={selectedWeekData as any}
                      clear={() => setSelectedWeekData(null)}/>
        )
    }

    if (isAdd || isEdit) {
        return (
            <form onSubmit={handleSubmit} className={`flex flex-col gap-4`}>
                <Input label={"Plan name"} required
                       value={planName}
                       placeholder={"Plan name"} changeValue={setPlanName}/>
                <Input label={"Number of weeks"} required
                       value={numberOfWeeks}
                       placeholder={"Number of weeks"} changeValue={setNumberOfWeeks}/>

                <Input label={"Baseline set"}
                       value={baselineSet}
                       placeholder={"Baseline set"} changeValue={setBaselineSet}/>

                <Input label={"Baseline Rep"}
                       value={baselineRep}
                       placeholder={"Target Rep"} changeValue={setBaselineRep}/>

                <div className={`flex flex-col gap-2 p-4
                    border border-gray-200 dark:border-gray-700 rounded-md
                `}>
                    <span className={`text-sm font-medium`}>
                        Selected Sessions
                    </span>
                    {Object.keys((sourceDataContext.sourceData as any).sessions ?? {}).map(key => (
                        <Checkbox key={key} label={key} checked={selectedSessions.includes(key)}
                                  toggleSelection={(selection) => {
                                      let _selectedSessions = selectedSessions
                                      if (_selectedSessions.includes(selection)) {
                                          const index = _selectedSessions.indexOf(selection)
                                          _selectedSessions.splice(index, 1)
                                      } else {
                                          _selectedSessions.push(selection)
                                      }
                                      setSelectedSessions(_selectedSessions)
                                  }}/>
                    ))}
                </div>

                <div className={`flex gap-2 py-4`}>
                    <button type={"submit"}
                            className={`text-xs bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl`}>
                        {isAdd ? "Create" : "Update"}
                    </button>
                    <button type={"button"}
                            className={`text-xs font-bold py-2 px-4 rounded-xl border border-black`}
                            onClick={(e) => {
                                e.preventDefault()
                                setIsAdd(false)
                                setIsEdit(false)
                            }}>
                        Cancel
                    </button>
                </div>
            </form>
        )
    }

    return (
        <div className={`flex flex-col gap-2`}>
            <div className={`flex place-content-end`}>
                <button type={"button"}
                        className={`text-sm hover:bg-green-700 hover:text-white text-green-700 font-bold p-2 rounded-md`}
                        onClick={() => resetForm()}>+ Create Plan
                </button>
            </div>
            <>
                {Object.entries((sourceDataContext.sourceData as any).plans ?? {})
                    .map(([key, value]) => (
                        <div key={key}
                             className={`flex flex-col gap-4 border border-1 border-blue-200 p-4 rounded-md text-sm`}
                            // onClick={(e) => {
                            //     e.preventDefault()
                            //     setPlanName((value as any).name)
                            //     setNumberOfWeeks((value as any).numberOfWeeks)
                            //     setBaselineRep((value as any).targetRep)
                            //     setBaselineSet((value as any).targetSet ?? "")
                            //     setIsEdit(true)
                            // }}
                        >
                            <div>
                                <span className={`font-bold`}>{key}</span>
                            </div>
                            <div className={`flex flex-col gap-2`}>
                                {Object.entries((value as any).weeks ?? {})
                                    .map(([weekKey, weekData]) => (
                                        <div key={weekKey}
                                             className={`border border-1 p-2 rounded-lg`}
                                             onClick={(e) => {
                                                 setSelectedPlan(key)
                                                 setSelectedWeekData(selectedWeekData && weekKey === `Week ${selectedWeekData.weekNumber + 1}` ? null : weekData)
                                             }}>
                                            <div className={`flex gap-4 cursor-pointer`}>
                                                <span>{weekKey}</span>
                                                <span>Set: {(weekData as any).targetSet} / Rep: {(weekData as any).targetRep}</span>
                                                <span className={`truncate`}>{(weekData as any).annotation}</span>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    ))}
            </>

        </div>
    )
}

export default PlanListing