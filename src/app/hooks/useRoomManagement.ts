"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RoomService } from "@/app/services/room.service";

type AnyObj = Record<string, any>;

/* =========================================================
  DATE SAFETY HELPERS (NEW - SAFE FOR CLEANING TIME)
========================================================= */

const toSafeDate = (value?: string | null) => {
  if (!value) return null;

  const d = new Date(value);
  if (isNaN(d.getTime())) return null;

  return d;
};

const formatDateTime = (value?: string | null) => {
  const date = toSafeDate(value);
  if (!date) return "N/A";

  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export function useRoomManagement() {
  const [rooms, setRooms] = useState<AnyObj[]>([]);
  const [tasks, setTasks] = useState<AnyObj[]>([]);
  const [selectedTask, setSelectedTask] = useState<AnyObj | null>(null);

  const [roomTypes, setRoomTypes] = useState<AnyObj[]>([]);
  const [amenities, setAmenities] = useState<AnyObj[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  /* =========================================================
    🔥 NORMALIZER (ENHANCED - PRESERVES CLEANING DATES)
  ========================================================= */
  const normalizeRooms = (roomsData: AnyObj[], typesData: AnyObj[]) => {
    return (roomsData ?? []).map((room) => {
      if (room.room_type) return room;

      const foundType = typesData.find(
        (t) => t.id === room.room_type_id
      );

      return {
        ...room,
        room_type: foundType ?? null,
      };
    });
  };

  /* =========================================================
    FULL SYNC
  ========================================================= */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [roomsData, typesData, amenitiesData, tasksData] =
        await Promise.all([
          RoomService.getRooms(),
          RoomService.getRoomTypes(),
          RoomService.getAmenities(),
          RoomService.getHousekeepingTasks(),
        ]);

      if (!isMounted.current) return;

      const normalizedRooms = normalizeRooms(
        roomsData ?? [],
        typesData ?? []
      );

      setRooms(normalizedRooms);
      setRoomTypes(typesData ?? []);
      setAmenities(amenitiesData ?? []);
      setTasks(tasksData ?? []);
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err?.message || "Failed to load data");
    } finally {
      if (!isMounted.current) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* =========================================================
    REFRESH TASKS
  ========================================================= */
  const refreshTasks = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const tasksData = await RoomService.getHousekeepingTasks();

      if (!isMounted.current) return;
      setTasks(tasksData ?? []);
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err?.message || "Failed to refresh tasks");
    } finally {
      if (!isMounted.current) return;
      setRefreshing(false);
    }
  }, []);

  /* =========================================================
    ACTION WRAPPER
  ========================================================= */
  const runAction = useCallback(async (fn: () => Promise<void>) => {
    setActionLoading(true);
    setError(null);

    try {
      await fn();
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err?.message || "Action failed");
    } finally {
      if (!isMounted.current) return;
      setActionLoading(false);
    }
  }, []);

  /* =========================================================
    ROOM ACTIONS
  ========================================================= */

  const createRoom = useCallback(
    (data: AnyObj) =>
      runAction(async () => {
        const newRoom = await RoomService.createRoom(data);

        if (!isMounted.current) return;

        const type = roomTypes.find(
          (t) => t.id === newRoom.room_type_id
        );

        setRooms((prev) => [
          { ...newRoom, room_type: type ?? null },
          ...prev,
        ]);
      }),
    [runAction, roomTypes]
  );

  const updateRoom = useCallback(
    (id: number, data: AnyObj) =>
      runAction(async () => {
        const updated = await RoomService.updateRoom(id, data);

        if (!isMounted.current) return;

        const type = roomTypes.find(
          (t) => t.id === updated.room_type_id
        );

        setRooms((prev) =>
          prev.map((room) =>
            room.id === id
              ? { ...room, ...updated, room_type: type ?? null }
              : room
          )
        );
      }),
    [runAction, roomTypes]
  );

  const deleteRoom = useCallback(
    (id: number) =>
      runAction(async () => {
        await RoomService.deleteRoom(id);

        if (!isMounted.current) return;

        setRooms((prev) => prev.filter((room) => room.id !== id));
      }),
    [runAction]
  );

  /* =========================================================
    🧹 HOUSEKEEPING
  ========================================================= */

  const startCleaning = useCallback(
    (taskId: number) =>
      runAction(async () => {
        const updatedTask = await RoomService.startCleaning(taskId);

        if (!isMounted.current) return;

        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...updatedTask,
                  status: "in_progress",
                  started_at:
                    updatedTask.started_at ?? new Date().toISOString(),
                }
              : task
          )
        );

        const updatedRooms = await RoomService.getRooms();

        if (!isMounted.current) return;

        setRooms((prev) =>
          normalizeRooms(updatedRooms, roomTypes)
        );
      }),
    [runAction, roomTypes]
  );

  const openTask = useCallback(async (taskId: number) => {
    try {
      const task = await RoomService.getTaskById(taskId);

      if (!isMounted.current) return;
      setSelectedTask(task);
    } catch (err: any) {
      if (!isMounted.current) return;
      setError(err?.message || "Failed to load task");
    }
  }, []);

  const updateChecklistItem = useCallback(
    (itemId: number, isDone: boolean, note?: string) =>
      runAction(async () => {
        await RoomService.updateChecklistItem(itemId, isDone, note);

        if (!isMounted.current) return;

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
              ) ?? [],
          };
        });
      }),
    [runAction]
  );

  /* =========================================================
    COMPLETE CLEANING (WITH TIME FIX)
  ========================================================= */

  const completeCleaning = useCallback(
    (taskId: number, note?: string) =>
      runAction(async () => {
        await RoomService.completeCleaning(taskId, note);

        if (!isMounted.current) return;

        setSelectedTask(null);

        await fetchAll();
      }),
    [runAction, fetchAll]
  );

  return {
    rooms,
    tasks,
    selectedTask,
    roomTypes,
    amenities,

    loading,
    refreshing,
    actionLoading,
    error,

    refresh: refreshTasks,
    setSelectedTask,

    createRoom,
    updateRoom,
    deleteRoom,

    startCleaning,
    openTask,
    updateChecklistItem,
    completeCleaning,

    /* optional export if you want UI formatting reuse */
    formatDateTime,
  };
}