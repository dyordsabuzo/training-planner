import React from 'react';
import './App.css';
import PageController from "./pages/PageController";
import {SessionContextProvider} from "./context/SessionContext";

function App() {
    return (
        <div className={`w-full`}>
            <SessionContextProvider>
                <PageController/>
            </SessionContextProvider>
        </div>

    );
}

export default App;
