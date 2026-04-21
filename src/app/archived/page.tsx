'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Topbar from '@/app/components/Topbar';
import { useSidebar } from '@/app/context/SidebarContext';
import { supabase } from '@/lib/supabase';

export default function Archived() {
  const { collapsed } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [archivedBookings, setArchivedBookings] = useState<any[]>([]);
  const [modalBooking, setModalBooking] = useState<any | null>(null);

  // Responsive check
  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 640);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Fetch archived bookings with admin info
  useEffect(() => {
    const fetchArchived = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('archived_bookings')
          .select('*')
          .order('end_at', { ascending: false });

        if (error) throw error;

        // Fetch admin names for each archived booking from logs
        const bookingsWithDetails = await Promise.all(data?.map(async (b: any) => {
          // Get admin who performed check-in
          const logs = b.logs || [];
          const checkInLog = logs.find((log: any) => log.action === 'Checked-in' || log.action === 'Early Check-in');
          let checkedInBy = null;
          if (checkInLog?.performed_by) {
            const { data: adminData } = await supabase
              .from('users')
              .select('fname, lname')
              .eq('id', checkInLog.performed_by)
              .single();
            checkedInBy = adminData ? `${adminData.fname} ${adminData.lname}` : 'Unknown Admin';
          }

          // Get admin who performed check-out
          const checkOutLog = logs.find((log: any) => log.action === 'Checked-out' || log.action === 'Early Check-out');
          let checkedOutBy = null;
          if (checkOutLog?.performed_by) {
            const { data: adminData } = await supabase
              .from('users')
              .select('fname, lname')
              .eq('id', checkOutLog.performed_by)
              .single();
            checkedOutBy = adminData ? `${adminData.fname} ${adminData.lname}` : 'Unknown Admin';
          }

          // Get admin who archived (check logs for archive action)
          const archiveLog = logs.find((log: any) => log.action === 'Archived');
          let archivedBy = null;
          if (archiveLog?.performed_by) {
            const { data: adminData } = await supabase
              .from('users')
              .select('fname, lname')
              .eq('id', archiveLog.performed_by)
              .single();
            archivedBy = adminData ? `${adminData.fname} ${adminData.lname}` : 'Unknown Admin';
          } else if (b.archived_by) {
            // Fallback if archived_by field exists
            const { data: adminData } = await supabase
              .from('users')
              .select('fname, lname')
              .eq('id', b.archived_by)
              .single();
            archivedBy = adminData ? `${adminData.fname} ${adminData.lname}` : 'Unknown Admin';
          }

          // Get user who booked the room
          let bookedBy = null;
          if (b.user_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('fname, lname, email')
              .eq('id', b.user_id)
              .single();
            bookedBy = userData ? `${userData.fname} ${userData.lname}` : 'Unknown User';
          }

          // Determine room status (cleaned/checked)
          const roomStatus = b.room_cleaned ? 'Cleaned' : 'Pending Cleanup';

          return {
            ...b,
            guest_name: b.guest_fname && b.guest_lname ? `${b.guest_fname} ${b.guest_lname}` : 'Unknown Guest',
            room_number: b.room_number || b.room_id,
            checked_in_by: checkedInBy,
            checked_out_by: checkedOutBy,
            archived_by: archivedBy,
            booked_by: bookedBy,
            room_status: roomStatus
          };
        })) || [];

        setArchivedBookings(bookingsWithDetails);
      } catch (err) {
        console.error('Error fetching archived bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArchived();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans antialiased">
      <Sidebar activeMenu="archived" />
      <main
        className={`flex-1 transition-all duration-300 w-full ${
          isMobile ? 'ml-0' : collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <Topbar />

        <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
          <div
            className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 ${
              isMobile ? 'mt-28' : 'mt-16 sm:mt-20'
            }`}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
              Archived Bookings
            </h1>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:gap-7 lg:gap-8">
            {loading ? (
              <div className="flex justify-center items-center h-32 sm:h-40">
                <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : archivedBookings.length > 0 ? (
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 w-full">
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-t-xl">
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white flex items-center gap-2">
                    <span className="text-lg">📦</span>Archived Bookings
                  </h2>
                </div>
                <div className="p-4 sm:p-5 md:p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                          <th className="px-3 py-2 hidden sm:table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                          <th className="px-3 py-2 hidden md:table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {archivedBookings.map((b: any) => (
                          <tr key={b.id} className="hover:bg-purple-50 transition-colors duration-150">
                            <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-700">{b.guest_name}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{b.room_number}</td>
                            <td className="hidden sm:table-cell px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-600">{new Date(b.start_at).toLocaleDateString()}</td>
                            <td className="hidden md:table-cell px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-600">{new Date(b.end_at).toLocaleDateString()}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-700">${b.total_amount ?? 0}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                b.room_status === 'Cleaned' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {b.room_status}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-purple-600">
                              <button
                                onClick={() => setModalBooking(b)}
                                className="hover:underline font-medium"
                              >
                                View Full
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500">No archived bookings</div>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {modalBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl w-11/12 md:w-3/4 lg:w-1/2 p-6 relative overflow-y-auto max-h-[90vh]">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl"
              onClick={() => setModalBooking(null)}
            >
              ✖
            </button>

            <h2 className="text-xl font-bold mb-4 text-gray-800">{modalBooking.guest_name}</h2>
            
            {/* Booking Information */}
            <div className="space-y-3">
              <div className="border-b pb-2">
                <h3 className="font-semibold text-gray-800 mb-2">Booking Details</h3>
                <p className="text-sm text-gray-600"><strong>Booked By:</strong> {modalBooking.booked_by || 'Unknown User'}</p>
                <p className="text-sm text-gray-600"><strong>Room Number:</strong> {modalBooking.room_number}</p>
                {modalBooking.message && <p className="text-sm text-gray-600"><strong>Message:</strong> {modalBooking.message}</p>}
                <p className="text-sm text-gray-600"><strong>Number of Guests:</strong> {modalBooking.guests}</p>
              </div>

              {/* Date Information */}
              <div className="border-b pb-2">
                <h3 className="font-semibold text-gray-800 mb-2">Stay Period</h3>
                <p className="text-sm text-gray-600"><strong>Check-in:</strong> {new Date(modalBooking.start_at).toLocaleString()}</p>
                <p className="text-sm text-gray-600"><strong>Check-out:</strong> {new Date(modalBooking.end_at).toLocaleString()}</p>
              </div>

              {/* Pricing Information */}
              <div className="border-b pb-2">
                <h3 className="font-semibold text-gray-800 mb-2">Pricing Details</h3>
                <p className="text-sm text-gray-600"><strong>Price at Booking:</strong> ${modalBooking.price_at_booking ?? 0}</p>
                <p className="text-sm text-gray-600"><strong>Total Amount:</strong> ${modalBooking.total_amount ?? 0}</p>
              </div>

              {/* Room Status */}
              <div className="border-b pb-2">
                <h3 className="font-semibold text-gray-800 mb-2">Room Status</h3>
                <p className="text-sm">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    modalBooking.room_status === 'Cleaned' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {modalBooking.room_status}
                  </span>
                </p>
              </div>

              {/* Admin Actions */}
              <div className="border-b pb-2">
                <h3 className="font-semibold text-gray-800 mb-2">Admin Actions</h3>
                <p className="text-sm text-gray-600"><strong>Checked In By:</strong> {modalBooking.checked_in_by || 'Not checked in'}</p>
                <p className="text-sm text-gray-600"><strong>Checked Out By:</strong> {modalBooking.checked_out_by || 'Not checked out'}</p>
                <p className="text-sm text-gray-600"><strong>Archived By:</strong> {modalBooking.archived_by || 'Auto-archived'}</p>
              </div>

              {/* Amenities */}
              {modalBooking.amenities?.length > 0 && (
                <div className="border-b pb-2">
                  <h3 className="font-semibold text-gray-800 mb-2">Amenities</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {modalBooking.amenities.map((a: any, i: number) => (
                      <li key={i}>{a.name} - ${a.price}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Payments */}
              {modalBooking.payments?.length > 0 && (
                <div className="border-b pb-2">
                  <h3 className="font-semibold text-gray-800 mb-2">Payment History</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {modalBooking.payments.map((p: any, i: number) => (
                      <li key={i}>
                        ${p.amount} — {p.status} ({p.method}) on {new Date(p.paid_at).toLocaleDateString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Activity Logs */}
              {modalBooking.logs?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Activity Logs</h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto bg-gray-50 p-2 rounded">
                    {modalBooking.logs.map((log: any, i: number) => (
                      <p key={i} className="text-xs text-gray-600">
                        • {log.action} by {log.performed_by_name || 'System'} on {new Date(log.created_at).toLocaleString()}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}