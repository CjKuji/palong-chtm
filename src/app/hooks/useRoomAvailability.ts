import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { BookingService } from "@/app/services/booking.service";
import { Booking } from "@/types/booking.types";

/* =========================================================
  TYPES (CLEANED)
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

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  /* =========================================================
    FETCH ROOMS (FIXED RELATION HANDLING)
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

    if (error) throw error;

    return (data ?? []).map((r: any) => ({
      id: r.id,
      room_number: r.room_number,

      // IMPORTANT FIX: Supabase returns ARRAY sometimes
      room_type: Array.isArray(r.room_types)
        ? r.room_types[0] ?? null
        : r.room_types ?? null,
    }));
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

      const mappedBookings: BookingRange[] = (bookingsData ?? []).map(
        (b: Booking) => ({
          id: b.id,
          room_id: b.room_id,
          start_at: b.start_at,
          status: b.status,
          checked_in_at: b.checked_in_at ?? null,
          checked_out_at: b.checked_out_at ?? null,
        })
      );

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
    const channel = supabase.channel("realtime-room-availability");

    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bookings" },
      (payload) => {
        const newRow = payload.new as Booking | null;
        const oldRow = payload.old as Booking | null;

        setAvailability((prev) => {
          let updated = [...prev];

          if (newRow?.id) {
            const mapped: BookingRange = {
              id: newRow.id,
              room_id: newRow.room_id,
              start_at: newRow.start_at,
              status: newRow.status,
              checked_in_at: newRow.checked_in_at ?? null,
              checked_out_at: newRow.checked_out_at ?? null,
            };

            const index = updated.findIndex((b) => b.id === newRow.id);

            if (index >= 0) updated[index] = mapped;
            else updated.push(mapped);
          }

          if (payload.eventType === "DELETE" && oldRow?.id) {
            updated = updated.filter((b) => b.id !== oldRow.id);
          }

          return updated;
        });
      }
    );

    channel.subscribe();

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