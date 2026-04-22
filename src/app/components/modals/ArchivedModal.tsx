'use client';

import { useEffect } from 'react';

interface Props {
  open: boolean;
  booking: any | null;
  onClose: () => void;
  formatDate: (date: string | null | undefined) => string;
}

export default function ArchivedModal({
  open,
  booking,
  onClose,
  formatDate,
}: Props) {

  /* ESC CLOSE */
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (open) window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

  /* DEBUG */
  useEffect(() => {
    if (!open || !booking) return;

    console.log('🔥 ArchivedModal DEBUG');
    console.log(booking);
  }, [open, booking]);

  if (!open || !booking) return null;

  const guestName =
    `${booking.guest_fname ?? ''} ${booking.guest_lname ?? ''}`.trim() ||
    'Unknown Guest';

  const approvedBy =
    booking.approved_by_user
      ? `${booking.approved_by_user.fname} ${booking.approved_by_user.lname}`
      : '—';

  const checkedInBy =
    booking.checked_in_by_user
      ? `${booking.checked_in_by_user.fname} ${booking.checked_in_by_user.lname}`
      : '—';

  const checkedOutBy =
    booking.checked_out_by_user
      ? `${booking.checked_out_by_user.fname} ${booking.checked_out_by_user.lname}`
      : '—';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white w-11/12 md:w-2/3 lg:w-1/2 rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          ✖
        </button>

        {/* HEADER */}
        <h2 className="text-2xl font-bold mb-4">
          {guestName}
        </h2>

        <div className="grid md:grid-cols-2 gap-4 text-sm">

          {/* LEFT SIDE */}
          <div className="space-y-2">

            <p><b>Room:</b> {booking.room_number ?? '—'}</p>

            <p><b>Check-in:</b> {formatDate(booking.checked_in_at)}</p>
            <p><b>Check-out:</b> {formatDate(booking.checked_out_at)}</p>

            <p>
              <b>Total:</b> ₱
              {Number(booking.total_amount ?? 0).toLocaleString()}
            </p>

            <p><b>Guests:</b> {booking.guests ?? 0}</p>
            <p><b>Extra Beds:</b> {booking.extra_beds ?? 0}</p>

          </div>

          {/* RIGHT SIDE */}
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