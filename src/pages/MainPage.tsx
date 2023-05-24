import React, {useContext, useState} from "react";
import SessionContext from "../context/SessionContext";
import ListingPage from "./ListingPage";
import SourceDataContext from "../context/SourceDataContext";

const MainPage = () => {
    const [listing, setListing] = useState<string>("")
    const sessionContext = useContext(SessionContext)
    const sourceContext = useContext(SourceDataContext)

    return (
        <div className={`flex flex-col gap-8 p-8 min-w-[30rem]`}>
            {!listing && (
                <>
                    <button type={"button"}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-6 px-4 rounded"
                            onClick={() => sessionContext.setIsSessionOn(true)}>
                        START SESSION
                    </button>

                    <div className={`flex flex-col border border-1 gap-2 p-4`}>
                        <button type={"button"}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-6 px-4 rounded"
                                onClick={() => {
                                    sourceContext.initialise()
                                    setListing("exercises")
                                }}>
                            EXERCISES
                        </button>
                        <button type={"button"}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-6 px-4 rounded"
                                onClick={() => setListing("supersets")}>
                            SUPERSETS
                        </button>
                    </div>
                </>
            )}

            {listing && <ListingPage list={listing}/>}
        </div>
    )
}

export default MainPage