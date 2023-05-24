import React, {useContext} from "react";
import SessionPage from "./SessionPage";
import SessionContext from "../context/SessionContext";
import MainPage from "./MainPage";

const PageController = () => {
    // const sessionContext = useContext(SessionContext)
    //
    // if (sessionContext.isSessionOn) {
    //     return (
    //         <div className={`grid place-content-center`}>
    //             <SessionPage/>
    //         </div>
    //     )
    // }

    return (
        <div className={`grid place-content-center`}>
            <MainPage/>
        </div>
    )
}

export default PageController;