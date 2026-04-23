import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { BookingService } from "@/app/services/booking.service";
import { Booking } from "@/types/booking.types";

/* =========================================================
  TYPES
========================================================= */

interface RoomType {
  id: number;
  name: string;
  capacity: number;
  base_price: number;
}

interface Room {
  id: number;
  room_number: string;
  room_type: RoomType | null;
}

interface BookingRange {
  id: number;
  room_id: number;

  start_at: string;
  end_at: string; // ✅ FIX ADDED

  status: string;

  checked_in_at: string | null;
  checked_out_at: string | null;
}

/* =========================================================
  HOOK
========================================================= */

export function useRoomAvailability() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [availability, setAvailability] = useState<BookingRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);

  /* =========================================================
    MOUNT SAFETY
  ========================================================= */
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  /* =========================================================
    NORMALIZE ROOM
  ========================================================= */
  const normalizeRoom = (r: any): Room => ({
    id: r.id,
    room_number: r.room_number,
    room_type: Array.isArray(r.room_types)
      ? r.room_types[0] ?? null
      : r.room_types ?? null,
  });

  /* =========================================================
    FIXED BOOKING MAPPER (IMPORTANT)
  ========================================================= */
  const mapBooking = (b: Booking): BookingRange => {
    const mapped = {
      id: b.id,
      room_id: b.room_id,

      start_at: b.start_at,
      end_at: b.end_at ?? b.start_at, // 🔥 fallback ONLY if missing

      status: b.status,

      checked_in_at: b.checked_in_at ?? null,
      checked_out_at: b.checked_out_at ?? null,
    };

    if (!b.end_at) {
      console.warn("⚠️ Missing end_at from DB:", b);
    }

    return mapped;
  };

  /* =========================================================
    FETCH ROOMS
  ========================================================= */
  const fetchRooms = useCallback(async (): Promise<Room[]> => {
    const { data, error } = await supabase
      .from("rooms")
      .select(`
        id,
        room_number,
        room_types (
          id,
          name,
          capacity,
          base_price
        )
      `)
      .order("room_number", { ascending: true });

    if (error) throw new Error(error.message);

    return (data ?? []).map(normalizeRoom);
  }, []);

  /* =========================================================
    LOAD DATA
  ========================================================= */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [roomsData, bookingsData] = await Promise.all([
        fetchRooms(),
        BookingService.getAll(),
      ]);

      if (!isMounted.current) return;

      const mappedBookings = (bookingsData ?? []).map(mapBooking);

      console.log("📦 BOOKINGS AFTER MAP:", mappedBookings);

      setRooms(roomsData);
      setAvailability(mappedBookings);

      setSelectedRoom((prev) =>
        prev ?? (roomsData.length ? roomsData[0].id : null)
      );
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err?.message || "Failed to load availability");
    } finally {
      if (!isMounted.current) return;
      setLoading(false);
    }
  }, [fetchRooms]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =========================================================
    REALTIME SYNC
  ========================================================= */
  useEffect(() => {
    const channel = supabase
      .channel("realtime-room-availability")

      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        (payload) => {
          const newRow = mapBooking(payload.new as Booking);

          setAvailability((prev) => {
            if (prev.some((b) => b.id === newRow.id)) return prev;
            return [...prev, newRow];
          });
        }
      )

      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings" },
        (payload) => {
          const newRow = mapBooking(payload.new as Booking);

          setAvailability((prev) =>
            prev.map((b) => (b.id === newRow.id ? newRow : b))
          );
        }
      )

      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "bookings" },
        (payload) => {
          const oldRow = payload.old as Booking;

          setAvailability((prev) =>
            prev.filter((b) => b.id !== oldRow.id)
          );
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* =========================================================
    REFRESH
  ========================================================= */
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    rooms,
    selectedRoom,
    setSelectedRoom,
    availability,
    loading,
    error,
    refresh,
  };
}