import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TabSelectionContextProvider } from '../../src/contexts/TabSelectionContext';
import { TabGroupProvider } from '@/src/contexts/TabGroupContext';
import { DeletionProvider } from '../../src/contexts/DeletionContext';
import { ToastProvider } from '../../src/components/ToastProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <DeletionProvider>
        <TabGroupProvider>
          <TabSelectionContextProvider>
            <App />
          </TabSelectionContextProvider>
        </TabGroupProvider>
      </DeletionProvider>
    </ToastProvider>
  </React.StrictMode>
);
