import React from 'react';
import './App.css';
import PageController from "./pages/PageController";
import {SessionContextProvider} from "./context/SessionContext";
import {SourceDataContextProvider} from "./context/SourceDataContext";

function App() {
    return (
        <div className={`w-full`}>
            <SessionContextProvider>
                <SourceDataContextProvider>
                    <PageController/>
                </SourceDataContextProvider>
            </SessionContextProvider>
        </div>

    );
}

export default App;
