import React from "react";
import SessionPage from "./SessionPage";
import MainPage from "./MainPage";
import {Route, Routes} from "react-router-dom";
import ListingPage from "./ListingPage";
import ErrorPage from "./ErrorPage";

const PageController = () => {
    return (
        <Routes>
            <Route path={"/training-planner/*"} element={<MainPage/>} errorElement={<ErrorPage/>}/>
            <Route path={"/training-planner/manage"} element={<ListingPage list={"exercises"}/>}
                   errorElement={<ErrorPage/>}/>
            <Route path={"/training-planner/train"} element={<SessionPage/>} errorElement={<ErrorPage/>}/>
        </Routes>
    )
}

export default PageController