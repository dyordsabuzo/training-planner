import {ExerciseListing} from "../management/ExerciseListing";
import React, {useState} from "react";
import {useNavigate, useParams} from "react-router";
import {faTableList} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {SupersetListing} from "../management/SupersetListing";
import {SessionListing} from "../management/SessionListing";
import {PlanListing} from "../management/PlanListing";
import {RelationshipMap} from "../management/RelationshipMap";
import {LibraryBrowser} from "../management/LibraryBrowser";
import {BUILD_SECTIONS, MORE_SECTIONS, ManageHero} from "../management/ManageHero";
import {useMediaQuery} from "../common/useMediaQuery";
import {chipClassName} from "./others/HeroTile";

import WrapperPage from "./WrapperPage";

const categories: string[] = [...BUILD_SECTIONS, ...MORE_SECTIONS];

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
    const [tableView, setTableView] = useState(false);
    // Bumped by the unused hint, so filters already set on the list can't
    // hide some of the exercises it counted.
    const [exerciseListKey, setExerciseListKey] = useState(0);

    // Phones always get rows: the tables are too wide for them.
    const isNarrow = useMediaQuery("(max-width: 639px)");
    const viewMode = tableView && !isNarrow ? "table" : "card";

    // The URL is the source of truth for which tab is active (so links,
    // bookmarks, and browser back/forward all work) — switching tabs pushes
    // a new location rather than touching local state directly.
    const tabClicked = (value: string) => {
        navigate(`/training-planner/manage/${categoryToSlug(value)}`);
    }

    const showUnused = () => {
        setExerciseListKey((key) => key + 1);
        navigate("/training-planner/manage/exercises?unused=1");
    }

    const tableToggle = isNarrow ? undefined : (
        <button
            type="button"
            aria-label="Table view"
            aria-pressed={tableView}
            title="Table view"
            onClick={() => setTableView(!tableView)}
            className={`${chipClassName(tableView)} flex items-center justify-center min-w-11`}
        >
            <FontAwesomeIcon icon={faTableList} />
        </button>
    );

    return (
        <WrapperPage className="max-w-4xl">
            <div className="w-full flex flex-col gap-4 pt-8">
                <div className="px-2">
                    <ManageHero activeTab={activeTab} onSelect={tabClicked} onShowUnused={showUnused} />
                </div>

                {/* Rows and chips are gray-50, the same as the light page, so they need a white surface. */}
                <div className="px-2">
                <div className="w-full p-2 sm:p-4 rounded-2xl bg-white dark:bg-transparent shadow-sm dark:shadow-none">
                    {activeTab === "Exercises" && <ExerciseListing key={exerciseListKey} viewMode={viewMode} headerTrailing={tableToggle}/>}
                    {activeTab === "Supersets" && <SupersetListing viewMode={viewMode} headerTrailing={tableToggle}/>}
                    {activeTab === "Sessions" && <SessionListing viewMode={viewMode} headerTrailing={tableToggle}/>}
                    {activeTab === "Plans" && <PlanListing viewMode={viewMode} headerTrailing={tableToggle}/>}
                    {activeTab === "Library" && <LibraryBrowser/>}
                    {activeTab === "Relationships" && <RelationshipMap/>}
                </div>
                </div>
            </div>
        </WrapperPage>
    )
}

export default ListingPage
