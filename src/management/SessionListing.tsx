import React, {useContext, useState} from "react";
import SourceDataContext from "../context/SourceDataContext";
import SessionForm from "../forms/SessionForm";
import {sortObject} from "../common/utils";
import BaseListing from "./BaseListing";
// import AlertModal from "../modal/AlertModal";

const SessionListing = () => {
    const [formData, setFormData] = useState<any>({})
    const [formType, setFormType] = useState("")

    const sourceDataContext = useContext(SourceDataContext)
    const sourceData: any = sourceDataContext.sourceData

    if (formType) {
        return (
            <SessionForm data={formData} type={formType} closeForm={() => setFormType("")}/>
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
                        }}>+ Add Session
                </button>
            </div>
            <div className={`grid grid-cols-2 gap-3`}>
                {Object.entries(sortObject(sourceData.sessions ?? {}))
                    .map(([key, value]) => (
                        <div key={key}
                             className={`border border-1 border-blue-200 p-4 rounded-md text-sm cursor-pointer`}
                             onClick={() => {
                                 let _value: any = value
                                 if (typeof _value.supersets === "string") {
                                     _value.supersets = _value.supersets.split(",")
                                 }
                                 setFormData(_value)
                                 setFormType("edit")
                             }}>
                            <span className={`font-bold`}>{key}</span>
                            <>
                                {(value as any).supersets.map((e: string) => (
                                    <div className={`text-xs`}
                                         key={e}>
                                        {e}
                                    </div>
                                ))}
                            </>
                        </div>
                    ))}
            </div>
        </BaseListing>

    )
}

export default SessionListing