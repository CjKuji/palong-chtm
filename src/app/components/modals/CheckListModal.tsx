"use client";

import { useEffect, useState } from "react";

export default function HousekeepingModal({
  task,
  onClose,
  onCheck,
  onComplete,
}: any) {
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [overallNote, setOverallNote] = useState("");

  // ✅ ALWAYS call hooks first (before any return)
  useEffect(() => {
    if (task) {
      setOverallNote(task.note ?? "");
      setNotes({});
    }
  }, [task?.id]);

  // ✅ NOW safe to early return AFTER hooks
  if (!task) return null;

  const items = task.housekeeping_task_items ?? [];

  const done = items.filter((i: any) => i.is_done).length;
  const total = items.length;
  const progress = total === 0 ? 0 : (done / total) * 100;

  const handleCheck = (item: any, checked: boolean) => {
    const note = notes[item.id] ?? item.note ?? "";
    onCheck(item.id, checked, note);
  };

  const handleNoteChange = (itemId: number, value: string) => {
    setNotes((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[520px] max-h-[85vh] rounded-xl shadow-lg flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">
            Room {task.rooms?.room_number}
          </h2>

          <p className="text-sm text-gray-500">
            Cleaning Checklist
          </p>

          <div className="mt-3">
            <div className="text-xs mb-1">
              {done}/{total} completed
            </div>

            <div className="w-full bg-gray-200 h-2 rounded-full">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* CHECKLIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {items.length === 0 && (
            <p className="text-sm text-gray-500">
              No checklist items found
            </p>
          )}

          {items.map((item: any) => (
            <div
              key={item.id}
              className="border rounded-lg p-3 space-y-2 hover:bg-gray-50"
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.is_done}
                  onChange={(e) =>
                    handleCheck(item, e.target.checked)
                  }
                />

                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {item.item_name}
                  </p>

                  {item.quantity && (
                    <p className="text-xs text-gray-400">
                      Qty: {item.quantity}
                    </p>
                  )}
                </div>
              </label>

              <textarea
                value={notes[item.id] ?? item.note ?? ""}
                onChange={(e) =>
                  handleNoteChange(item.id, e.target.value)
                }
                placeholder="Add note (optional)..."
                className="w-full text-xs border rounded p-2 resize-none focus:outline-none focus:ring"
              />
            </div>
          ))}

          {/* OVERALL NOTE */}
          <div className="border-t pt-3 mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Overall Cleaning Note
            </p>

            <textarea
              value={overallNote}
              onChange={(e) => setOverallNote(e.target.value)}
              placeholder="Optional summary..."
              className="w-full text-xs border rounded p-2 resize-none focus:outline-none focus:ring"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
          >
            Close
          </button>

          <button
            onClick={() => onComplete(task.id, overallNote)}
            disabled={total === 0 || done !== total}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Cleaning
          </button>
        </div>
      </div>
    </div>
  );
}