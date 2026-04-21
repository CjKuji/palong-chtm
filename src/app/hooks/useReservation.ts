import { useEffect, useState, useCallback } from "react";
import { BookingService } from "@/app/services/booking.service";
import { Booking } from "@/types/booking.types";

export function useReservations() {
  const [reservations, setReservations] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =========================
  // FETCH
  // =========================
  const fetchReservations = useCallback(async () => {
    setLoading(true);

    try {
      const data = await BookingService.getAll();
      setReservations(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // =========================
  // SAFE ACTION WRAPPER
  // =========================
  const runAction = useCallback(async (fn: () => Promise<any>) => {
    setActionLoading(true);

    try {
      await fn();
      await fetchReservations();
    } catch (err: any) {
      setError(err?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  }, [fetchReservations]);

  // =========================
  // ACTIONS
  // =========================
  const approve = (id: number) =>
    runAction(() => BookingService.updateStatus(id, "approved"));

  const decline = (id: number) =>
    runAction(() => BookingService.updateStatus(id, "rejected"));

  const checkIn = (id: number) =>
    runAction(() => BookingService.updateStatus(id, "checked_in"));

  const checkOut = (id: number) =>
    runAction(() => BookingService.updateStatus(id, "checked_out"));

  return {
    reservations,
    loading,
    actionLoading,
    error,

    approve,
    decline,
    checkIn,
    checkOut,

    refresh: fetchReservations,
  };
}