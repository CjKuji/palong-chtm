export default function ReservationTabs({ tab, setTab }: any) {
  const tabs = [
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "checked_in", label: "Checked In" },
    { id: "checked_out", label: "Checked Out" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <div className="rounded-2xl border bg-white p-2 shadow-sm">

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">

        {tabs.map((t) => {
          const active = tab === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`
                whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium
                transition-all duration-200
                ${
                  active
                    ? "bg-pink-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }
              `}
            >
              {t.label}
            </button>
          );
        })}

      </div>
    </div>
  );
}