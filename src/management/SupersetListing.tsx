import React, {useContext, useState} from "react";
import SourceDataContext from "../context/SourceDataContext";
import SupersetForm from "../forms/SupersetForm";
import {sortData} from "../common/utils";

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
        <div className={`flex flex-col gap-4`}>
            <div className={`flex place-content-end`}>
                <button type={"button"}
                        className={`text-sm hover:bg-blue-700 hover:text-white text-blue-700 font-bold py-2 px-4 rounded-md`}
                        onClick={() => {
                            setFormData({})
                            setFormType("add")
                        }}>+ Add Superset
                </button>
            </div>

            <>
                {Object.entries(sortData(sourceData.supersets ?? {}))
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
            </>

        </div>
    )
}

export default SupersetListing