import React from "react";
import SessionPage from "./SessionPage";
import MainPage from "./MainPage";
import {Route, Routes} from "react-router-dom";
import ListingPage from "./ListingPage";

const PageController = () => {
    return (
        <Routes>
            <Route path={"/training-planner/*"} element={<MainPage/>}/>
            <Route path={"/training-planner/manage"} element={<ListingPage list={"exercises"}/>}/>
            <Route path={"/training-planner/train"} element={<SessionPage/>}/>
        </Routes>
    )
}

export default PageController