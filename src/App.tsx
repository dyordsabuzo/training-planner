import React from 'react';
import './App.css';
// import PageController from "./pages/PageController";
import {SessionContextProvider} from "./context/SessionContext";
import {SourceDataContextProvider} from "./context/SourceDataContext";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Navigation from "./components/Navigation";
import MainPage from "./pages/MainPage";
import ErrorPage from "./pages/ErrorPage";
import ListingPage from "./pages/ListingPage";
import SessionPage from "./pages/SessionPage";

function App() {
    return (
        <div className={`w-full`}>
            <SessionContextProvider>
                <SourceDataContextProvider>
                    <BrowserRouter>
                        <Navigation/>
                        <Routes>
                            <Route path={"/training-planner/*"} element={<MainPage/>} errorElement={<ErrorPage/>}/>
                            <Route path={"/training-planner/manage"} element={<ListingPage list={"exercises"}/>}
                                   errorElement={<ErrorPage/>}/>
                            <Route path={"/training-planner/train"} element={<SessionPage/>} errorElement={<ErrorPage/>}/>
                        </Routes>
                    </BrowserRouter>
                    {/*<PageController/>*/}
                </SourceDataContextProvider>
            </SessionContextProvider>
        </div>

    );
}

export default App;
