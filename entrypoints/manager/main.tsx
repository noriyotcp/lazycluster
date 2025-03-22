import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TabSelectionContextProvider } from '../../src/contexts/TabSelectionContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TabSelectionContextProvider>
      <App />
    </TabSelectionContextProvider>
  </React.StrictMode>
);
