'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/app/components/Sidebar';
import Topbar from '@/app/components/Topbar';
import StatCard from '@/app/components/StatCard';
import { useSidebar } from '@/app/context/SidebarContext';

export default function Dashboard() {
  const router = useRouter();
  const { collapsed } = useSidebar();

  const [loadingData, setLoadingData] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [totalRooms, setTotalRooms] = useState(0);
  const [occupiedRooms, setOccupiedRooms] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  /* =========================================================
    RESPONSIVE
  ========================================================= */
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  /* =========================================================
    FETCH DASHBOARD DATA
  ========================================================= */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        /* AUTH USER */
        const { data: { user }, error: authError } =
          await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/');
          return;
        }

        setCurrentUser(user);

        /* PROFILE */
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role, fname, lname')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          router.push('/');
          return;
        }

        if (!['admin', 'super_admin'].includes(profile.role)) {
          await supabase.auth.signOut();
          router.push('/');
          return;
        }

        setUserRole(profile.role);
        setAuthLoading(false);

        const now = new Date().toISOString();

        /* DATA FETCH */
        const [roomsRes, occupiedRes, upcomingRes] = await Promise.all([
          supabase
            .from('rooms')
            .select('*', { count: 'exact', head: true }),

          /* OCCUPIED ROOMS */
          supabase
            .from('bookings')
            .select(`
              id,
              start_at,
              end_at,
              checked_in_at,
              checked_out_at,

              users (fname, lname),

              rooms (
                id,
                room_number,
                room_types (
                  id,
                  name
                )
              )
            `)
            .not('checked_in_at', 'is', null)
            .is('checked_out_at', null),

          /* UPCOMING */
          supabase
            .from('bookings')
            .select(`
              id,
              start_at,
              end_at,

              users (fname, lname),

              rooms (
                id,
                room_number,
                room_types (
                  id,
                  name
                )
              )
            `)
            .gt('start_at', now)
            .eq('status', 'approved')
            .order('start_at', { ascending: true })
            .limit(5),
        ]);

        setTotalRooms(roomsRes.count || 0);
        setOccupiedRooms(occupiedRes.data || []);
        setUpcomingBookings(upcomingRes.data || []);
        setLoadingData(false);
      } catch (error) {
        console.error('Dashboard error:', error);
        setLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  /* =========================================================
    HELPERS
  ========================================================= */
  const getFullName = (user: any) =>
    user ? `${user.fname ?? ''} ${user.lname ?? ''}`.trim() : '';

  const getRoomType = (booking: any) =>
    booking?.rooms?.room_types?.name ?? 'Unknown Type';

  /* =========================================================
    AUTH LOADING
  ========================================================= */
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  /* =========================================================
    UI
  ========================================================= */
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeMenu="dashboard" />

      <main className={`flex-1 ${isMobile ? 'ml-0' : collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Topbar />

        <div className="px-6 py-8 max-w-7xl mx-auto">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-10 mt-20">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Dashboard Overview
              </h1>

              {currentUser && (
                <p className="text-sm text-gray-600 mt-2">
                  Welcome <span className="font-semibold">{currentUser.email}</span>
                  {' '}•{' '}
                  <span className="text-pink-600 capitalize font-medium">
                    {userRole}
                  </span>
                </p>
              )}
            </div>

            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            <StatCard title="Total Rooms" value={loadingData ? '...' : totalRooms.toString()} icon="🏠" color="blue" />
            <StatCard title="Occupied" value={loadingData ? '...' : occupiedRooms.length.toString()} icon="👤" color="pink" />
            <StatCard title="Available" value={loadingData ? '...' : (totalRooms - occupiedRooms.length).toString()} icon="✓" color="green" />
          </div>

          {/* TABLES */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

            {/* OCCUPIED */}
            <div className="bg-white rounded-xl shadow-md">
              <div className="bg-pink-600 px-6 py-4 rounded-t-xl text-white font-semibold">
                🏨 Currently Occupied
              </div>

              <div className="p-6 overflow-x-auto">

                {loadingData ? (
                  <div className="h-32 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : occupiedRooms.length > 0 ? (
                  <table className="min-w-full text-sm">

                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Room Type</th>
                        <th className="p-2 text-left">Guest</th>
                        <th className="p-2 text-left">Check-in</th>
                        <th className="p-2 text-left">Check-out</th>
                      </tr>
                    </thead>

                    <tbody>
                      {occupiedRooms.map((b) => (
                        <tr key={b.id} className="border-b">

                          {/* FIXED */}
                          <td className="p-2 font-medium">
                            {getRoomType(b)}
                          </td>

                          <td className="p-2">
                            {getFullName(b.users)}
                          </td>

                          <td className="p-2">
                            {new Date(b.start_at).toLocaleDateString()}
                          </td>

                          <td className="p-2">
                            {new Date(b.end_at).toLocaleDateString()}
                          </td>

                        </tr>
                      ))}
                    </tbody>

                  </table>
                ) : (
                  <p className="text-gray-500 text-center py-6">
                    No occupied rooms
                  </p>
                )}

              </div>
            </div>

            {/* UPCOMING */}
            <div className="bg-white rounded-xl shadow-md">
              <div className="bg-teal-600 px-6 py-4 rounded-t-xl text-white font-semibold">
                📅 Upcoming Reservations
              </div>

              <div className="p-6 overflow-x-auto">

                {loadingData ? (
                  <div className="h-32 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : upcomingBookings.length > 0 ? (
                  <table className="min-w-full text-sm">

                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">Guest</th>
                        <th className="p-2 text-left">Room Type</th>
                        <th className="p-2 text-left">Check-in</th>
                        <th className="p-2 text-left">Check-out</th>
                      </tr>
                    </thead>

                    <tbody>
                      {upcomingBookings.map((b) => (
                        <tr key={b.id} className="border-b">

                          <td className="p-2">
                            {getFullName(b.users)}
                          </td>

                          {/* FIXED */}
                          <td className="p-2 font-medium">
                            {getRoomType(b)}
                          </td>

                          <td className="p-2">
                            {new Date(b.start_at).toLocaleDateString()}
                          </td>

                          <td className="p-2">
                            {new Date(b.end_at).toLocaleDateString()}
                          </td>

                        </tr>
                      ))}
                    </tbody>

                  </table>
                ) : (
                  <p className="text-gray-500 text-center py-6">
                    No upcoming reservations
                  </p>
                )}

              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}