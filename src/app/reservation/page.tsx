"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

import Sidebar from "@/app/components/Sidebar";
import Topbar from "@/app/components/Topbar";

import ReservationTabs from "@/app/components/reservations/ReservationTabs";
import ReservationTable from "@/app/components/reservations/ReservationTable";
import RoomAvailabilityCalendar from "@/app/components/reservations/RoomAvailabilityCalendar";
import ReservationModal from "@/app/components/modals/ReservationModal";

import { useReservations } from "@/app/hooks/useReservation";
import { useRoomAvailability } from "@/app/hooks/useRoomAvailability";
import { useSidebar } from "@/app/context/SidebarContext";

import { Booking } from "@/types/booking.types";

type TabType = Booking["status"];

export default function ReservationPage() {
  /* =========================================================
    STATE
  ========================================================= */
  const [tab, setTab] = useState<TabType>("pending");
  const [selected, setSelected] = useState<Booking | null>(null);

  const { collapsed } = useSidebar();

  const {
    reservations,
    actionLoading,
    refresh,
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
    refresh: refreshRooms,
    loading: roomLoading,
  } = useRoomAvailability();

  /* =========================================================
    SAFE DATA
  ========================================================= */

  const safeReservations = useMemo(() => reservations ?? [], [reservations]);

  const filteredReservations = useMemo(() => {
    return safeReservations.filter((r) => r?.status === tab);
  }, [safeReservations, tab]);

  /* =========================================================
    REFRESH SELECTED BOOKING
  ========================================================= */

  const refreshSelected = useCallback(async (id?: number | null) => {
    if (!id) return;

    const { data } = await supabase
      .from("bookings")
      .select(`
        *,
        users (id, fname, lname, email),

        approved_by_user:users!approved_by (id, fname, lname),
        rejected_by_user:users!rejected_by (id, fname, lname),
        checked_in_by_user:users!checked_in_by (id, fname, lname),
        checked_out_by_user:users!checked_out_by (id, fname, lname),

        room:rooms (
          id,
          room_number,
          floor,
          room_type:room_types (
            id,
            name,
            capacity,
            base_price,
            room_amenities (
              amenity_id,
              amenities (id, name)
            )
          )
        ),
        booking_logs (id, action, created_at)
      `)
      .eq("id", id)
      .single();

    if (data) {
      setSelected(data as Booking);
    }
  }, []);

  /* =========================================================
    ACTION WRAPPERS
  ========================================================= */

  const handleAction = useCallback(
    async (fn: (id: number) => Promise<void>, id?: number | null) => {
      if (!id) return;

      await fn(id);
      await refresh();
      await refreshSelected(id);
    },
    [refresh, refreshSelected]
  );

  const handleApprove = (id: number) => handleAction(approve, id);
  const handleDecline = (id: number) => handleAction(decline, id);
  const handleCheckIn = (id: number) => handleAction(checkIn, id);
  const handleCheckOut = (id: number) => handleAction(checkOut, id);

  /* =========================================================
    REALTIME SYNC
  ========================================================= */

  useEffect(() => {
    const channel = supabase.channel("realtime-reservations-page");

    const handleBookingChange = () => {
      refresh();
      if (selected?.id) refreshSelected(selected.id);
    };

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        handleBookingChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "archived_bookings" },
        handleBookingChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => refreshRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, refreshRooms, refreshSelected, selected?.id]);

  /* =========================================================
    UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeMenu="reservation" />
      <Topbar />

      <main
        className={`pt-16 transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <div className="space-y-6 p-4 sm:p-6">

          {/* HEADER */}
          <div>
            <h1 className="text-xl font-semibold">Reservations</h1>
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
              onApprove={handleApprove}  
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
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
        bookingId={selected?.id ?? null}
        onClose={() => setSelected(null)}
        onApprove={handleApprove}
        onDecline={handleDecline}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
      />
    </div>
  );
}