import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { UiStyleProvider } from '@dyordsabuzo/ui-components';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <UiStyleProvider uiStyle="soft">
            <App/>
        </UiStyleProvider>
    </React.StrictMode>
);
