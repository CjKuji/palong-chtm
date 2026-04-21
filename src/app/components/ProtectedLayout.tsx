'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useSidebar } from '@/app/context/SidebarContext';

export default function ProtectedLayout({ 
  children, 
  activeMenu 
}: { 
  children: React.ReactNode; 
  activeMenu: string;
}) {
  const { collapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Calculate topbar height (adjust if needed)
  const topbarHeight = '64px';

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeMenu={activeMenu} />
      <Topbar />
      
      {/* Main Content */}
      <main 
        className="transition-all duration-300"
        style={{ 
          marginLeft: isMobile ? '0' : (collapsed ? '80px' : '256px'),
          marginTop: topbarHeight,
          width: isMobile ? '100%' : `calc(100% - ${collapsed ? '80px' : '256px'})`,
        }}
      >
        <div className="p-3 sm:p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}