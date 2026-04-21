"use client";

import { useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import Topbar from "@/app/components/Topbar";
import { useSidebar } from "@/app/context/SidebarContext";
import { useRoomManagement } from "@/app/hooks/useRoomManagement";
import HousekeepingModal from "@/app/components/CheckListModal";
import TemplateModal from "@/app/components/TemplateModal";
import RoomModal from "../components/RoomModal";

const statusColors: any = {
  available: "bg-green-100 text-green-700",
  occupied: "bg-red-100 text-red-700",
  cleaning: "bg-yellow-100 text-yellow-700",
  inspected: "bg-blue-100 text-blue-700",
};

const taskColors: any = {
  pending: "bg-gray-100 text-gray-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
};

export default function RoomsInventory() {
  const { collapsed } = useSidebar();
  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [openRoomModal, setOpenRoomModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

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
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Manage Checklist
              </button>

              <button
                onClick={() => {
                  setSelectedRoom(null);
                  setOpenRoomModal(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Room
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-gray-500">Loading data...</div>
          ) : (
            <>
              {/* ================= ROOMS ================= */}
              <section>
                <h2 className="font-semibold mb-3">Rooms</h2>

                {rooms.length === 0 ? (
                  <div className="bg-white p-6 rounded shadow text-center text-gray-500">
                    No rooms available
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-center">
                          <h2 className="font-semibold text-lg">
                            Room {room.room_number}
                          </h2>

                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              statusColors[room.status] || "bg-gray-100"
                            }`}
                          >
                            {room.status}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 mt-1">
                          {room.room_types?.name || "No type"}
                        </p>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedRoom(room);
                              setOpenRoomModal(true);
                            }}
                            className="text-sm text-blue-500 hover:underline"
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
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ================= TASKS ================= */}
              <section>
                <h2 className="font-semibold mb-3">
                  Housekeeping Tasks
                </h2>

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

                      return (
                        <div
                          key={task.id}
                          className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition"
                        >
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold">
                              Room {task.rooms?.room_number}
                            </h3>

                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                taskColors[task.status]
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>

                          {/* PROGRESS */}
                          <div className="mt-3">
                            <div className="text-xs text-gray-500 mb-1">
                              Progress {done}/{total}
                            </div>

                            <div className="w-full bg-gray-200 h-2 rounded-full">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* ACTIONS */}
                          <div className="mt-4 flex gap-2">
                            {task.status === "pending" && (
                              <button
                                onClick={() =>
                                  startCleaning(task.id)
                                }
                                className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Start
                              </button>
                            )}

                            {task.status === "in_progress" && (
                              <button
                                onClick={() => openTask(task.id)}
                                className="flex-1 px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                              >
                                Continue
                              </button>
                            )}

                            {task.status === "completed" && (
                              <span className="text-green-600 text-sm">
                                Done
                              </span>
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

      {/* MODAL */}
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

          if (selectedRoom) {
            const { id, ...payload } = savedRoom;
            updateRoom(selectedRoom.id, payload);
          } else {
            const { id, ...payload } = savedRoom;
            createRoom(payload);
          }
        }}
      />
    </div>
  );
}