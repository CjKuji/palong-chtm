import { Booking } from "@/types/booking.types";

interface Props {
  data: Booking[];
  onOpen: (booking: Booking) => void;
  onCheckIn: (id: number) => void;
  onCheckOut: (id: number) => void;
}

// =========================================================
// STATUS BADGE
// =========================================================
const statusBadge = (status?: string) => {
  const base =
    "px-2 py-1 rounded-full text-xs font-medium capitalize";

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

// =========================================================
// ACTION BUTTONS (LIFECYCLE AWARE)
// =========================================================
const ActionButtons = ({ booking, onOpen, onCheckIn, onCheckOut }: any) => {
  const status = booking.status;

  const btn =
    "px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm";

  return (
    <div className="flex justify-center gap-2 flex-wrap">

      <button
        onClick={() => onOpen(booking)}
        className={`${btn} bg-gray-800 text-white hover:bg-gray-900`}
      >
        View
      </button>

      {status === "approved" && (
        <button
          onClick={() => onCheckIn(booking.id)}
          className={`${btn} bg-blue-500 text-white hover:bg-blue-600`}
        >
          Check In
        </button>
      )}

      {status === "checked_in" && (
        <button
          onClick={() => onCheckOut(booking.id)}
          className={`${btn} bg-purple-500 text-white hover:bg-purple-600`}
        >
          Check Out
        </button>
      )}
    </div>
  );
};

// =========================================================
// MAIN TABLE
// =========================================================
export default function ReservationTable({
  data = [],
  onOpen,
  onCheckIn,
  onCheckOut,
}: Props) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">

      <div className="overflow-x-auto">

        <table className="min-w-[850px] w-full text-sm">

          {/* HEADER */}
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-gray-600">
              <th className="p-4 font-medium">Guest</th>
              <th className="p-4 font-medium">Room</th>
              <th className="p-4 font-medium">Check-in</th>

              {/* NEW: checkout column appears logically in checked_out tab */}
              <th className="p-4 font-medium">Check-out</th>

              <th className="p-4 font-medium">Status</th>
              <th className="p-4 text-center font-medium">Actions</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {data.length ? (
              data.map((r) => {
                const guest =
                  `${r.users?.fname ?? ""} ${r.users?.lname ?? ""}`.trim() ||
                  "Walk-in Guest";

                const room = r.room?.room_number
                  ? `Room ${r.room.room_number}`
                  : `Room #${r.room_id}`;

                const checkInDate = r.start_at
                  ? new Date(r.start_at).toLocaleDateString()
                  : "—";

                const checkOutDate = r.checked_out_at
                  ? new Date(r.checked_out_at).toLocaleString()
                  : "—";

                return (
                  <tr
                    key={r.id}
                    className="border-b hover:bg-gray-50 transition"
                  >

                    {/* GUEST */}
                    <td className="p-4 font-medium text-gray-800">
                      {guest}
                    </td>

                    {/* ROOM */}
                    <td className="p-4 text-gray-700">{room}</td>

                    {/* CHECK-IN */}
                    <td className="p-4 text-gray-600">
                      {checkInDate}
                    </td>

                    {/* CHECK-OUT (NOW FIXED) */}
                    <td className="p-4 text-gray-600">
                      {r.status === "checked_out"
                        ? checkOutDate
                        : "—"}
                    </td>

                    {/* STATUS */}
                    <td className="p-4">
                      <span className={statusBadge(r.status)}>
                        {r.status ?? "unknown"}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-4 text-center">
                      <ActionButtons
                        booking={r}
                        onOpen={onOpen}
                        onCheckIn={onCheckIn}
                        onCheckOut={onCheckOut}
                      />
                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="p-10 text-center text-gray-400"
                >
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