import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TabSelectionContextProvider } from '../../src/contexts/TabSelectionContext';
import { DragSelectionContextProvider } from '../../src/contexts/DragSelectionContext';
import { TabGroupProvider } from '@/src/contexts/TabGroupContext';
import { TabGroupColorProvider } from '../../src/contexts/TabGroupColorContext';
import { DeletionStateProvider } from '../../src/contexts/DeletionStateContext';
import { ToastProvider } from '../../src/components/ToastProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <TabGroupColorProvider>
        <TabGroupProvider>
          <TabSelectionContextProvider>
            <DragSelectionContextProvider>
              <DeletionStateProvider>
                <App />
              </DeletionStateProvider>
            </DragSelectionContextProvider>
          </TabSelectionContextProvider>
        </TabGroupProvider>
      </TabGroupColorProvider>
    </ToastProvider>
  </React.StrictMode>
);
