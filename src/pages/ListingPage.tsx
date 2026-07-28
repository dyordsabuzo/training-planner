import {ExerciseListing} from "../management/ExerciseListing";
import React, {useContext, useEffect, useRef, useState} from "react";
import {faChevronLeft, faChevronRight} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
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

const TAB_SCROLL_AMOUNT = 160;

const ListingPage: React.FC<ListingPageProps> = ({list}) => {
    const [activeTab, setActiveTab] = useState<string>("Exercises");
    const [isSourceInitialised, setIsSourceInitialised] = useState(false)
    const sourceContext = useContext(SourceDataContext)
    const tabListRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const tabClicked = (value: string) => {
        setActiveTab(value);
    }

    const updateScrollState = () => {
        const el = tabListRef.current;
        if (!el) {
            return;
        }
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    }

    const scrollTabs = (direction: "left" | "right") => {
        tabListRef.current?.scrollBy({
            left: direction === "left" ? -TAB_SCROLL_AMOUNT : TAB_SCROLL_AMOUNT,
            behavior: "smooth",
        });
    }

    useEffect(() => {
        updateScrollState();
        const el = tabListRef.current;
        if (!el) {
            return;
        }
        el.addEventListener("scroll", updateScrollState);
        window.addEventListener("resize", updateScrollState);
        return () => {
            el.removeEventListener("scroll", updateScrollState);
            window.removeEventListener("resize", updateScrollState);
        }
    }, [])

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

                <div className="flex items-center gap-1 px-2">
                    <button
                        type="button"
                        onClick={() => scrollTabs("left")}
                        disabled={!canScrollLeft}
                        aria-label="Show previous tabs"
                        className="min-h-11 min-w-11 shrink-0 flex items-center justify-center rounded-full
                            text-secondary dark:text-secondary-200
                            hover:bg-gray-50 dark:hover:bg-gray-800
                            disabled:opacity-30 disabled:pointer-events-none
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>

                    <div
                        ref={tabListRef}
                        role="tablist"
                        aria-label="Manage sections"
                        className="flex gap-1 overflow-x-auto scroll-smooth
                            [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

                    <button
                        type="button"
                        onClick={() => scrollTabs("right")}
                        disabled={!canScrollRight}
                        aria-label="Show next tabs"
                        className="min-h-11 min-w-11 shrink-0 flex items-center justify-center rounded-full
                            text-secondary dark:text-secondary-200
                            hover:bg-gray-50 dark:hover:bg-gray-800
                            disabled:opacity-30 disabled:pointer-events-none
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
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
