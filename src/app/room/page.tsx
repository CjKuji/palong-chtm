'use client';

import { useState, useMemo } from "react";

import Sidebar from "@/app/components/Sidebar";
import Topbar from "@/app/components/Topbar";
import { useSidebar } from "@/app/context/SidebarContext";
import { useRoomManagement } from "@/app/hooks/useRoomManagement";

import HousekeepingModal from "@/app/components/modals/CheckListModal";
import TemplateModal from "@/app/components/modals/TemplateModal";
import RoomModal from "@/app/components/RoomModal";
import RoomHistoryModal from "@/app/components/modals/RoomHistoryModal";

import { formatDateTime } from "@/app/helpers/date.helpers";

/* =========================================================
  STATUS COLORS
========================================================= */

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  occupied: "bg-red-100 text-red-700",
  cleaning: "bg-yellow-100 text-yellow-700",
  inspected: "bg-blue-100 text-blue-700",
};

const taskColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
};

/* =========================================================
  PAGE
========================================================= */

export default function RoomsInventory() {
  const { collapsed } = useSidebar();

  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [openRoomModal, setOpenRoomModal] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [historyRoom, setHistoryRoom] = useState<any>(null);

  const {
    rooms,
    tasks,
    selectedTask,
    loading,
    deleteRoom,
    startCleaning,
    openTask,
    updateChecklistItem,
    completeCleaning,
    setSelectedTask,
    roomTypes,
    createRoom,
    updateRoom,
  } = useRoomManagement();

  const openRoomHistory = (room: any) => {
    setHistoryRoom(room);
  };

  /* =========================================================
    LAST CLEANING MAP
  ========================================================= */

  const lastCleaningMap = useMemo(() => {
    const map: Record<number, any> = {};

    tasks
      ?.filter((t: any) => t.status === "completed")
      .forEach((t: any) => {
        if (!map[t.room_id]) map[t.room_id] = t;
      });

    return map;
  }, [tasks]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activeMenu="rooms" />

      <main className={`flex-1 ${collapsed ? "ml-20" : "ml-64"} pt-16`}>
        <Topbar />

        <div className="p-6 space-y-6">

          {/* HEADER */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Room Management</h1>
              <p className="text-gray-500 text-sm">
                Manage rooms and housekeeping tasks
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setOpenTemplateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Manage Checklist
              </button>

              <button
                onClick={() => {
                  setSelectedRoom(null);
                  setOpenRoomModal(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Room
              </button>
            </div>
          </div>

          {/* CONTENT */}
          {loading ? (
            <div className="text-gray-500">Loading data...</div>
          ) : (
            <>
              {/* ROOMS */}
              <section>
                <h2 className="font-semibold mb-3">Rooms</h2>

                {rooms.length === 0 ? (
                  <div className="bg-white p-6 rounded-xl shadow text-center text-gray-500">
                    No rooms available
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

                    {rooms.map((room) => {
                      const lastClean = lastCleaningMap[room.id];

                      const roomTypeName =
                        room.room_types?.name ||
                        room.room_type?.name ||
                        "No Room Type";

                      return (
                        <div
                          key={room.id}
                          className="bg-white rounded-xl border shadow-sm hover:shadow-lg transition overflow-hidden"
                        >
                          <div className="p-4 space-y-2">

                            <div className="flex justify-between items-start">
                              <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                  {roomTypeName}
                                </h2>
                                <p className="text-xs text-gray-500">
                                  Room Type
                                </p>
                              </div>

                              <span
                                className={`text-xs px-3 py-1 rounded-full font-medium ${
                                  statusColors[room.status] ??
                                  "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {room.status ?? "unknown"}
                              </span>
                            </div>

                            {/* CLEANING TIME FIX */}
                            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                              <p className="font-medium text-gray-700">
                                🧹 Last cleaned
                              </p>

                              {lastClean ? (
                                <>
                                  <p>
                                    {formatDateTime(lastClean.completed_at)}
                                  </p>

                                  <p className="text-gray-700 font-medium">
                                    Cleaned by:{" "}
                                    {lastClean.completed_user
                                      ? `${lastClean.completed_user.fname ?? ""} ${lastClean.completed_user.lname ?? ""}`
                                      : "Unknown"}
                                  </p>
                                </>
                              ) : (
                                <p className="text-gray-400">No record yet</p>
                              )}
                            </div>
                          </div>

                          {/* ACTIONS */}
                          <div className="px-4 py-3 flex justify-between border-t bg-gray-50">

                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  setSelectedRoom(room);
                                  setOpenRoomModal(true);
                                }}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => deleteRoom(room.id)}
                                className="text-sm text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            </div>

                            <button
                              onClick={() => openRoomHistory(room)}
                              className="text-sm text-purple-600 hover:underline"
                            >
                              History
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                )}
              </section>

              {/* TASKS */}
              <section>
                <h2 className="font-semibold mb-3">Housekeeping Tasks</h2>

                {tasks.length === 0 ? (
                  <div className="bg-white p-6 rounded shadow text-center text-gray-500">
                    No housekeeping tasks yet
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

                    {tasks.map((task) => {
                      const done =
                        task.housekeeping_task_items?.filter(
                          (i: any) => i.is_done
                        ).length || 0;

                      const total =
                        task.housekeeping_task_items?.length || 0;

                      const progress =
                        total === 0 ? 0 : (done / total) * 100;

                      const roomTypeName =
                        task.rooms?.room_types?.name ||
                        `Room ${task.rooms?.room_number ?? "—"}`;

                      return (
                        <div
                          key={task.id}
                          className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition"
                        >
                          <div className="flex justify-between items-center">

                            <h3 className="font-semibold">
                              {roomTypeName}
                            </h3>

                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                taskColors[task.status] ??
                                "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>

                          {/* PROGRESS */}
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{Math.round(progress)}%</span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 bg-green-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* COMPLETED */}
                          {task.status === "completed" && (
                            <div className="mt-3 text-xs text-gray-600 space-y-1">
                              <p>
                                🧹 Cleaned by:{" "}
                                <span className="font-medium">
                                  {task.completed_user
                                    ? `${task.completed_user.fname ?? ""} ${task.completed_user.lname ?? ""}`
                                    : "Unknown"}
                                </span>
                              </p>

                              <p>
                                🕒 Finished: {formatDateTime(task.completed_at)}
                              </p>
                            </div>
                          )}

                          {/* ACTIONS */}
                          <div className="mt-4 flex gap-2">

                            {task.status === "pending" && (
                              <button
                                onClick={() => startCleaning(task.id)}
                                className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded"
                              >
                                Start
                              </button>
                            )}

                            {task.status === "in_progress" && (
                              <button
                                onClick={() => openTask(task.id)}
                                className="flex-1 px-3 py-1 text-sm bg-yellow-500 text-white rounded"
                              >
                                Continue
                              </button>
                            )}

                            {task.status === "completed" && (
                              <button
                                onClick={() => openTask(task.id)}
                                className="flex-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded"
                              >
                                View
                              </button>
                            )}

                          </div>
                        </div>
                      );
                    })}

                  </div>
                )}
              </section>

            </>
          )}
        </div>
      </main>

      {/* MODALS */}
      <HousekeepingModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onCheck={updateChecklistItem}
        onComplete={completeCleaning}
      />

      <TemplateModal
        open={openTemplateModal}
        onClose={() => setOpenTemplateModal(false)}
      />

      <RoomModal
        open={openRoomModal}
        room={selectedRoom}
        roomTypes={roomTypes}
        onClose={() => setOpenRoomModal(false)}
        onSaved={(savedRoom: any) => {
          setOpenRoomModal(false);
          setSelectedRoom(null);

          const { id, ...payload } = savedRoom;

          if (selectedRoom) updateRoom(selectedRoom.id, payload);
          else createRoom(payload);
        }}
      />

      <RoomHistoryModal
        room={historyRoom}
        open={!!historyRoom}
        onClose={() => setHistoryRoom(null)}
      />
    </div>
  );
}