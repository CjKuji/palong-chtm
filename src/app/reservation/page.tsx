'use client';

import { useState, useMemo } from 'react';

import Sidebar from '@/app/components/Sidebar';
import Topbar from '@/app/components/Topbar';

import ReservationTabs from '@/app/components/reservations/ReservationTabs';
import ReservationTable from '@/app/components/reservations/ReservationTable';
import RoomAvailabilityCalendar from '@/app/components/reservations/RoomAvailabilityCalendar';
import ReservationModal from '@/app/components/modals/ReservationModal';

import { useReservations } from '@/app/hooks/useReservation';
import { useRoomAvailability } from '@/app/hooks/useRoomAvailability';
import { useSidebar } from '@/app/context/SidebarContext';

type TabType =
  | 'pending'
  | 'approved'
  | 'checked_in'
  | 'checked_out'
  | 'rejected';

export default function ReservationPage() {

  const [tab, setTab] = useState<TabType>('pending');
  const [selected, setSelected] = useState<any>(null);

  const { collapsed } = useSidebar();

  const {
    reservations,
    actionLoading,
    approve,
    decline,
    checkIn,
    checkOut,
  } = useReservations();

  const {
    rooms,
    selectedRoom,
    setSelectedRoom,
    availability,
    loading: roomLoading,
  } = useRoomAvailability();

  // =========================
  // SAFE RESERVATIONS
  // =========================
  const safeReservations = useMemo(
    () => Array.isArray(reservations) ? reservations : [],
    [reservations]
  );

  // =========================
  // FILTER BY STATUS
  // =========================
  const filteredReservations = useMemo(() => {
    return safeReservations.filter(r => r?.status === tab);
  }, [safeReservations, tab]);

  return (
    <div className="min-h-screen bg-gray-50">

      <Sidebar activeMenu="reservation" />
      <Topbar />

      <main className={`
        pt-16 transition-all duration-300
        ${collapsed ? 'ml-20' : 'ml-64'}
      `}>

        <div className="space-y-6 p-4 sm:p-6">

          {/* HEADER */}
          <div>
            <h1 className="text-xl font-semibold">
              Reservations
            </h1>
            <p className="text-sm text-gray-500">
              Manage bookings and room occupancy
            </p>

            {actionLoading && (
              <p className="text-xs text-blue-500 mt-1">
                Updating booking...
              </p>
            )}
          </div>

          {/* TABS */}
          <div className="rounded-xl bg-white p-3 border">
            <ReservationTabs tab={tab} setTab={setTab} />
          </div>

          {/* TABLE */}
          <div className="rounded-xl bg-white border shadow-sm">
            <ReservationTable
              data={filteredReservations}
              onOpen={setSelected}
              onCheckIn={checkIn}
              onCheckOut={checkOut}
            />
          </div>

          {/* CALENDAR */}
          <div className="rounded-xl bg-white border p-4">

            {roomLoading ? (
              <p className="text-sm text-gray-500">Loading rooms...</p>
            ) : (
              <RoomAvailabilityCalendar
                selectedRoom={selectedRoom}
                setSelectedRoom={setSelectedRoom}
                availability={availability}
                rooms={rooms}
              />
            )}

          </div>

        </div>
      </main>

      {/* MODAL */}
      <ReservationModal
        bookingId={selected?.id}
        onClose={() => setSelected(null)}
        onApprove={approve}
        onDecline={decline}
        onCheckIn={checkIn}
        onCheckOut={checkOut}
      />

    </div>
  );
}