"use client";

import { useEffect, useState } from "react";
import { RoomService } from "@/app/services/room.service";

export function useRoomManagement() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);

    try {
      const [roomsData, typesData, amenitiesData, tasksData] =
        await Promise.all([
          RoomService.getRooms(),
          RoomService.getRoomTypes(),
          RoomService.getAmenities(),
          RoomService.getHousekeepingTasks(),
        ]);

      console.log("TASKS:", tasksData); // 🔥 DEBUG

      setRooms(roomsData || []);
      setRoomTypes(typesData || []);
      setAmenities(amenitiesData || []);
      setTasks(tasksData || []);

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // =========================
  // ROOM ACTIONS
  // =========================
  const createRoom = async (data: any) => {
    try {
      const newRoom = await RoomService.createRoom(data);
      setRooms((prev) => [newRoom, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const updateRoom = async (id: number, data: any) => {
    try {
      const updated = await RoomService.updateRoom(id, data);
      setRooms((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const deleteRoom = async (id: number) => {
    try {
      await RoomService.deleteRoom(id);
      setRooms((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // 🧹 HOUSEKEEPING
  // =========================
  const startCleaning = async (taskId: number) => {
    try {
      const updatedTask = await RoomService.startCleaning(taskId);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, ...updatedTask, status: "in_progress" } : t
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const openTask = async (taskId: number) => {
    try {
      const task = await RoomService.getTaskById(taskId);
      setSelectedTask(task);
    } catch (err) {
      console.error(err);
    }
  };

  const updateChecklistItem = async (
    itemId: number,
    isDone: boolean,
    note?: string
  ) => {
    try {
      await RoomService.updateChecklistItem(itemId, isDone, note);

      setSelectedTask((prev: any) => {
        if (!prev) return prev;

        return {
          ...prev,
          housekeeping_task_items:
            prev.housekeeping_task_items?.map((i: any) =>
              i.id === itemId
                ? { ...i, is_done: isDone, note }
                : i
            ) || [],
        };
      });

    } catch (err) {
      console.error(err);
    }
  };

  const completeCleaning = async (taskId: number, note?: string) => {
    try {
      await RoomService.completeCleaning(taskId, note);
      setSelectedTask(null);
      await fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  return {
    rooms,
    tasks,
    selectedTask,
    roomTypes,
    amenities,
    loading,

    refresh: fetchAll,
    setSelectedTask,

    createRoom,
    updateRoom,
    deleteRoom,

    startCleaning,
    openTask,
    updateChecklistItem,
    completeCleaning,
  };
}