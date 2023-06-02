import React, {useContext, useState} from "react";
import SourceDataContext from "../context/SourceDataContext";
import ExerciseForm from "../forms/ExerciseForm";
import {sortObject} from "../common/utils";
import BaseListing from "./BaseListing";
// import AlertModal from "../modal/AlertModal";

const ExerciseListing = () => {
    const [formData, setFormData] = useState<any>({})
    const [formType, setFormType] = useState("")

    const sourceDataContext = useContext(SourceDataContext)

    if (formType) {
        return (
            <ExerciseForm data={formData} type={formType} closeForm={() => setFormType("")}/>
        )
    }

    return (
        <BaseListing>
            <div className={`flex place-content-end`}>
                <button type={"button"}
                        className={`text-sm hover:bg-green-700 hover:text-white text-green-700 font-bold p-2 rounded-md`}
                        onClick={() => {
                            setFormData({})
                            setFormType("add")
                        }}>+ Add Exercise
                </button>
            </div>
            <div className={`grid grid-cols-2 gap-2`}>
                {Object.entries(sortObject((sourceDataContext.sourceData as any).exercises ?? {}))
                    .map(([key, value]) => (
                        <div key={key}
                             className={`grow border border-1 border-blue-200 p-4 rounded-md text-sm cursor-pointer`}
                             onClick={() => {
                                 let _value: any = value
                                 if (typeof _value.supersets === "string") {
                                     _value.supersets = _value.supersets.split(",")
                                 }
                                 setFormData(_value)
                                 setFormType("edit")
                             }}>
                            {key}
                        </div>
                    ))}
            </div>
        </BaseListing>
    )
}

export default ExerciseListing