'use client';

import { useEffect, useMemo } from 'react';

interface Props {
  open: boolean;
  booking: any | null;
  users?: any[];
  onClose: () => void;
  formatDate: (date?: string | null) => string;
}

/* =========================================================
  SAFE NAME RESOLVER
========================================================= */
function resolveName(users: any[], id?: any) {
  if (!id) return '—';

  const user = users.find(
    (u) => String(u.id) === String(id)
  );

  if (!user) return `User #${id}`;

  const full = `${user?.fname ?? ''} ${user?.lname ?? ''}`.trim();

  return full || user?.email || `User #${id}`;
}

export default function ArchivedModal({
  open,
  booking,
  users = [],
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

  /* DEBUG (IMPORTANT FOR YOUR ISSUE) */
  useEffect(() => {
    if (!open || !booking) return;

    console.log('🔥 ArchivedModal DEBUG');
    console.log('booking:', booking);
    console.log('users count:', users.length);
    console.log('approved_by:', booking?.approved_by);
    console.log('checked_in_by:', booking?.checked_in_by);
    console.log('checked_out_by:', booking?.checked_out_by);
    console.log('archived_by:', booking?.archived_by);
  }, [open, booking, users]);

  if (!open || !booking) return null;

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
          {booking.guest_fname} {booking.guest_lname}
        </h2>

        <div className="grid md:grid-cols-2 gap-4 text-sm">

          {/* LEFT SIDE */}
          <div className="space-y-2">

            <p><b>Room:</b> {booking.room_number}</p>

            <p><b>Check-in:</b> {formatDate(booking.checked_in_at)}</p>
            <p><b>Check-out:</b> {formatDate(booking.checked_out_at)}</p>

            <p><b>Total:</b> ₱{Number(booking.total_amount || 0).toLocaleString()}</p>

            <p><b>Guests:</b> {booking.guests}</p>
            <p><b>Extra Beds:</b> {booking.extra_beds}</p>

          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-2">

            <p><b>Status:</b> Archived</p>

            <p>
              <b>Approved By:</b>{' '}
              {resolveName(users, booking.approved_by)}
            </p>

            <p>
              <b>Checked In By:</b>{' '}
              {resolveName(users, booking.checked_in_by)}
            </p>

            <p>
              <b>Checked Out By:</b>{' '}
              {resolveName(users, booking.checked_out_by)}
            </p>

            <p>
              <b>Archived By:</b>{' '}
              {resolveName(users, booking.archived_by)}
            </p>

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