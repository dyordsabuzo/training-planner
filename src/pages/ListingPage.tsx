import {ExerciseListing} from "../management/ExerciseListing";
import React, {useContext, useEffect, useState} from "react";
import {SupersetListing} from "../management/SupersetListing";
import {SessionListing} from "../management/SessionListing";
import {PlanListing} from "../management/PlanListing";
import {RelationshipMap} from "../management/RelationshipMap";
import WrapperPage from "./WrapperPage";
import SourceDataContext from "../context/SourceDataContext";

type ListingPageProps = {
    list: string
}

const categories = ["Exercises", "Supersets", "Sessions", "Plans", "Relationships"];

const ListingPage: React.FC<ListingPageProps> = ({list}) => {
    const [activeTab, setActiveTab] = useState<string>("Exercises");
    const [isSourceInitialised, setIsSourceInitialised] = useState(false)
    const sourceContext = useContext(SourceDataContext)

    const tabClicked = (value: string) => {
        setActiveTab(value);
    }

    useEffect(() => {
        if (!isSourceInitialised) {
            sourceContext.initialise();
            setIsSourceInitialised(true)
        }
        return () => {
        }
    }, [isSourceInitialised, sourceContext])

    return (
        <WrapperPage className="max-w-4xl">
            <div className="w-full flex flex-col gap-4 pt-4">
                <h1 className="px-2 text-2xl font-bold text-text-light dark:text-text-dark">
                    Manage training setup
                </h1>

                <div
                    role="tablist"
                    aria-label="Manage sections"
                    className="flex gap-1 px-2 overflow-x-auto"
                >
                    {categories.map(category => (
                        <button
                            key={category}
                            role="tab"
                            aria-selected={activeTab === category}
                            className={`min-h-11 shrink-0 px-4 rounded-full text-sm font-medium
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                                ${
                                    activeTab === category
                                        ? "bg-primary text-white"
                                        : "text-text-light dark:text-text-dark hover:bg-primary-50 dark:hover:bg-primary-800/40"
                                }`}
                            onClick={() => tabClicked(category)}>
                            {category}
                        </button>
                    ))}
                </div>

                <div className="w-full px-2">
                    {activeTab === "Exercises" && <ExerciseListing/>}
                    {activeTab === "Supersets" && <SupersetListing/>}
                    {activeTab === "Sessions" && <SessionListing/>}
                    {activeTab === "Plans" && <PlanListing/>}
                    {activeTab === "Relationships" && <RelationshipMap/>}
                </div>
            </div>
        </WrapperPage>
    )
}

export default ListingPage
