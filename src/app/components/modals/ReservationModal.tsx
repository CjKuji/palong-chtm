'use client';

import { useEffect, useState } from 'react';
import { BookingService } from '@/app/services/booking.service';
import { Booking } from '@/types/booking.types';

/* -----------------------------
  FORMATTER
------------------------------ */

const formatDateTime = (date?: string) =>
  date
    ? new Date(date).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

/* -----------------------------
  STATUS BADGE
------------------------------ */

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

/* -----------------------------
  SECTION
------------------------------ */

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

/* -----------------------------
  PROPS
------------------------------ */

interface Props {
  bookingId: number | null;
  onClose: () => void;
  onApprove: (id: number) => void;
  onDecline: (id: number) => void;
  onCheckIn: (id: number) => void;
  onCheckOut: (id: number) => void;
}

/* -----------------------------
  MAIN MODAL
------------------------------ */

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

  /* -----------------------------
    SAFE DERIVED DATA
  ------------------------------ */

  const guestName = booking?.users
    ? `${booking.users.fname} ${booking.users.lname}`
    : 'Unknown Guest';

  const roomLabel = booking?.room
    ? `Room ${booking.room.room_number}`
    : 'Unassigned Room';

  const amenities: string[] = booking?.amenities ?? [];
  const payments = booking?.payments ?? [];
  const logs = booking?.logs ?? [];

  const hasFlags =
    booking?.has_child || booking?.has_pwd || booking?.has_senior;

  /* -----------------------------
    UI
------------------------------ */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

      <div className="w-full max-w-6xl rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex justify-between items-start border-b p-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Booking Details
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {guestName} • {roomLabel}
            </p>
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
              {/* STATUS + DATE RANGE FIXED */}
              <div className="flex justify-between items-center">
                <StatusBadge status={booking?.status} />

                <div className="text-sm text-gray-500 text-right">
                  <div>
                    {formatDateTime(booking?.start_at)} → {formatDateTime(booking?.end_at)}
                  </div>

                  {/* EXTRA VISUAL (CHECK-IN / CHECK-OUT) */}
                  {(booking?.checked_in_at || booking?.checked_out_at) && (
                    <div className="text-xs text-gray-400 mt-1">
                      {booking?.checked_in_at && (
                        <span>
                          In: {formatDateTime(booking.checked_in_at)}{' '}
                        </span>
                      )}

                      {booking?.checked_out_at && (
                        <span>
                          | Out: {formatDateTime(booking.checked_out_at)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* GRID */}
              <div className="grid md:grid-cols-2 gap-5">

                <Section title="Guest">
                  <p className="font-medium text-gray-900">{guestName}</p>
                  <p className="text-xs text-gray-500">
                    ID: {booking?.users?.id || '—'}
                  </p>
                </Section>

                <Section title="Room">
                  <p>{roomLabel}</p>
                </Section>

                <Section title="Stay Info">
                  <p>Guests: {booking?.guests ?? 1}</p>
                  <p>Extra Beds: {booking?.extra_beds ?? 0}</p>
                </Section>

                <Section title="Guest Tags">
                  {hasFlags ? (
                    <div className="flex flex-wrap gap-2 text-xs">

                      {booking?.has_child && (
                        <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full">
                          Child {booking.child_age_group && `(${booking.child_age_group})`}
                        </span>
                      )}

                      {booking?.has_pwd && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                          PWD
                        </span>
                      )}

                      {booking?.has_senior && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full">
                          Senior
                        </span>
                      )}

                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      No special guest tags
                    </p>
                  )}
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

                <Section title="Payments">
                  {payments.length ? (
                    payments.map((p, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{p.method}</span>
                        <span className="font-medium">₱{p.amount}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No payments</p>
                  )}
                </Section>

                <Section title="Activity Logs">
                  {logs.length ? (
                    logs.map((l, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>{l.action}</span>
                        <span className="text-gray-400">
                          {formatDateTime(l.created_at)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No activity</p>
                  )}
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
                  onClick={() => onDecline(booking.id)}
                  className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg"
                >
                  Reject
                </button>

                <button
                  onClick={() => onApprove(booking.id)}
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg"
                >
                  Approve
                </button>
              </>
            )}

            {booking.status === 'approved' && (
              <button
                onClick={() => onCheckIn(booking.id)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg"
              >
                Check In
              </button>
            )}

            {booking.status === 'checked_in' && (
              <button
                onClick={() => onCheckOut(booking.id)}
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