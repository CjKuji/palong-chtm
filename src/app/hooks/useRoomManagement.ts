"use client";

import { useEffect, useState, useCallback } from "react";
import { RoomService } from "@/app/services/room.service";

type AnyObj = Record<string, any>;

export function useRoomManagement() {
  // =========================================================
  // STATE
  // =========================================================
  const [rooms, setRooms] = useState<AnyObj[]>([]);
  const [tasks, setTasks] = useState<AnyObj[]>([]);
  const [selectedTask, setSelectedTask] = useState<AnyObj | null>(null);

  const [roomTypes, setRoomTypes] = useState<AnyObj[]>([]);
  const [amenities, setAmenities] = useState<AnyObj[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =========================================================
  // FULL SYNC
  // =========================================================
  const fetchAll = useCallback(async () => {
    setLoading(true);

    try {
      const [roomsData, typesData, amenitiesData, tasksData] =
        await Promise.all([
          RoomService.getRooms(),
          RoomService.getRoomTypes(),
          RoomService.getAmenities(),
          RoomService.getHousekeepingTasks(), // FIXED (now safe joins)
        ]);

      setRooms(roomsData ?? []);
      setRoomTypes(typesData ?? []);
      setAmenities(amenitiesData ?? []);
      setTasks(tasksData ?? []);
    } catch (err) {
      console.error("[useRoomManagement][fetchAll]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // =========================================================
  // TASK REFRESH ONLY
  // =========================================================
  const refreshTasks = useCallback(async () => {
    setRefreshing(true);

    try {
      const tasksData = await RoomService.getHousekeepingTasks();
      setTasks(tasksData ?? []);
    } catch (err) {
      console.error("[refreshTasks]", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // =========================================================
  // ROOM ACTIONS
  // =========================================================
  const createRoom = async (data: AnyObj) => {
    try {
      const newRoom = await RoomService.createRoom(data);
      setRooms((prev) => [newRoom, ...prev]);
    } catch (err) {
      console.error("[createRoom]", err);
    }
  };

  const updateRoom = async (id: number, data: AnyObj) => {
    try {
      const updated = await RoomService.updateRoom(id, data);

      setRooms((prev) =>
        prev.map((room) => (room.id === id ? updated : room))
      );
    } catch (err) {
      console.error("[updateRoom]", err);
    }
  };

  const deleteRoom = async (id: number) => {
    try {
      await RoomService.deleteRoom(id);
      setRooms((prev) => prev.filter((room) => room.id !== id));
    } catch (err) {
      console.error("[deleteRoom]", err);
    }
  };

  // =========================================================
  // 🧹 HOUSEKEEPING FLOW
  // =========================================================

  const startCleaning = async (taskId: number) => {
    try {
      const updatedTask = await RoomService.startCleaning(taskId);

      // optimistic update (safe merge)
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...updatedTask,
                status: "in_progress",
              }
            : task
        )
      );

      // full sync to ensure room status consistency
      await refreshTasks();

      const updatedRooms = await RoomService.getRooms();
      setRooms(updatedRooms);
    } catch (err) {
      console.error("[startCleaning]", err);
    }
  };

  const openTask = async (taskId: number) => {
    try {
      const task = await RoomService.getTaskById(taskId);
      setSelectedTask(task);
    } catch (err) {
      console.error("[openTask]", err);
    }
  };

  const updateChecklistItem = async (
    itemId: number,
    isDone: boolean,
    note?: string
  ) => {
    try {
      await RoomService.updateChecklistItem(itemId, isDone, note);

      setSelectedTask((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          housekeeping_task_items:
            prev.housekeeping_task_items?.map((item: AnyObj) =>
              item.id === itemId
                ? {
                    ...item,
                    is_done: isDone,
                    note: note ?? item.note,
                  }
                : item
            ) || [],
        };
      });
    } catch (err) {
      console.error("[updateChecklistItem]", err);
    }
  };

  // =========================================================
  // COMPLETE CLEANING
  // =========================================================
  const completeCleaning = async (taskId: number, note?: string) => {
    try {
      await RoomService.completeCleaning(taskId, note);

      setSelectedTask(null);

      // full refresh ensures:
      // - room status updated
      // - task status updated
      // - archive synced
      await fetchAll();
    } catch (err) {
      console.error("[completeCleaning]", err);
    }
  };

  // =========================================================
  // RETURN
  // =========================================================
  return {
    rooms,
    tasks,
    selectedTask,
    roomTypes,
    amenities,

    loading,
    refreshing,

    refresh: refreshTasks,
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