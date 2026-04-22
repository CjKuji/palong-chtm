'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/* =========================================================
  TYPES
========================================================= */

interface BookingRange {
  id?: number;
  start_at: string;
  room_id: number;
  checked_in_at?: string | null;
  checked_out_at?: string | null;
  status?: string;
}

interface Room {
  id: number;
  room_number: string;
}

interface Props {
  selectedRoom: number | null;
  setSelectedRoom: (id: number | null) => void;
  setAvailability: React.Dispatch<React.SetStateAction<BookingRange[]>>;
  availability: BookingRange[];
  rooms: Room[];
  monthDays?: number;
}

/* =========================================================
  COMPONENT
========================================================= */

export default function RoomAvailabilityCalendar({
  selectedRoom,
  setSelectedRoom,
  availability,
  setAvailability,
  rooms,
  monthDays = 30,
}: Props) {

  const [loading] = useState(false);

  /* =========================================================
    FILTER BOOKINGS BY ROOM
  ========================================================= */

  const roomBookings = useMemo(() => {
    if (!selectedRoom) return [];
    return availability.filter((b) => b.room_id === selectedRoom);
  }, [availability, selectedRoom]);

  /* =========================================================
    DATE HELPERS (SAFE NORMALIZATION)
  ========================================================= */

  const normalizeDate = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  /* =========================================================
    BOOKING LOGIC
  ========================================================= */

  const isBooked = useCallback(
    (day: number) => {
      if (!selectedRoom) return false;

      const today = new Date();

      const targetDate = normalizeDate(
        new Date(today.getFullYear(), today.getMonth(), day)
      );

      return roomBookings.some((b) => {
        const start = normalizeDate(new Date(b.start_at));

        const isCheckedIn = !!b.checked_in_at;
        const isCheckedOut = !!b.checked_out_at;

        if (isCheckedOut) return false;

        if (!isCheckedIn) {
          return isSameDay(targetDate, start);
        }

        return targetDate >= start;
      });
    },
    [roomBookings, selectedRoom]
  );

  /* =========================================================
    REALTIME SUBSCRIPTION (FIXED + DEDUPED)
  ========================================================= */

  useEffect(() => {
    const channel = supabase.channel('realtime-bookings-calendar');

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      (payload) => {
        const newRow = payload.new as BookingRange | null;
        const oldRow = payload.old as BookingRange | null;

        setAvailability((prev) => {
          let updated = [...prev];

          /* =========================
            INSERT / UPDATE
          ========================== */
          if (newRow?.id != null) {
            const index = updated.findIndex((b) => b.id === newRow.id);

            if (index >= 0) {
              updated[index] = {
                ...updated[index],
                ...newRow,
              };
            } else {
              updated.push(newRow);
            }
          }

          /* =========================
            DELETE
          ========================== */
          if (payload.eventType === 'DELETE' && oldRow?.id != null) {
            updated = updated.filter((b) => b.id !== oldRow.id);
          }

          return updated;
        });
      }
    ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setAvailability]);

  /* =========================================================
    STYLE
========================================================= */

  const getDayStyle = (booked: boolean) =>
    booked
      ? "bg-red-500 text-white border-red-500 shadow-sm"
      : "bg-green-50 text-gray-700 border-green-200";

  /* =========================================================
    UI
========================================================= */

  return (
    <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Room Availability Calendar
        </h2>

        <span className="text-xs text-gray-400">
          {loading ? "Updating..." : "Live"}
        </span>
      </div>

      {/* ROOM SELECT */}
      <select
        value={selectedRoom ?? ''}
        onChange={(e) =>
          setSelectedRoom(e.target.value ? Number(e.target.value) : null)
        }
        className="mb-5 w-full sm:w-72 rounded-lg border border-gray-300 p-2 text-sm"
      >
        <option value="">Select Room</option>

        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            Room {room.room_number}
          </option>
        ))}
      </select>

      {/* EMPTY STATE */}
      {!selectedRoom ? (
        <div className="text-gray-400 text-sm italic">
          Select a room to view its availability
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2 text-sm">
          {Array.from({ length: monthDays }).map((_, i) => {
            const day = i + 1;
            const booked = isBooked(day);

            return (
              <div
                key={day}
                className={`p-2 text-center rounded-lg border transition ${getDayStyle(booked)}`}
              >
                <span className="text-xs font-semibold">{day}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}