"use client";

import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Topbar from '@/app/components/Topbar';
import { useSidebar } from '@/app/context/SidebarContext';

type NotificationKey = 'checkIns' | 'checkOuts' | 'reservations' | 'ratings';
type AppearanceKey = 'darkMode';

interface NotificationsState {
  checkIns: boolean;
  checkOuts: boolean;
  reservations: boolean;
  ratings: boolean;
}

interface AppearanceState {
  darkMode: boolean;
}

export default function SystemSettings() {
  const { collapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [_isTablet, setIsTablet] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [loginAlertEnabled, setLoginAlertEnabled] = useState(true);

  // Check screen size with multiple breakpoints
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const [notifications, setNotifications] = useState<NotificationsState>({
    checkIns: true,
    checkOuts: true,
    reservations: true,
    ratings: true,
  });

  const [appearance, setAppearance] = useState<AppearanceState>({
    darkMode: true,
  });

  const tabs = [
    { id: 'admin', label: 'Admin Settings', icon: '⚙️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ];

  const toggleNotification = (key: NotificationKey) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAppearance = (key: AppearanceKey) => {
    setAppearance((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const notifItems: { key: NotificationKey; label: string }[] = [
    { key: 'checkIns', label: 'Check-Ins' },
    { key: 'checkOuts', label: 'Check-outs' },
    { key: 'reservations', label: 'Reservations' },
    { key: 'ratings', label: 'Ratings' },
  ];

  // ✅ ARIA-compliant Toggle component
  const Toggle = ({
    enabled,
    onClick,
    label,
  }: {
    enabled: boolean;
    onClick: () => void;
    label?: string;
  }) => {
    const isPressed: boolean = Boolean(enabled); // ensure explicit boolean
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isPressed}
        aria-label={label || (isPressed ? 'Enabled' : 'Disabled')}
        className={`relative w-12 h-6 rounded-full transition ${
          enabled ? 'bg-teal-600' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute w-4 h-4 bg-white rounded-full top-1 transition ${
            enabled ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeMenu="settings" />

      <main
        className={`flex-1 transition-all duration-300 w-full ${
          isMobile ? 'ml-0' : collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <div className="w-full">
          <Topbar />
        </div>

        <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-10 gap-4 mt-24 sm:mt-32">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
              Settings
            </h1>
            <button className="w-full sm:w-auto px-4 py-2 bg-teal-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-teal-700 transition-colors min-w-[120px]">
              Save Changes
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 sm:gap-2 px-4 sm:px-5 md:px-6 py-3 sm:py-4 text-xs sm:text-sm md:text-base font-medium transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-pink-600 text-pink-600 bg-pink-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm sm:text-base">{tab.icon}</span>
                  <span className={isMobile ? 'hidden' : 'inline'}>{tab.label}</span>
                  {isMobile && <span className="sr-only">{tab.label}</span>}
                </button>
              ))}
            </div>

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="p-4 sm:p-5 md:p-6 space-y-4 md:space-y-5">
                {notifItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex flex-row justify-between items-center gap-4 py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm sm:text-base text-gray-700">{item.label}</span>
                    <Toggle
                      enabled={notifications[item.key]}
                      onClick={() => toggleNotification(item.key)}
                      label={item.label}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="p-4 sm:p-5 md:p-6">
                <div className="flex flex-row justify-between items-center gap-4 py-2">
                  <span className="text-sm sm:text-base text-gray-700">Dark Mode</span>
                  <Toggle
                    enabled={appearance.darkMode}
                    onClick={() => toggleAppearance('darkMode')}
                    label="Dark Mode"
                  />
                </div>
              </div>
            )}

            {/* Admin Tab */}
            {activeTab === 'admin' && (
              <div className="p-4 sm:p-5 md:p-6 space-y-5 md:space-y-6">
                <div className="flex flex-row justify-between items-center gap-4 py-2 border-b border-gray-100">
                  <div>
                    <span className="text-sm sm:text-base text-gray-700 block">
                      Two-Factor Authentication
                    </span>
                    <span className="text-xs text-gray-500 mt-1 hidden sm:block">
                      Add an extra layer of security
                    </span>
                  </div>
                  <Toggle
                    enabled={twoFactorEnabled}
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    label="Two-Factor Authentication"
                  />
                </div>

                <div className="flex flex-row justify-between items-center gap-4 py-2">
                  <div>
                    <span className="text-sm sm:text-base text-gray-700 block">Login Alerts</span>
                    <span className="text-xs text-gray-500 mt-1 hidden sm:block">
                      Get notified of new sign-ins
                    </span>
                  </div>
                  <Toggle
                    enabled={loginAlertEnabled}
                    onClick={() => setLoginAlertEnabled(!loginAlertEnabled)}
                    label="Login Alerts"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Settings Summary - Mobile Only */}
          {isMobile && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="bg-teal-50 p-3 rounded-lg text-center">
                <div className="text-xs text-teal-700 font-medium">Active Settings</div>
                <div className="text-lg font-bold text-teal-800">
                  {Object.values(notifications).filter(Boolean).length +
                    (twoFactorEnabled ? 1 : 0) +
                    (loginAlertEnabled ? 1 : 0)}
                </div>
              </div>
              <div className="bg-pink-50 p-3 rounded-lg text-center">
                <div className="text-xs text-pink-700 font-medium">Tabs</div>
                <div className="text-lg font-bold text-pink-800">{tabs.length}</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}