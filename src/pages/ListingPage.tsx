import ExerciseListing from "../management/ExerciseListing";
import React, {useContext, useEffect, useState} from "react";
import SupersetListing from "../management/SupersetListing";
import SessionListing from "../management/SessionListing";
import PlanListing from "../management/PlanListing";
import WrapperPage from "./WrapperPage";
import SourceDataContext from "../context/SourceDataContext";

type ListingPageProps = {
    list: string
}

const ListingPage: React.FC<ListingPageProps> = ({list}) => {
    const [activeTab, setActiveTab] = useState<string>("Exercises");
    const [isSourceInitialised, setIsSourceInitialised] = useState(false)
    const sourceContext = useContext(SourceDataContext)

    const tabClicked = (value: string) => {
        setActiveTab(value);
    }

    const activeCssTab = `
        text-white bg-gray-400 active dark:bg-gray-800 dark:text-white
    `;

    const standardCssTab = `
        inline-block p-3 rounded-t-lg hover:text-gray-600 hover:bg-gray-200 
        dark:hover:bg-gray-800 dark:hover:text-gray-300
    `;

    useEffect(() => {
        if (!isSourceInitialised) {
            sourceContext.initialise();
            setIsSourceInitialised(true)
        }
        return () => {
        }
    }, [isSourceInitialised, sourceContext])

    return (
        <WrapperPage>
            <div className={`w-full flex flex-col gap-2 pt-4`}>
                <div className={'w-full px-2 space-x-2 text-sm flex items-between place-content-between'}>
                    <ul className={`
                            w-full
                            flex flex-nowrap text-sm font-medium text-center text-gray-500 border-b 
                            border-gray-200 dark:border-gray-700 dark:text-gray-400`}>
                        {["Exercises", "Supersets", "Sessions", "Plans"].map(category => (
                            <li className="mr-1" key={category}>
                                <button
                                    className={`
                                    ${standardCssTab}
                                    ${activeTab === category ? activeCssTab : ""}`}
                                    onClick={(e) => tabClicked(category)}>
                                    {category}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className={`w-full`}>
                    {activeTab === "Exercises" && <ExerciseListing/>}
                    {activeTab === "Supersets" && <SupersetListing/>}
                    {activeTab === "Sessions" && <SessionListing/>}
                    {activeTab === "Plans" && <PlanListing/>}
                </div>
            </div>
        </WrapperPage>
    )
}

export default ListingPage