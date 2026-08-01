import { createContext, type PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

interface DataContextValue {
  revision: number;
  refreshData: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: PropsWithChildren) {
  const [revision, setRevision] = useState(0);
  const refreshData = useCallback(() => setRevision((value) => value + 1), []);
  const value = useMemo(() => ({ revision, refreshData }), [refreshData, revision]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataRevision(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataRevision must be used inside DataProvider.');
  }
  return context;
}
