import { createContext, useContext } from 'react';
import { useResource } from '@/hooks/useResource';
import { homeService } from '@/services/client/homeService';
import { useStoreCatalogRefresh } from '@/hooks/useStoreCatalogRefresh';
import { useStockUpdates } from '@/hooks/useStockUpdates';

const HomeContext = createContext(null);
export function HomeProvider({ children }) {
  useStockUpdates();
  const home = useResource(() => homeService.get(), []);
  useStoreCatalogRefresh(home.reload);
  return <HomeContext.Provider value={home}>{children}</HomeContext.Provider>;
}
export const useHome = () => useContext(HomeContext);
