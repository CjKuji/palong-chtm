'use client';

import { useEffect, useState } from 'react';
import { BookingService } from '@/app/services/booking.service';
import { Booking } from '@/types/booking.types';

/* =========================
  FORMATTERS
========================= */

const formatDateTime = (date?: string | null) =>
  date
    ? new Date(date).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

const formatCurrency = (value?: number | string | null) => {
  const num = Number(value ?? 0);
  return `₱${num.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
  })}`;
};

/* =========================
  STATUS BADGE
========================= */

function StatusBadge({ status }: { status?: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    approved: 'bg-blue-50 text-blue-700 ring-blue-200',
    checked_in: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    checked_out: 'bg-gray-100 text-gray-700 ring-gray-200',
    rejected: 'bg-red-50 text-red-700 ring-red-200',
  };

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full ring-1 capitalize ${
        styles[status || ''] || 'bg-gray-100 text-gray-600 ring-gray-200'
      }`}
    >
      {status?.replace('_', ' ') || 'unknown'}
    </span>
  );
}

/* =========================
  SECTION
========================= */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
        {title}
      </h3>
      <div className="rounded-xl border bg-gray-50 p-4">
        {children}
      </div>
    </div>
  );
}

/* =========================
  PROPS
========================= */

interface Props {
  bookingId: number | null;
  onClose: () => void;
  onApprove: (id: number) => void | Promise<void>;
  onDecline: (id: number) => void | Promise<void>;
  onCheckIn: (id: number) => void | Promise<void>;
  onCheckOut: (id: number) => void | Promise<void>;
}

/* =========================
  MAIN MODAL
========================= */

export default function ReservationModal({
  bookingId,
  onClose,
  onApprove,
  onDecline,
  onCheckIn,
  onCheckOut,
}: Props) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    (async () => {
      setLoading(true);
      try {
        const data = await BookingService.getById(bookingId);
        setBooking(data ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  if (!bookingId) return null;

  const runAction = async (action: () => Promise<any> | void) => {
    try {
      setActionLoading(true);
      await action();
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================
    FIXED MAPPING (SERVICE OUTPUT)
  ========================= */

  const guest = booking?.users;

  const guestName =
    guest?.fname || guest?.lname
      ? `${guest?.fname ?? ''} ${guest?.lname ?? ''}`.trim()
      : 'Unknown Guest';

  const guestEmail = guest?.email ?? 'No email provided';

  // 🔥 FIXED: from mapBooking()
  const roomNumber = (booking as any)?.room_number ?? 'Not assigned';
  const roomFloor = (booking as any)?.floor ?? '—';
  const roomType = (booking as any)?.room_type_name ?? 'Unknown type';
  const amenities: string[] = (booking as any)?.amenities ?? [];

  const extraBeds = booking?.extra_beds ?? 0;
  const extraBedCost = (booking as any)?.extra_bed_fee ?? 0;

  const totalAmount = Number(booking?.total_amount ?? 0);

  /* =========================
    UI
========================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex justify-between items-start border-b p-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Booking Details
            </h2>
            <p className="text-sm text-gray-500">{guestName}</p>
            <p className="text-xs text-gray-400">{guestEmail}</p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">

          {loading ? (
            <p className="text-sm text-gray-500">Loading booking...</p>
          ) : (
            <>
              <StatusBadge status={booking?.status} />

              <div className="grid md:grid-cols-2 gap-5">

                <Section title="Guest">
                  <p className="font-medium text-gray-900">{guestName}</p>
                  <p className="text-xs text-gray-500">{guestEmail}</p>
                </Section>

                <Section title="Room Details">
                  <p>Room No: {roomNumber}</p>
                  <p>Floor: {roomFloor}</p>
                  <p>Type: {roomType}</p>
                </Section>

                <Section title="Stay Info">
                  <p>Guests: {booking?.guests ?? 1}</p>
                  <p>Extra Beds: {extraBeds}</p>
                </Section>

                <Section title="Pricing">
                  <p>Extra Beds: {formatCurrency(extraBedCost)}</p>
                  <p className="font-semibold text-lg">
                    Total: {formatCurrency(totalAmount)}
                  </p>
                </Section>

                <Section title="Amenities">
                  {amenities.length ? (
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((a, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-full"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No amenities</p>
                  )}
                </Section>

                {/* ✅ RESTORED: Guest flags */}
                <Section title="Guest Info">
                  <p className="text-sm text-gray-600">
                    {booking?.has_child ? '✓ With Child' : 'No Child'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {booking?.has_pwd ? '✓ PWD Guest' : 'No PWD'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {booking?.has_senior ? '✓ Senior Guest' : 'No Senior'}
                  </p>
                </Section>

              </div>
            </>
          )}
        </div>

        {/* ACTIONS */}
        {!loading && booking && (
          <div className="flex justify-end gap-2 border-t p-5">

            {booking.status === 'pending' && (
              <>
                <button
                  disabled={actionLoading}
                  onClick={() => runAction(() => onDecline(booking.id))}
                  className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg"
                >
                  Reject
                </button>

                <button
                  disabled={actionLoading}
                  onClick={() => runAction(() => onApprove(booking.id))}
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg"
                >
                  Approve
                </button>
              </>
            )}

            {booking.status === 'approved' && (
              <button
                disabled={actionLoading}
                onClick={() => runAction(() => onCheckIn(booking.id))}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg"
              >
                Check In
              </button>
            )}

            {booking.status === 'checked_in' && (
              <button
                disabled={actionLoading}
                onClick={() => runAction(() => onCheckOut(booking.id))}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg"
              >
                Check Out
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg"
            >
              Close
            </button>

          </div>
        )}

      </div>
    </div>
  );
}