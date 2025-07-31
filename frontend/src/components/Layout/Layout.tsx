import React, { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import './Layout.scss';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Pass the toggleSidebar function to children
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { onToggleSidebar: toggleSidebar } as any);
    }
    return child;
  });

  return (
    <div className="layout">
      <Sidebar />
      <div className={`layout__main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {childrenWithProps}
      </div>
    </div>
  );
};

export default Layout; 