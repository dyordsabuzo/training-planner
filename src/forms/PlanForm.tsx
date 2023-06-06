import Input from "../components/Input";
import React, {useContext, useState} from "react";
import SourceDataContext from "../context/SourceDataContext";
import TagInput from "../components/TagInput";

import "react-datepicker/dist/react-datepicker.css";
import DateInput from "../components/DateInput";

type FormData = {
    id?: string
    name?: string
    numberOfWeeks?: string
    baselineRep?: string
    baselineSet?: string
    sessions?: string[]
    startDate: Date
}

type Props = {
    data: FormData
    type: string
    closeForm: () => void
}

const PlanForm: React.FC<Props> = ({data, type, closeForm}) => {
    // const [id, setId] = useState(data.id ?? "")
    const id = data.id ?? ""
    const [name, setName] = useState(data.name ?? "")
    const [numberOfWeeks, setNumberOfWeeks] = useState(data.numberOfWeeks ?? "")
    const [baselineSet, setBaselineSet] = useState(data.baselineSet ?? "")
    const [baselineRep, setBaselineRep] = useState(data.baselineRep ?? "")
    const [sessions, setSessions] = useState<string[]>(data.sessions ?? [])
    const [startDate, setStartDate] = useState<Date>(data.startDate ?? new Date())

    const sourceDataContext = useContext(SourceDataContext)
    const sourceData: any = sourceDataContext.sourceData

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (type === "add") {
            sourceDataContext.addPlan({
                name,
                numberOfWeeks,
                startDate,
                baselineSet,
                baselineRep,
                sessions,
            })
            closeForm()
        }

        if (type === "edit") {
            sourceDataContext.editPlan({
                id,
                name,
                numberOfWeeks,
                startDate,
                baselineSet,
                baselineRep,
                sessions,
            })
            closeForm()
        }
    }

    return (
        <form onSubmit={handleSubmit} className={`grid place-content-center grid-cols-2 gap-4 sm:gap-2`}>
            <Input label={"Plan name"} required
                   value={name}
                   placeholder={"Plan name"} changeValue={setName}
                   className={`col-span-2`}
            />

            <Input label={"Number of weeks"} required
                   value={numberOfWeeks}
                   placeholder={"Number of weeks"} changeValue={setNumberOfWeeks}/>

            <DateInput label={"Start date"} value={startDate} placeholder={"Start date"} changeValue={setStartDate}/>

            <Input label={"Baseline set"}
                   value={baselineSet}
                   placeholder={"Baseline set"} changeValue={setBaselineSet}/>

            <Input label={"Baseline Rep"}
                   value={baselineRep}
                   placeholder={"Target Rep"} changeValue={setBaselineRep}/>

            <TagInput label={"Selected sessions"} list={sessions} options={Object.keys(sourceData.sessions ?? {})}
                      updateList={setSessions}/>

            <div className={`col-span-2 flex justify-between gap-2 py-4`}>
                <div className={`flex gap-2`}>
                    <button type={"submit"}
                            className={`text-xs bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl`}>
                        Save
                    </button>
                    <button type={"button"}
                            className={`text-xs font-bold py-2 px-4 rounded-xl border border-black`}
                            onClick={() => {
                                closeForm()
                            }}>
                        Cancel
                    </button>
                </div>
                <button type={"button"}
                        className={`text-xs bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl`}
                        onClick={() => {
                            sourceDataContext.deletePlan(data)
                            closeForm()
                        }}>
                    Delete
                </button>
            </div>

        </form>
    )
}

export default PlanForm