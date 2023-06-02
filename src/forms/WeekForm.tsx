import IncrementDecrement from "../components/IncrementDecrement";
import React, {useContext, useState} from "react";
import Input from "../components/Input";
// import Button from "../components/Button";
import SourceDataContext from "../context/SourceDataContext";

type Props = {
    weekData: any
    clear: () => void
}
const WeekForm: React.FC<Props> = ({weekData, clear}) => {
    const sourceDataContext = useContext(SourceDataContext)

    const [annotation, setAnnotation] = useState<string>(weekData.annotation ?? "")
    const [targetSet, setTargetSet] = useState<string>(weekData.targetSet ?? "0")
    const [targetRep, setTargetRep] = useState<string>(weekData.targetRep ?? "0")

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        let {weekKey, planName, ...minWeekData} = weekData
        sourceDataContext.updateWeekPlan(planName, {
            ...minWeekData,
            annotation,
            targetSet,
            targetRep
        })
        clear()
    }

    return (

        <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="fixed inset-0 z-10 overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <form onSubmit={handleSubmit}
                          className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">

                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start w-full">
                                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                    <h3 className="text-base font-semibold leading-6 text-gray-900"
                                        id="modal-title">{weekData.planName} - Week {weekData.weekNumber + 1}</h3>
                                    <div className="mt-2 grid grid-cols-2">
                                        <IncrementDecrement value={targetSet} label={"Set"} updateValue={setTargetSet}/>
                                        <IncrementDecrement value={targetRep} label={"Rep"} updateValue={setTargetRep}/>
                                        <div className={`col-span-2`}>
                                            <Input label={"Annotation"} value={annotation} placeholder={"Annotation"}
                                                   changeValue={setAnnotation}
                                                   className={`pr-4`}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                            <button type="submit"
                                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                            >
                                Update
                            </button>
                            <button type="button"
                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                    onClick={() => clear()}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default WeekForm