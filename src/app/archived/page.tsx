'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Topbar from '@/app/components/Topbar';
import { useSidebar } from '@/app/context/SidebarContext';
import { supabase } from '@/lib/supabase';
import ArchivedModal from '@/app/components/modals/ArchivedModal';

export default function Archived() {
  const { collapsed } = useSidebar();

  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [archivedBookings, setArchivedBookings] = useState<any[]>([]);
  const [modalBooking, setModalBooking] = useState<any | null>(null);

  /* =========================================================
    RESPONSIVE
  ========================================================= */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* =========================================================
    FORMAT DATE
  ========================================================= */
  const formatDateTime = (date?: string) => {
    if (!date) return '—';

    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  /* =========================================================
    FETCH ARCHIVED BOOKINGS
  ========================================================= */
  useEffect(() => {
    const fetchArchived = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('archived_bookings')
          .select('*')
          .order('checked_out_at', { ascending: false });

        if (error) throw error;

        const enriched = (data || []).map((b: any) => ({
          ...b,

          guest_name:
            `${b.guest_fname ?? ''} ${b.guest_lname ?? ''}`.trim() ||
            'Unknown Guest',

          booked_by: b.booked_by ?? 'System User',
          archived_by_name: b.archived_by_name ?? 'Auto-archived',

          room_status: b.cleaned_at ? 'Cleaned' : 'Pending Cleanup',
        }));

        setArchivedBookings(enriched);
      } catch (err) {
        console.error('Error fetching archived bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArchived();
  }, []);

  /* =========================================================
    OPEN MODAL
  ========================================================= */
  const openModal = (booking: any) => {
    if (!booking?.id) {
      console.warn('⚠️ Missing ID:', booking);
      return;
    }

    setModalBooking(booking);
  };

  /* =========================================================
    UI
  ========================================================= */
  return (
    <div className="flex min-h-screen bg-gray-50">

      <Sidebar activeMenu="archived" />

      <main
        className={`flex-1 transition-all duration-300 w-full ${
          isMobile ? 'ml-0' : collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <Topbar />

        <div className="px-6 py-8 max-w-7xl mx-auto">

          <div className="flex justify-between items-center mb-8 mt-20">
            <h1 className="text-3xl font-bold text-gray-800">
              Archived Bookings
            </h1>
          </div>

          <div className="bg-white rounded-xl shadow-md">

            <div className="bg-purple-600 px-6 py-4 rounded-t-xl">
              <h2 className="text-white font-semibold">
                📦 Archived Bookings
              </h2>
            </div>

            <div className="p-6 overflow-x-auto">

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">

                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase">
                      <th>Guest</th>
                      <th>Room</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {archivedBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-purple-50">

                        <td className="px-3 py-2">{b.guest_name}</td>
                        <td className="px-3 py-2">{b.room_number}</td>

                        <td className="px-3 py-2">
                          {formatDateTime(b.checked_in_at)}
                        </td>

                        <td className="px-3 py-2">
                          {formatDateTime(b.checked_out_at)}
                        </td>

                        <td className="px-3 py-2">
                          ₱{Number(b.total_amount ?? 0).toLocaleString()}
                        </td>

                        <td className="px-3 py-2">
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                            {b.room_status}
                          </span>
                        </td>

                        <td className="px-3 py-2 text-purple-600">
                          <button
                            onClick={() => openModal(b)}
                            className="hover:underline"
                          >
                            View
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* ===================================================== */}
      {/* MODAL (NO USERS PASSED — FIXED ARCHITECTURE) */}
      {/* ===================================================== */}
      <ArchivedModal
        open={!!modalBooking}
        booking={modalBooking}
        onClose={() => setModalBooking(null)}
        formatDate={formatDateTime}
      />

    </div>
  );
}