import React, {useContext, useMemo, useState} from "react";
import SourceDataContext from "../context/SourceDataContext";
import {SessionForm} from "../forms/SessionForm";
import {sortObject} from "../common/utils";
import BaseListing from "./BaseListing";
import {ManageListHeader} from "./ManageListHeader";
import {EmptyState} from "./EmptyState";

export const SessionListing = () => {
    const [formData, setFormData] = useState<any>({})
    const [formType, setFormType] = useState("")
    const [search, setSearch] = useState("")

    const sourceDataContext = useContext(SourceDataContext)
    const sourceData: any = sourceDataContext.sourceData

    const sessions = sortObject(sourceData.sessions ?? {})
    const entries = useMemo(
        () =>
            Object.entries(sessions).filter(([key]) =>
                key.toLowerCase().includes(search.toLowerCase())
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [sessions, search]
    )

    return (
        <BaseListing>
            <ManageListHeader
                title="Sessions"
                count={Object.keys(sessions).length}
                addLabel="Add Session"
                searchPlaceholder="Search sessions..."
                search={search}
                onSearchChange={setSearch}
                onAdd={() => {
                    setFormData({})
                    setFormType("add")
                }}
            />

            {entries.length === 0 && (
                <EmptyState
                    message={
                        search
                            ? "No sessions match your search."
                            : "No sessions yet. Add your first session to get started."
                    }
                />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {entries.map(([key, value]) => (
                    <button type="button" key={key}
                         className="min-h-11 text-left border border-primary-200 dark:border-primary-700
                            bg-white dark:bg-surface-dark text-text-light dark:text-text-dark
                            p-4 rounded-md text-sm shadow-sm hover:shadow-md hover:border-primary transition-shadow
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                         onClick={() => {
                             let _value: any = value
                             if (typeof _value.supersets === "string") {
                                 _value.supersets = _value.supersets.split(",")
                             }
                             setFormData(_value)
                             setFormType("edit")
                         }}>
                        <span className="font-bold">{key}</span>
                        <>
                            {(Array.isArray((value as any).supersets)
                                ? (value as any).supersets
                                : typeof (value as any).supersets === "string"
                                    ? (value as any).supersets.split(",")
                                    : []
                            ).map((e: string) => (
                                <div className="text-xs text-text-muted-light dark:text-text-muted-dark"
                                     key={e}>
                                    {e}
                                </div>
                            ))}
                        </>
                    </button>
                ))}
            </div>

            {formType && (
                <SessionForm data={formData} type={formType} closeForm={() => setFormType("")}/>
            )}
        </BaseListing>
    )
}
