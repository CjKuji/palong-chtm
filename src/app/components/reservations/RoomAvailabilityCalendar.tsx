'use client';

import { useMemo } from 'react';

interface BookingRange {
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
  availability: BookingRange[];
  rooms: Room[];
  monthDays?: number;
}

export default function RoomAvailabilityCalendar({
  selectedRoom,
  setSelectedRoom,
  availability = [],
  rooms = [],
  monthDays = 30,
}: Props) {

  // =========================================================
  // FILTER BOOKINGS BY ROOM
  // =========================================================
  const roomBookings = useMemo(() => {
    if (!selectedRoom) return [];
    return availability.filter((b) => b.room_id === selectedRoom);
  }, [availability, selectedRoom]);

  // =========================================================
  // DATE HELPERS
  // =========================================================
  const normalizeDate = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  // =========================================================
  // BOOKING LOGIC (CLEAN HOTEL FLOW)
  // =========================================================
  const isBooked = (day: number) => {
    if (!selectedRoom) return false;

    const today = new Date();

    const targetDate = normalizeDate(
      new Date(today.getFullYear(), today.getMonth(), day)
    );

    return roomBookings.some((b) => {
      const start = normalizeDate(new Date(b.start_at));

      const isCheckedIn = !!b.checked_in_at;
      const isCheckedOut = !!b.checked_out_at;

      // ❌ COMPLETED → ignore completely
      if (isCheckedOut) return false;

      // 🟡 NOT CHECKED IN (pending / approved)
      if (!isCheckedIn) {
        return isSameDay(targetDate, start);
      }

      // 🔴 ACTIVE STAY (checked-in)
      if (isCheckedIn && !isCheckedOut) {
        return targetDate >= start;
      }

      return false;
    });
  };

  // =========================================================
  // UI STATE COLORS (future-ready hook)
  // =========================================================
  const getDayStyle = (booked: boolean) => {
    if (booked) {
      return "bg-red-500 text-white border-red-500 shadow-sm";
    }
    return "bg-green-50 text-gray-700 border-green-200";
  };

  // =========================================================
  // UI
  // =========================================================
  return (
    <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Room Availability Calendar
        </h2>

        {/* LEGEND */}
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1 text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Available
          </span>

          <span className="flex items-center gap-1 text-red-600">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Booked
          </span>
        </div>
      </div>

      {/* ROOM SELECT */}
      <select
        value={selectedRoom ?? ''}
        onChange={(e) =>
          setSelectedRoom(e.target.value ? Number(e.target.value) : null)
        }
        className="mb-5 w-full sm:w-72 rounded-lg border border-gray-300 p-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select Room</option>

        {rooms.length === 0 ? (
          <option disabled>No rooms available</option>
        ) : (
          rooms.map((room) => (
            <option key={room.id} value={room.id}>
              Room {room.room_number}
            </option>
          ))
        )}
      </select>

      {/* EMPTY STATE */}
      {!selectedRoom ? (
        <div className="text-gray-400 text-sm italic">
          Select a room to view its availability
        </div>
      ) : (
        <>
          {/* CALENDAR GRID */}
          <div className="grid grid-cols-7 gap-2 text-sm">

            {Array.from({ length: monthDays }).map((_, i) => {
              const day = i + 1;
              const booked = isBooked(day);

              return (
                <div
                  key={day}
                  className={`
                    p-2 text-center rounded-lg border font-medium
                    transition-all duration-200 cursor-default
                    hover:scale-[1.03]
                    ${getDayStyle(booked)}
                  `}
                >
                  <span className="text-xs font-semibold">{day}</span>
                </div>
              );
            })}

          </div>

          {/* FOOTER INFO */}
          <div className="mt-4 text-xs text-gray-400">
            Showing current month availability
          </div>
        </>
      )}
    </div>
  );
}