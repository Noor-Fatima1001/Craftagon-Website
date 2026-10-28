import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const StoreContext = createContext({ settings: null });

export function StoreProvider({ children }) {
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    api.get('/api/settings').then(setSettings).catch(() => {});
  }, []);
  return <StoreContext.Provider value={{ settings }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
