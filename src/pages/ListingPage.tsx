import ExerciseListing from "../management/ExerciseListing";
import React, {useState} from "react";
import SupersetListing from "../management/SupersetListing";
import SessionListing from "../management/SessionListing";

type ListingPageProps = {
    list: string
}

const ListingPage: React.FC<ListingPageProps> = ({list}) => {
    const [activeTab, setActiveTab] = useState<string>("Exercises");
    const tabClicked = (value: string) => {
        setActiveTab(value);
    }

    const activeCssTab = `
        text-white bg-gray-400 active dark:bg-gray-800 dark:text-white
    `;

    const standardCssTab = `
        inline-block p-4 rounded-t-lg hover:text-gray-600 hover:bg-gray-200 
        dark:hover:bg-gray-800 dark:hover:text-gray-300
    `;

    // if (list === "exercises") {
    //     return <ExerciseListing/>
    // }

    return (
        <div className={`flex flex-col gap-4`}>
            <div className={'px-4 space-x-2 text-sm flex items-between place-content-between'}>
                <ul className={`
                    flex flex-nowrap text-sm font-medium text-center text-gray-500 border-b 
                    border-gray-200 dark:border-gray-700 dark:text-gray-400
                `}>
                    {["Exercises", "Supersets", "Sessions", "Plans"].map(category => (
                        <li className="mr-2" key={category}>
                            <a href="#" aria-current="page"
                               className={`
                                    ${standardCssTab}
                                    ${activeTab === category ? activeCssTab : ""}`}
                               onClick={(e) => tabClicked(category)}>
                                {category}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
            <div className={`p-4`}>
                {activeTab === "Exercises" && <ExerciseListing/>}
                {activeTab === "Supersets" && <SupersetListing/>}
                {activeTab === "Sessions" && <SessionListing/>}
            </div>
        </div>
    )
}

export default ListingPage