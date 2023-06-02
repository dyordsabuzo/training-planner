import React, {useContext, useState} from "react";
import SourceDataContext from "../context/SourceDataContext";
import SupersetForm from "../forms/SupersetForm";
import {sortObject} from "../common/utils";
import BaseListing from "./BaseListing";

const SupersetListing = () => {
    const [formData, setFormData] = useState<any>({})
    const [formType, setFormType] = useState("")
    const sourceDataContext = useContext(SourceDataContext)
    const sourceData: any = sourceDataContext.sourceData

    if (formType) {
        return (
            <SupersetForm data={formData} type={formType} closeForm={() => setFormType("")}/>
        )
    }

    return (
        <BaseListing>
            <div className={`flex place-content-end`}>
                <button type={"button"}
                        className={`text-sm hover:bg-blue-700 hover:text-white text-blue-700 font-bold py-2 px-4 rounded-md`}
                        onClick={() => {
                            setFormData({})
                            setFormType("add")
                        }}>+ Add Superset
                </button>
            </div>

            <div className={`grid grid-cols-2 gap-3`}>
                {Object.entries(sortObject(sourceData.supersets ?? {}))
                    .map(([key, value]) => (
                        <div key={key}
                             className={`flex flex-col border border-1 border-blue-200 p-4 rounded-md text-sm cursor-pointer`}
                             onClick={(e) => {
                                 let _value: any = value
                                 if (!_value.sessions && _value.session) {
                                     _value.sessions = _value.session.split(",")
                                 }
                                 setFormData(_value)
                                 setFormType("edit")
                             }}>
                            <span className={`font-bold`}>{(value as any).name}</span>
                            <>
                                {((value as any).exercises ?? []).map((e: any) => (
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

export default SupersetListing