import { supabase } from "@/lib/supabase";

export const RoomService = {

  // =========================================================
  // GET ROOMS
  // =========================================================
  async getRooms() {
    const { data, error } = await supabase
      .from("rooms")
      .select(`
        *,
        room_types (
          id,
          name,
          capacity,
          base_price,
          description
        ),
        room_images (
          id,
          image_url,
          display_order
        )
      `);

    if (error) {
      console.error("[getRooms]", error);
      throw error;
    }

    return data ?? [];
  },

  // =========================================================
  // GET HOUSEKEEPING TASKS
  // =========================================================
  async getHousekeepingTasks() {
    const { data, error } = await supabase
      .from("housekeeping_tasks")
      .select(`
        *,
        rooms (
          id,
          room_number,
          status
        ),
        housekeeping_task_items (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getHousekeepingTasks]", error);
      throw error;
    }

    return data ?? [];
  },

  // =========================================================
  // GET CURRENT USER (HOUSEKEEPER)
  // =========================================================
  async getCurrentUserId(): Promise<string> {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user?.id) {
      throw new Error("User not authenticated");
    }

    return data.user.id;
  },

  // =========================================================
  // START CLEANING (AUTO ASSIGN STAFF)
  // =========================================================
  async startCleaning(taskId: number) {

    const staffId = await this.getCurrentUserId();

    const { data: task, error } = await supabase
      .from("housekeeping_tasks")
      .update({
        status: "in_progress",
        assigned_to: staffId,
        started_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select("id, room_id")
      .single();

    if (error) {
      console.error("[startCleaning]", error);
      throw error;
    }

    if (!task) throw new Error("Task not found");

    const { error: roomError } = await supabase
      .from("rooms")
      .update({ status: "cleaning" })
      .eq("id", task.room_id);

    if (roomError) {
      console.error("[startCleaning room]", roomError);
      throw roomError;
    }

    return task;
  },

  // =========================================================
  // GET SINGLE TASK
  // =========================================================
  async getTaskById(taskId: number) {
    const { data, error } = await supabase
      .from("housekeeping_tasks")
      .select(`
        *,
        rooms (room_number, status),
        housekeeping_task_items (*)
      `)
      .eq("id", taskId)
      .maybeSingle();

    if (error) {
      console.error("[getTaskById]", error);
      throw error;
    }

    if (!data) throw new Error("Task not found");

    return data;
  },

  // =========================================================
  // UPDATE CHECKLIST ITEM
  // =========================================================
  async updateChecklistItem(
    itemId: number,
    isDone: boolean,
    note?: string
  ) {
    const { error } = await supabase
      .from("housekeeping_task_items")
      .update({
        is_done: isDone,
        note: note ?? null,
      })
      .eq("id", itemId);

    if (error) {
      console.error("[updateChecklistItem]", error);
      throw error;
    }
  },

  // =========================================================
  // COMPLETE CLEANING
  // =========================================================
  async completeCleaning(taskId: number, note?: string) {

    const { data: task, error: fetchError } = await supabase
      .from("housekeeping_tasks")
      .select("id, room_id")
      .eq("id", taskId)
      .single();

    if (fetchError) {
      console.error("[completeCleaning fetch]", fetchError);
      throw fetchError;
    }

    if (!task) throw new Error("Task not found");

    const { error: updateError } = await supabase
      .from("housekeeping_tasks")
      .update({
        status: "completed",
        note: note ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (updateError) {
      console.error("[completeCleaning update]", updateError);
      throw updateError;
    }

    const { error: roomError } = await supabase
      .from("rooms")
      .update({ status: "inspected" })
      .eq("id", task.room_id);

    if (roomError) {
      console.error("[completeCleaning room]", roomError);
      throw roomError;
    }

    return true;
  },

  // =========================================================
  // MARK ROOM AVAILABLE
  // =========================================================
  async markRoomAvailable(roomId: number) {
    const { error } = await supabase
      .from("rooms")
      .update({ status: "available" })
      .eq("id", roomId);

    if (error) {
      console.error("[markRoomAvailable]", error);
      throw error;
    }
  },

  // =========================================================
  // ROOM CRUD
  // =========================================================
  async createRoom(payload: any) {
    const { data, error } = await supabase
      .from("rooms")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[createRoom]", error);
      throw error;
    }

    return data;
  },

  async updateRoom(id: number, payload: any) {
    const { data, error } = await supabase
      .from("rooms")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[updateRoom]", error);
      throw error;
    }

    return data;
  },

  async deleteRoom(id: number) {
    const { error } = await supabase
      .from("rooms")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[deleteRoom]", error);
      throw error;
    }
  },

  // =========================================================
  // ROOM TYPES
  // =========================================================
  async getRoomTypes() {
    const { data, error } = await supabase
      .from("room_types")
      .select(`
        *,
        room_amenities (
          amenities (
            id,
            name
          )
        )
      `);

    if (error) {
      console.error("[getRoomTypes]", error);
      throw error;
    }

    return data ?? [];
  },

  // =========================================================
  // AMENITIES
  // =========================================================
  async getAmenities() {
    const { data, error } = await supabase
      .from("amenities")
      .select("*")
      .order("name");

    if (error) {
      console.error("[getAmenities]", error);
      throw error;
    }

    return data ?? [];
  }
};