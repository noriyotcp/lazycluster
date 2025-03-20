import { createContext, useContext } from 'react';

interface WindowGroupContextProps {
  sequenceNumber: number;
}

const WindowGroupContext = createContext<WindowGroupContextProps | undefined>(undefined);

export const useWindowGroupContext = () => {
  const context = useContext(WindowGroupContext);
  if (!context) {
    throw new Error('useWindowGroupContext must be used within a WindowGroupContextProvider');
  }
  return context;
};

export const WindowGroupContextProvider = WindowGroupContext.Provider;
