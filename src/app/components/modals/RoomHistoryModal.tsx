"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/app/helpers/date.helpers";

interface Props {
  open: boolean;
  room: any;
  onClose: () => void;
}

export default function RoomHistoryModal({
  open,
  room,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [cleaningHistory, setCleaningHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!open || !room?.id) return;

    const fetchHistory = async () => {
      setLoading(true);

      try {
        // =========================================================
        // CLEANING HISTORY (WITH ROOM + ROOM TYPE)
        // =========================================================
        const { data: tasks, error } = await supabase
          .from("housekeeping_tasks")
          .select(`
            id,
            status,
            note,
            started_at,
            completed_at,
            created_at,
            assigned_to,
            completed_by,
            room_id,
            rooms (
              id,
              room_number,
              room_type_id,
              room_types (
                id,
                name
              )
            )
          `)
          .eq("room_id", room.id) // ⚠️ change here if you later want room_type filtering
          .order("completed_at", { ascending: false });

        if (error) throw error;

        // =========================================================
        // FETCH USERS
        // =========================================================
        const userIds = Array.from(
          new Set(
            (tasks ?? [])
              .flatMap((t) => [t.assigned_to, t.completed_by])
              .filter(Boolean)
          )
        );

        let userMap: Record<string, string> = {};

        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from("users")
            .select("id, fname, lname, email")
            .in("id", userIds);

          users?.forEach((u) => {
            userMap[u.id] =
              `${u.fname ?? ""} ${u.lname ?? ""}`.trim() ||
              u.email ||
              "Staff";
          });
        }

        const enrichedTasks =
          tasks?.map((t) => ({
            ...t,
            assigned_name:
              userMap[t.assigned_to] || "Staff",
            completed_by_name:
              userMap[t.completed_by] || "Staff",

            // ✅ ROOM TYPE LABEL (NEW)
            room_type_name:
              t.rooms?.room_types?.name || "Unknown Type",
          })) || [];

        setCleaningHistory(enrichedTasks);
      } catch (err) {
        console.error("[RoomHistoryModal]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [open, room?.id]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg overflow-hidden">

        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">
              Room Type: {room?.room_type?.name || "Unknown"}
            </h2>

            
          </div>

          <button onClick={onClose} className="text-gray-500">
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-6">

          {loading ? (
            <p className="text-gray-500">Loading history...</p>
          ) : (
            <div>
              <h3 className="font-semibold mb-2">
                🧹 Cleaning History
              </h3>

              {cleaningHistory.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No cleaning history found
                </p>
              ) : (
                <div className="space-y-3">

                  {cleaningHistory.map((task) => (
                    <div
                      key={task.id}
                      className="border rounded-lg p-3 bg-gray-50"
                    >

                      <div className="flex justify-between">
                        <p className="font-medium text-sm">
                          Task #{task.id}
                        </p>

                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {task.status}
                        </span>
                      </div>

                      <div className="text-xs text-gray-600 mt-2 space-y-1">

                        {/* ROOM TYPE (NEW FOCUS) */}
                        <p>
                          🏷 Room Type:{" "}
                          <span className="font-medium">
                            {task.room_type_name}
                          </span>
                        </p>

                        <p>
                          🟢 Started: {formatDateTime(task.started_at)}
                        </p>

                        <p>
                          ✅ Completed: {formatDateTime(task.completed_at)}
                        </p>

                        <p>
                          👷 Assigned:{" "}
                          <span className="font-medium">
                            {task.assigned_name}
                          </span>
                        </p>

                        <p>
                          👷 Completed by:{" "}
                          <span className="font-medium">
                            {task.completed_by_name}
                          </span>
                        </p>

                        {task.note && (
                          <p className="italic text-gray-500">
                            📝 {task.note}
                          </p>
                        )}

                      </div>
                    </div>
                  ))}

                </div>
              )}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-3 border-t text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}