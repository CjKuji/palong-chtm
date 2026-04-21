'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  // Load saved state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved) {
      setCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const toggleSidebar = () => {
    setCollapsed(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}