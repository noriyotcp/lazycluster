import { createContext, useContext } from 'react';

const WindowGroupContext = createContext<number | undefined>(undefined);

export const useWindowGroupContext = (): number => {
  const value = useContext(WindowGroupContext);
  if (value === undefined) {
    throw new Error('useWindowGroupContext must be used within a WindowGroupContextProvider');
  }
  return value;
};

export const WindowGroupContextProvider = WindowGroupContext.Provider;
