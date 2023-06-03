import React from "react";
import SessionPage from "./SessionPage";
import MainPage from "./MainPage";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import ListingPage from "./ListingPage";
import ErrorPage from "./ErrorPage";
import Navigation from "../components/Navigation";

const PageController = () => {
    return (
        <MainPage/>
    )
}

export default PageController