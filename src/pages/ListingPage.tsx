import {ExerciseListing} from "../management/ExerciseListing";
import React, {useContext, useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router";
import {faTableCellsLarge, faTableList} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {SupersetListing} from "../management/SupersetListing";
import {SessionListing} from "../management/SessionListing";
import {PlanListing} from "../management/PlanListing";
import {RelationshipMap} from "../management/RelationshipMap";

import WrapperPage from "./WrapperPage";
import SourceDataContext from "../context/SourceDataContext";
import { Tabs } from "@dyordsabuzo/ui-components";

const categories = ["Exercises", "Supersets", "Sessions", "Plans", "Relationships"];

const categoryToSlug = (category: string) => category.toLowerCase();

// A URL segment that doesn't match any known category (missing, mistyped,
// or stale from a since-removed tab) falls back to the first tab rather
// than rendering nothing.
const slugToCategory = (slug?: string) =>
    categories.find((c) => categoryToSlug(c) === slug?.toLowerCase()) ?? categories[0];

const ListingPage: React.FC = () => {
    const { tab } = useParams();
    const navigate = useNavigate();
    const activeTab = slugToCategory(tab);
    const [viewMode, setViewMode] = useState<"card" | "table">("card");
    const [isSourceInitialised, setIsSourceInitialised] = useState(false)
    const sourceContext = useContext(SourceDataContext)

    // The URL is the source of truth for which tab is active (so links,
    // bookmarks, and browser back/forward all work) — switching tabs pushes
    // a new location rather than touching local state directly.
    const tabClicked = (value: string) => {
        navigate(`/training-planner/manage/${categoryToSlug(value)}`);
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

                <div className="px-2">
                    <Tabs tabs={categories} activeTab={activeTab} onChange={tabClicked} ariaLabel="Manage sections" />
                </div>

                {activeTab !== "Relationships" && (
                    <div className="flex justify-end px-2">
                        <div
                            role="radiogroup"
                            aria-label="View mode"
                            className="inline-flex rounded-full border border-gray-300 dark:border-gray-600
                                bg-gray-100 dark:bg-gray-800 overflow-hidden"
                        >
                            <button
                                type="button"
                                role="radio"
                                aria-checked={viewMode === "card"}
                                aria-label="Card view"
                                onClick={() => setViewMode("card")}
                                className={`min-h-11 min-w-11 flex items-center justify-center px-3
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10
                                    ${
                                        viewMode === "card"
                                            ? "bg-primary text-white"
                                            : "text-text-light dark:text-text-dark hover:text-primary dark:hover:text-primary-300"
                                    }`}
                            >
                                <FontAwesomeIcon icon={faTableCellsLarge} />
                            </button>
                            <button
                                type="button"
                                role="radio"
                                aria-checked={viewMode === "table"}
                                aria-label="Table view"
                                onClick={() => setViewMode("table")}
                                className={`min-h-11 min-w-11 flex items-center justify-center px-3
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10
                                    ${
                                        viewMode === "table"
                                            ? "bg-primary text-white"
                                            : "text-text-light dark:text-text-dark hover:text-primary dark:hover:text-primary-300"
                                    }`}
                            >
                                <FontAwesomeIcon icon={faTableList} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="w-full px-2">
                    {activeTab === "Exercises" && <ExerciseListing viewMode={viewMode}/>}
                    {activeTab === "Supersets" && <SupersetListing viewMode={viewMode}/>}
                    {activeTab === "Sessions" && <SessionListing viewMode={viewMode}/>}
                    {activeTab === "Plans" && <PlanListing viewMode={viewMode}/>}
                    {activeTab === "Relationships" && <RelationshipMap/>}
                </div>
            </div>
        </WrapperPage>
    )
}

export default ListingPage
