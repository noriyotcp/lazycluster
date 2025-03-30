import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TabSelectionContextProvider } from '../../src/contexts/TabSelectionContext';
import { TabGroupProvider } from '@/src/contexts/TabGroupContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TabGroupProvider>
      <TabSelectionContextProvider>
        <App />
      </TabSelectionContextProvider>
    </TabGroupProvider>
  </React.StrictMode>
);
