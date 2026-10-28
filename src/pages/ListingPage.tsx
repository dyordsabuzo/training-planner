import {ExerciseListing} from "../management/ExerciseListing";
import React, {useState} from "react";
import {useNavigate, useParams} from "react-router";
import {faSliders, faTableCellsLarge, faTableList} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {SupersetListing} from "../management/SupersetListing";
import {SessionListing} from "../management/SessionListing";
import {PlanListing} from "../management/PlanListing";
import {RelationshipMap} from "../management/RelationshipMap";
import {LibraryBrowser} from "../management/LibraryBrowser";

import WrapperPage from "./WrapperPage";
import { Tabs } from "@dyordsabuzo/ui-components";

const categories = ["Exercises", "Supersets", "Sessions", "Plans", "Library", "Relationships"];

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

    // The URL is the source of truth for which tab is active (so links,
    // bookmarks, and browser back/forward all work) — switching tabs pushes
    // a new location rather than touching local state directly.
    const tabClicked = (value: string) => {
        navigate(`/training-planner/manage/${categoryToSlug(value)}`);
    }

    return (
        <WrapperPage className="max-w-4xl">
            <div className="w-full flex flex-col gap-4 pt-8">
                <div className="px-2">
                    <h1 className="flex items-center gap-3 text-2xl font-bold text-text-light dark:text-text-dark">
                        <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-800/40 text-primary dark:text-primary-300">
                            <FontAwesomeIcon icon={faSliders} className="text-base" />
                        </span>
                        Manage training setup
                    </h1>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
                        Build exercises, supersets, sessions and plans.
                    </p>
                </div>

                <div className="px-2">
                    <Tabs tabs={categories} activeTab={activeTab} onChange={tabClicked} ariaLabel="Manage sections" />
                </div>

                {activeTab !== "Relationships" && activeTab !== "Library" && (
                    <div className="flex justify-end px-2">
                        <div
                            role="radiogroup"
                            aria-label="View mode"
                            className="inline-flex gap-1 p-1 rounded-full bg-gray-100 dark:bg-gray-800/60"
                        >
                            <button
                                type="button"
                                role="radio"
                                aria-checked={viewMode === "card"}
                                aria-label="Card view"
                                onClick={() => setViewMode("card")}
                                className={`min-h-11 min-w-11 flex items-center justify-center px-3 rounded-full transition-colors
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10
                                    ${
                                        viewMode === "card"
                                            ? "bg-primary text-white shadow-sm shadow-primary/30"
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
                                className={`min-h-11 min-w-11 flex items-center justify-center px-3 rounded-full transition-colors
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10
                                    ${
                                        viewMode === "table"
                                            ? "bg-primary text-white shadow-sm shadow-primary/30"
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
                    {activeTab === "Library" && <LibraryBrowser/>}
                    {activeTab === "Relationships" && <RelationshipMap/>}
                </div>
            </div>
        </WrapperPage>
    )
}

export default ListingPage
