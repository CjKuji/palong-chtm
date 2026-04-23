import { Booking } from "@/types/booking.types";

interface Props {
  data: Booking[];
  onOpen: (booking: Booking) => void;
  onApprove: (id: number) => void;
  onCheckIn: (id: number) => void;
  onCheckOut: (id: number) => void;
}

/* =========================================================
  STATUS BADGE
========================================================= */

const statusBadge = (status?: Booking["status"]) => {
  const base = "px-2 py-1 rounded-full text-xs font-medium capitalize";

  switch (status) {
    case "pending":
      return `${base} bg-gray-100 text-gray-700`;
    case "approved":
      return `${base} bg-blue-100 text-blue-700`;
    case "checked_in":
      return `${base} bg-green-100 text-green-700`;
    case "checked_out":
      return `${base} bg-purple-100 text-purple-700`;
    case "rejected":
      return `${base} bg-red-100 text-red-700`;
    default:
      return `${base} bg-gray-100 text-gray-500`;
  }
};

/* =========================================================
  ACTION BUTTONS (SYNCED WITH MODAL FLOW)
========================================================= */

const ActionButtons = ({
  booking,
  onOpen,
  onApprove,
  onCheckIn,
  onCheckOut,
}: {
  booking: Booking;
  onOpen: (b: Booking) => void;
  onApprove: (id: number) => void;
  onCheckIn: (id: number) => void;
  onCheckOut: (id: number) => void;
}) => {
  const status = booking?.status;

  const btn =
    "px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm";

  return (
    <div className="flex justify-center gap-2 flex-wrap">

      {/* VIEW */}
      <button
        onClick={() => onOpen(booking)}
        className={`${btn} bg-gray-800 text-white`}
      >
        View
      </button>

      {/* =========================================================
        APPROVE (PENDING ONLY)
      ========================================================= */}
      {status === "pending" && (
        <button
          onClick={() => onApprove(booking.id)}
          className={`${btn} bg-blue-500 text-white`}
        >
          Approve
        </button>
      )}

      {/* =========================================================
        CHECK IN (APPROVED ONLY)
      ========================================================= */}
      {status === "approved" && (
        <button
          onClick={() => onCheckIn(booking.id)}
          className={`${btn} bg-green-500 text-white`}
        >
          Check In
        </button>
      )}

      {/* =========================================================
        CHECK OUT (CHECKED IN ONLY)
      ========================================================= */}
      {status === "checked_in" && (
        <button
          onClick={() => onCheckOut(booking.id)}
          className={`${btn} bg-purple-500 text-white`}
        >
          Check Out
        </button>
      )}

    </div>
  );
};

/* =========================================================
  TABLE
========================================================= */

export default function ReservationTable({
  data = [],
  onOpen,
  onApprove,
  onCheckIn,
  onCheckOut,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">

      <div className="overflow-x-auto">
        <table className="min-w-[1000px] w-full text-sm">

          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-gray-600">

              <th className="p-4">Guest</th>
              <th className="p-4">Room Type</th>
              <th className="p-4">Start At</th>
              <th className="p-4">End At</th>
              <th className="p-4">Check-in</th>
              <th className="p-4">Check-out</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Actions</th>

            </tr>
          </thead>

          <tbody>
            {data.length ? (
              data.map((r) => {
                const guest =
                  `${r?.users?.fname ?? ""} ${r?.users?.lname ?? ""}`.trim() ||
                  "Guest";

                const roomType =
                  r?.room?.room_type?.name ?? "Unknown Type";

                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50">

                    <td className="p-4 font-medium">{guest}</td>
                    <td className="p-4 text-gray-600">{roomType}</td>

                    <td className="p-4">
                      {r?.start_at
                        ? new Date(r.start_at).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="p-4">
                      {r?.end_at
                        ? new Date(r.end_at).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="p-4">
                      {r?.checked_in_at
                        ? new Date(r.checked_in_at).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="p-4">
                      {r?.checked_out_at
                        ? new Date(r.checked_out_at).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="p-4">
                      <span className={statusBadge(r.status)}>
                        {r.status}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <ActionButtons
                        booking={r}
                        onOpen={onOpen}
                        onApprove={onApprove}
                        onCheckIn={onCheckIn}
                        onCheckOut={onCheckOut}
                      />
                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-10 text-center text-gray-400">
                  No reservations found
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}