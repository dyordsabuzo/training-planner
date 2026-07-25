import { createContext, useState, useEffect, ReactNode } from "react";

type _Props = {
  children: ReactNode;
};

const STORAGE_KEY = "sidebar-collapsed";

const SidebarContext = createContext({
  isCollapsed: false,
  toggleSidebar: () => {},
});

export const SidebarContextProvider: React.FC<_Props> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === "true"
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed((current) => !current);
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;
