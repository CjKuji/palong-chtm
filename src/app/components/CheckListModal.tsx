"use client";

export default function HousekeepingModal({
  task,
  onClose,
  onCheck,
  onComplete,
}: any) {
  if (!task) return null;

  const done =
    task.housekeeping_task_items?.filter((i: any) => i.is_done)
      .length || 0;

  const total = task.housekeeping_task_items?.length || 0;

  const progress = total === 0 ? 0 : (done / total) * 100;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[500px] max-h-[80vh] rounded-xl shadow-lg flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">
            Room {task.rooms?.room_number}
          </h2>

          <p className="text-sm text-gray-500">
            Cleaning Checklist
          </p>

          {/* PROGRESS */}
          <div className="mt-3">
            <div className="text-xs mb-1">
              {done}/{total} completed
            </div>

            <div className="w-full bg-gray-200 h-2 rounded-full">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* CHECKLIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {task.housekeeping_task_items?.map((item: any) => (
            <label
              key={item.id}
              className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={item.is_done}
                onChange={(e) =>
                  onCheck(item.id, e.target.checked)
                }
              />

              <div className="flex-1">
                <p className="text-sm">{item.item_name}</p>
                {item.quantity && (
                  <p className="text-xs text-gray-400">
                    Qty: {item.quantity}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded"
          >
            Close
          </button>

          <button
            onClick={() => onComplete(task.id)}
            disabled={done !== total}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded disabled:opacity-50"
          >
            Complete Cleaning
          </button>
        </div>
      </div>
    </div>
  );
}