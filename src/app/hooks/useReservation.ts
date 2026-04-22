import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { BookingService } from "@/app/services/booking.service";
import { Booking } from "@/types/booking.types";

/* =========================================================
  RESERVATIONS HOOK (CLEAN + SAFE + SYNCED)
========================================================= */

export function useReservations() {
  const [reservations, setReservations] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const isMounted = useRef(true);

  /* =========================================================
    USER
  ========================================================= */
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    };

    loadUser();
  }, []);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  /* =========================================================
    FETCH BOOKINGS (FROM SERVICE)
  ========================================================= */
  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await BookingService.getAll();

      if (!isMounted.current) return;
      setReservations(data ?? []);
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err?.message || "Failed to load reservations");
    } finally {
      if (!isMounted.current) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  /* =========================================================
    REALTIME SYNC (SAFE MERGE)
  ========================================================= */
  useEffect(() => {
    const channel = supabase
      .channel("realtime-bookings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        (payload) => {
          const newRow = payload.new as Booking | null;
          const oldRow = payload.old as Booking | null;

          setReservations((prev) => {
            let updated = [...prev];

            if (newRow?.id) {
              const index = updated.findIndex((b) => b.id === newRow.id);

              if (index >= 0) {
                updated[index] = {
                  ...updated[index],
                  ...newRow,
                };
              } else {
                updated.unshift(newRow);
              }
            }

            if (payload.eventType === "DELETE" && oldRow?.id) {
              updated = updated.filter((b) => b.id !== oldRow.id);
            }

            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* =========================================================
    ACTION WRAPPER
  ========================================================= */
  const runAction = useCallback(
    async (fn: () => Promise<Booking>) => {
      setActionLoading(true);
      setError(null);

      try {
        const updated = await fn();
        if (!isMounted.current || !updated) return;

        setReservations((prev) =>
          prev.map((b) => (b.id === updated.id ? updated : b))
        );
      } catch (err: any) {
        if (!isMounted.current) return;
        setError(err?.message || "Action failed");
      } finally {
        if (!isMounted.current) return;
        setActionLoading(false);
      }
    },
    []
  );

  /* =========================================================
    ACTIONS (USING FIXED SERVICE)
  ========================================================= */

  const approve = useCallback(
    (id: number) =>
      runAction(() =>
        BookingService.updateStatus(id, "approved", userId ?? undefined)
      ),
    [runAction, userId]
  );

  const decline = useCallback(
    (id: number) =>
      runAction(() =>
        BookingService.updateStatus(id, "rejected", userId ?? undefined)
      ),
    [runAction, userId]
  );

  const checkIn = useCallback(
    (id: number) =>
      runAction(() =>
        BookingService.updateStatus(id, "checked_in", userId ?? undefined)
      ),
    [runAction, userId]
  );

  const checkOut = useCallback(
    (id: number) =>
      runAction(() =>
        BookingService.updateStatus(id, "checked_out", userId ?? undefined)
      ),
    [runAction, userId]
  );

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