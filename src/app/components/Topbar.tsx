'use client';

import { useEffect, useState } from 'react';
import ProfileCard from './ProfileCard';
import { useSidebar } from '@/app/context/SidebarContext';

export default function Topbar() {
  const { collapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <header
      className={`
        fixed top-0 right-0 z-20
        h-16 flex items-center justify-between
        px-4 bg-white/80 backdrop-blur-md
        border-b border-gray-200
        transition-all duration-300
        ${isMobile ? 'left-0' : collapsed ? 'left-20' : 'left-64'}
      `}
    >
      {/* TITLE */}
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-teal-900">
          Admin Dashboard
        </h1>
        <p className="text-xs text-gray-500 hidden sm:block">
          CHTM-RRS Hotel Management System
        </p>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-4">

        {/* NOTIFICATION */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-xl hover:bg-gray-100"
        >
          🔔
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
        </button>

        {/* PROFILE */}
        <div className="border-l pl-3">
          <ProfileCard />
        </div>
      </div>

      {/* SIMPLE NOTIF DROPDOWN */}
      {showNotifications && (
        <div className="absolute right-4 top-16 w-80 bg-white shadow-xl rounded-xl border p-3">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-gray-500 mt-2">
            No new notifications
          </p>
        </div>
      )}
    </header>
  );
}