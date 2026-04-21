import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { BookingService } from "@/app/services/booking.service";

interface Room {
  id: number;
  room_number: string;
  room_type?: {
    id: number;
    name: string;
    capacity: number;
    base_price: number;
  };
}

interface BookingRange {
  room_id: number;
  start_at: string;
  status: string;
  checked_in_at?: string | null;
  checked_out_at?: string | null;
}

export function useRoomAvailability() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [availability, setAvailability] = useState<BookingRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =========================
  // FETCH ROOMS
  // =========================
  const fetchRooms = async (): Promise<Room[]> => {
    const { data, error } = await supabase
      .from("rooms")
      .select(`
        id,
        room_number,
        room_type:room_types (
          id,
          name,
          capacity,
          base_price
        )
      `)
      .order("room_number", { ascending: true });

    if (error) throw error;
    return data ?? [];
  };

  // =========================
  // LOAD DATA
  // =========================
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [roomsData, bookingsData] = await Promise.all([
        fetchRooms(),
        BookingService.getAll(),
      ]);

      const safeRooms = Array.isArray(roomsData) ? roomsData : [];
      const safeBookings = Array.isArray(bookingsData) ? bookingsData : [];

      setRooms(safeRooms);

      setAvailability(
        safeBookings.map((b: any) => ({
          room_id: b.room_id,
          start_at: b.start_at,
          status: b.status,
          checked_in_at: b.checked_in_at,
          checked_out_at: b.checked_out_at,
        }))
      );

      // auto select first room only once
      setSelectedRoom((prev) =>
        prev ?? (safeRooms.length > 0 ? safeRooms[0].id : null)
      );

    } catch (err: any) {
      setError(err?.message || "Failed to load availability");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // =========================
  // REFRESH
  // =========================
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