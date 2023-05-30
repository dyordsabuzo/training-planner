import React, {useContext, useState} from "react";
import SourceDataContext from "../context/SourceDataContext";
// import IncrementDecrement from "../components/IncrementDecrement";
// import WeekForm from "../forms/WeekForm";
import PlanForm from "../forms/PlanForm";
// import AlertModal from "../modal/AlertModal";

const PlanListing = () => {
    const [formData, setFormData] = useState<any>({})
    const [formType, setFormType] = useState("")

    const sourceDataContext = useContext(SourceDataContext)
    const sourceData: any = sourceDataContext.sourceData

    // if (selectedWeekData) {
    //     return (
    //         <WeekForm planName={selectedPlan} weekData={selectedWeekData as any}
    //                   clear={() => setSelectedWeekData(null)}/>
    //     )
    // }

    if (formType) {
        return (
            <PlanForm data={formData} type={formType} closeForm={() => setFormType("")}/>
        )
    }

    return (
        <div className={`flex flex-col gap-2`}>
            <div className={`flex place-content-end`}>
                <button type={"button"}
                        className={`text-sm hover:bg-green-700 hover:text-white text-green-700 font-bold p-2 rounded-md`}
                        onClick={() => {
                            setFormData({
                                sessions: Object.keys(sourceData.sessions)
                            })
                            setFormType("add")
                        }}>+ Create Plan
                </button>
            </div>
            <>
                {Object.entries((sourceDataContext.sourceData as any).plans ?? {})
                    .map(([key, value]) => (
                        <div key={key}
                             className={`flex flex-col gap-4 border border-1 border-blue-200 p-4 rounded-md text-sm`}>
                            <div className={`cursor-pointer`}
                                 onClick={() => {
                                     setFormData(value as any)
                                     setFormType("edit")
                                 }}>
                                <span className={`font-bold`}>{key}</span>
                            </div>
                            <div className={`flex flex-col gap-2`}>
                                {Object.entries((value as any).weeks ?? {})
                                    .map(([weekKey, weekData]) => (
                                        <div key={weekKey}
                                             className={`border border-1 p-2 rounded-lg`}
                                            // onClick={(e) => {
                                            //     setSelectedPlan(key)
                                            //     setSelectedWeekData(selectedWeekData && weekKey === `Week ${selectedWeekData.weekNumber + 1}` ? null : weekData)
                                            // }}
                                        >
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