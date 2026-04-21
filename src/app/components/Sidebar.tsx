'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/app/context/SidebarContext';

interface SidebarProps {
  activeMenu?: string;
}

export default function Sidebar({ activeMenu = 'dashboard' }: SidebarProps) {
  const { collapsed, toggleSidebar } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setMobileOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
    { id: 'reservation', label: 'Reservation', icon: '📅' },
    { id: 'archived', label: 'Archived', icon: '🗄️' },
    { id: 'room', label: 'Room', icon: '🏠' },
    { id: 'tools', label: 'Tool Inventory', icon: '🔧' },
    { id: 'settings', label: 'System Settings', icon: '⚙' },
  ];

  const getHref = (id: string) => {
    if (id === 'dashboard') return '/dashboard';
    if (id === 'archived') return '/archived';
    return `/${id}`;
  };

  const SidebarItem = ({ item }: any) => {
    const active = activeMenu === item.id;

    return (
      <Link
        href={getHref(item.id)}
        onClick={() => setMobileOpen(false)}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
          ${active
            ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
            : 'text-teal-100 hover:bg-teal-700/40 hover:text-white'}
          ${collapsed ? 'justify-center' : ''}
        `}
      >
        <span className="text-lg">{item.icon}</span>
        {!collapsed && (
          <span className="text-sm font-medium">{item.label}</span>
        )}
      </Link>
    );
  };

  // MOBILE
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 w-10 h-10 bg-teal-900 text-white rounded-xl shadow-lg"
        >
          ☰
        </button>

        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setMobileOpen(false)}
            />

            <aside className="fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-teal-950 to-teal-800 text-white z-50 shadow-2xl">
              <div className="p-4 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="font-bold text-lg">CHTM RRS</h1>
                    <p className="text-xs text-teal-200">Hotel Management</p>
                  </div>
                  <button onClick={() => setMobileOpen(false)}>✕</button>
                </div>
              </div>

              <div className="p-3 space-y-1">
                {menuItems.map((item) => (
                  <SidebarItem key={item.id} item={item} />
                ))}
              </div>
            </aside>
          </>
        )}
      </>
    );
  }

  // DESKTOP
  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen z-30
        transition-all duration-300
        ${collapsed ? 'w-20' : 'w-64'}
        bg-gradient-to-b from-teal-950 to-teal-800 text-white
        shadow-xl
      `}
    >
      {/* HEADER */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        {!collapsed ? (
          <div>
            <h1 className="font-bold text-lg">CHTM RRS</h1>
            <p className="text-xs text-teal-200">Hotel Management</p>
          </div>
        ) : (
          <div className="text-xl">🏨</div>
        )}

        <button
          onClick={toggleSidebar}
          className="text-white/70 hover:text-white"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* MENU */}
      <nav className="p-3 space-y-1">
        {menuItems.map((item) => (
          <SidebarItem key={item.id} item={item} />
        ))}
      </nav>

      {/* FOOTER */}
      <div className="absolute bottom-0 w-full p-3 text-center text-xs text-teal-300 border-t border-white/10">
        {collapsed ? 'v2.0' : 'Version 2.0.0'}
      </div>
    </aside>
  );
}