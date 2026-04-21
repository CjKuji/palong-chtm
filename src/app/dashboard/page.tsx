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

  // Responsive check
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1️⃣ Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          return router.push('/');
        }

        setCurrentUser(user);

        // 2️⃣ Fetch user profile and role from users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role, fname, lname')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          console.error('Profile fetch error:', profileError);
          await supabase.auth.signOut();
          return router.push('/');
        }

        // 3️⃣ Check if user is admin
        if (profile.role !== 'admin' && profile.role !== 'super_admin') {
          await supabase.auth.signOut();
          return router.push('/');
        }

        setUserRole(profile.role);
        setAuthLoading(false);

        const now = new Date().toISOString();

        const [roomsRes, occupiedRes, upcomingRes] = await Promise.all([
          // Total rooms count
          supabase.from('rooms').select('*', { count: 'exact', head: true }),

          // Occupied rooms: currently checked-in and not yet checked-out
          supabase
            .from('bookings')
            .select(`
              id, start_at, end_at,
              checked_in_at, checked_out_at,
              users ( fname, lname ),
              rooms ( room_number )
            `)
            .not('checked_in_at', 'is', null)
            .is('checked_out_at', null),

          // Upcoming bookings: approved and not yet started
          supabase
            .from('bookings')
            .select(`
              id, start_at, end_at,
              users ( fname, lname ),
              rooms ( room_number )
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
        console.error('Dashboard data fetch error:', error);
        setLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  // Helper to display full user name
  const getFullName = (user: any) => user ? `${user.fname} ${user.lname}` : '';

  // Show auth loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans antialiased">
      <Sidebar activeMenu="dashboard" />

      <main className={`flex-1 transition-all duration-300 w-full ${isMobile ? 'ml-0' : collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="w-full">
          <Topbar />
        </div>

        <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 ${isMobile ? 'mt-28' : 'mt-16 sm:mt-20'}`}>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">Dashboard Overview</h1>
              {currentUser && (
                <p className="text-xs sm:text-sm text-gray-600 mt-2">
                  Welcome, <span className="font-semibold">{currentUser.email}</span> • <span className="capitalize text-pink-600 font-medium">{userRole}</span>
                </p>
              )}
            </div>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
              {new Date().toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' })}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6 mb-6 md:mb-8 lg:mb-10">
            <StatCard title="Total Rooms" value={loadingData ? '...' : totalRooms.toString()} icon="🏠" color="blue" />
            <StatCard title="Occupied" value={loadingData ? '...' : occupiedRooms.length.toString()} icon="👤" color="pink" />
            <StatCard title="Available" value={loadingData ? '...' : (totalRooms - occupiedRooms.length).toString()} icon="✓" color="green" />
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-7 lg:gap-8">
            {/* Occupied Rooms */}
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 w-full">
              <div className="bg-gradient-to-r from-pink-600 to-pink-500 px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-t-xl">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-lg">🏨</span>Currently Occupied
                </h2>
              </div>
              <div className="p-4 sm:p-5 md:p-6">
                {loadingData ? (
                  <div className="flex justify-center items-center h-32 sm:h-40">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : occupiedRooms.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                          <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                          <th className="hidden sm:table-cell px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                          <th className="hidden md:table-cell px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                          <th className="sm:hidden px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {occupiedRooms.map((booking: any) => (
                          <tr key={booking.id} className="hover:bg-pink-50 transition-colors duration-150">
                            <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{booking.rooms?.room_number}</td>
                            <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700">{getFullName(booking.users)}</td>
                            <td className="hidden sm:table-cell px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">{new Date(booking.start_at).toLocaleDateString()}</td>
                            <td className="hidden md:table-cell px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">{new Date(booking.end_at).toLocaleDateString()}</td>
                            <td className="sm:hidden px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs text-gray-600">{new Date(booking.start_at).toLocaleDateString().slice(5)}-{new Date(booking.end_at).toLocaleDateString().slice(5)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <p className="text-sm text-gray-500">No occupied rooms</p>
                  </div>
                )}
                <div className="mt-4 sm:mt-5 md:mt-6 text-right border-t border-gray-100 pt-3 sm:pt-4">
                  <Link href="/room" className="text-xs sm:text-sm text-pink-600 hover:text-pink-800 font-medium inline-flex items-center gap-1 group">
                    View all rooms <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Upcoming Reservations */}
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 w-full">
              <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-t-xl">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-lg">📅</span>Upcoming Reservations
                </h2>
              </div>
              <div className="p-4 sm:p-5 md:p-6">
                {loadingData ? (
                  <div className="flex justify-center items-center h-32 sm:h-40">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : upcomingBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                          <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                          <th className="hidden sm:table-cell px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                          <th className="hidden md:table-cell px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                          <th className="sm:hidden px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {upcomingBookings.map((booking: any) => (
                          <tr key={booking.id} className="hover:bg-teal-50 transition-colors duration-150">
                            <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700">{getFullName(booking.users)}</td>
                            <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{booking.rooms?.room_number}</td>
                            <td className="hidden sm:table-cell px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">{new Date(booking.start_at).toLocaleDateString()}</td>
                            <td className="hidden md:table-cell px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">{new Date(booking.end_at).toLocaleDateString()}</td>
                            <td className="sm:hidden px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs text-gray-600">{new Date(booking.start_at).toLocaleDateString().slice(5)}-{new Date(booking.end_at).toLocaleDateString().slice(5)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8"><p className="text-sm text-gray-500">No upcoming reservations</p></div>
                )}
                <div className="mt-4 sm:mt-5 md:mt-6 text-right border-t border-gray-100 pt-3 sm:pt-4">
                  <Link href="/reservation" className="text-xs sm:text-sm text-teal-600 hover:text-teal-800 font-medium inline-flex items-center gap-1 group">
                    View all reservations <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}