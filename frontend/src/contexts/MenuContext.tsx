import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MenuContextType {
  activeMenu: string | null;
  setActiveMenu: (menuId: string | null) => void;
  closeAllMenus: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

interface MenuProviderProps {
  children: ReactNode;
}

export const MenuProvider: React.FC<MenuProviderProps> = ({ children }) => {
  const [activeMenu, setActiveMenuState] = useState<string | null>(null);

  const setActiveMenu = (menuId: string | null) => {
    setActiveMenuState(menuId);
  };

  const closeAllMenus = () => {
    setActiveMenuState(null);
  };

  return (
    <MenuContext.Provider value={{ activeMenu, setActiveMenu, closeAllMenus }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};
