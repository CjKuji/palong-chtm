'use client';

import { useEffect } from 'react';

interface Props {
  open: boolean;
  booking: any | null;
  onClose: () => void;
  formatDate: (date: string | null | undefined) => string;
}

/* =========================================================
  MAIN MODAL
========================================================= */

export default function ArchivedModal({
  open,
  booking,
  onClose,
  formatDate,
}: Props) {

  /* =========================================================
    ESC CLOSE
  ========================================================= */
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !booking) return null;

  /* =========================================================
    GUEST NAME
  ========================================================= */
  const guestName =
    `${booking.guest_fname ?? ''} ${booking.guest_lname ?? ''}`.trim() ||
    'Unknown Guest';

  /* =========================================================
    ROOM DISPLAY (ARCHIVE SNAPSHOT SAFE)
  ========================================================= */
  const roomLabel =
    booking.room_type_name ||
    (booking.room_number ? `Room ${booking.room_number}` : 'Room N/A');

  /* =========================================================
    FORMAT USER
  ========================================================= */
  const formatUser = (user?: any) =>
    user ? `${user.fname ?? ''} ${user.lname ?? ''}`.trim() : '—';

  const approvedBy = formatUser(booking.approved_by_user);
  const checkedInBy = formatUser(booking.checked_in_by_user);
  const checkedOutBy = formatUser(booking.checked_out_by_user);

  /* =========================================================
    SAFE NUMBERS
  ========================================================= */
  const totalAmount = Number(booking.total_amount ?? 0);
  const extraBeds = booking.extra_beds ?? 0;
  const guests = booking.guests ?? 0;

  const money = (value: number) =>
    `₱${value.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
    })}`;

  /* =========================================================
    UI
  ========================================================= */
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      {/* BACKDROP CLOSE */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white w-11/12 md:w-2/3 lg:w-1/2 rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          ✖
        </button>

        {/* HEADER */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold">{guestName}</h2>
          <p className="text-sm text-gray-500">Archived Booking Details</p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 text-sm">

          {/* LEFT */}
          <div className="space-y-2">

            <p><b>Room / Type:</b> {roomLabel}</p>

            <p><b>Start At:</b> {formatDate(booking.start_at)}</p>

            <p><b>End At:</b> {formatDate(booking.end_at)}</p>

            <p><b>Check-in:</b> {formatDate(booking.checked_in_at)}</p>

            <p><b>Check-out:</b> {formatDate(booking.checked_out_at)}</p>

            <p><b>Total:</b> {money(totalAmount)}</p>

            <p><b>Payment Method:</b> {booking.payment_method ?? '—'}</p>

            <p><b>Guests:</b> {guests}</p>

            <p><b>Extra Beds:</b> {extraBeds}</p>

          </div>

          {/* RIGHT */}
          <div className="space-y-2">

            <p><b>Status:</b> Archived</p>

            <p><b>Approved By:</b> {approvedBy}</p>

            <p><b>Checked In By:</b> {checkedInBy}</p>

            <p><b>Checked Out By:</b> {checkedOutBy}</p>

            <p><b>Child:</b> {booking.has_child ? 'Yes' : 'No'}</p>

            <p><b>PWD:</b> {booking.has_pwd ? 'Yes' : 'No'}</p>

            <p><b>Senior:</b> {booking.has_senior ? 'Yes' : 'No'}</p>

            {booking.message && (
              <p><b>Message:</b> {booking.message}</p>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}