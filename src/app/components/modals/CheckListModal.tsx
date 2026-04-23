"use client";

import { useEffect, useState, useMemo } from "react";

/* =========================================================
  TYPES
========================================================= */

interface TaskItem {
  id: number;
  item_name: string;
  quantity?: number;
  is_done: boolean;
  note?: string | null;
}

interface Task {
  id: number;
  note?: string | null;
  housekeeping_task_items?: TaskItem[];
}

interface Props {
  task: Task | null;
  onClose: () => void;
  onCheck: (itemId: number, isDone: boolean, note?: string) => void;
  onComplete: (taskId: number, note?: string) => void;
}

/* =========================================================
  COMPONENT
========================================================= */

export default function HousekeepingModal({
  task,
  onClose,
  onCheck,
  onComplete,
}: Props) {

  const [notes, setNotes] = useState<Record<number, string>>({});
  const [overallNote, setOverallNote] = useState("");

  /* =========================================================
    RESET WHEN TASK CHANGES
  ========================================================= */
  useEffect(() => {
    if (!task) return;

    setOverallNote(task.note ?? "");

    // preload item notes safely
    const initialNotes: Record<number, string> = {};

    (task.housekeeping_task_items ?? []).forEach((i) => {
      initialNotes[i.id] = i.note ?? "";
    });

    setNotes(initialNotes);
  }, [task?.id]);

  /* =========================================================
    DERIVED DATA
  ========================================================= */
  const items = useMemo(() => {
    return task?.housekeeping_task_items ?? [];
  }, [task]);

  const done = useMemo(() => {
    return items.filter((i) => i.is_done).length;
  }, [items]);

  const total = items.length;

  const progress = total ? (done / total) * 100 : 0;

  /* =========================================================
    HANDLERS
  ========================================================= */

  const handleCheck = (item: TaskItem, checked: boolean) => {
    const note = notes[item.id] ?? item.note ?? "";
    onCheck(item.id, checked, note);
  };

  const handleNoteChange = (itemId: number, value: string) => {
    setNotes((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  /* =========================================================
    GUARD
  ========================================================= */
  if (!task) return null;

  /* =========================================================
    UI
  ========================================================= */

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white w-[520px] max-h-[85vh] rounded-xl shadow-lg flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">
            Housekeeping Task
          </h2>

          <p className="text-sm text-gray-500">
            Cleaning checklist progress
          </p>

          {/* PROGRESS */}
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

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {items.length === 0 && (
            <p className="text-sm text-gray-500">
              No checklist items found
            </p>
          )}

          {items.map((item) => (
            <div
              key={`task-item-${item.id}`}
              className="border rounded-lg p-3 space-y-2 hover:bg-gray-50"
            >

              {/* CHECKBOX */}
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

                  {item.quantity != null && (
                    <p className="text-xs text-gray-400">
                      Qty: {item.quantity}
                    </p>
                  )}
                </div>

              </label>

              {/* NOTE */}
              <textarea
                value={notes[item.id] ?? ""}
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