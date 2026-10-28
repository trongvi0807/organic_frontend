import { createContext, useContext } from 'react';

const AdminAppearanceContext = createContext(false);
export const AdminAppearanceProvider = ({ children }) => <AdminAppearanceContext.Provider value={true}>{children}</AdminAppearanceContext.Provider>;
export const useAdminAppearance = () => useContext(AdminAppearanceContext);
