import { supabase } from "@/lib/supabase";

export const RoomService = {
  // =========================================================
  // 🏨 ROOMS (CRUD)
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
      `)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`[getRooms] ${error.message}`);
    return data ?? [];
  },

  async getRoomById(id: number) {
    const { data, error } = await supabase
      .from("rooms")
      .select(`
        *,
        room_types (*),
        room_images (*)
      `)
      .eq("id", id)
      .single();

    if (error) throw new Error(`[getRoomById] ${error.message}`);
    return data;
  },

  async createRoom(payload: any) {
    const { id, ...clean } = payload;

    const { data, error } = await supabase
      .from("rooms")
      .insert(clean)
      .select()
      .single();

    if (error) throw new Error(`[createRoom] ${error.message}`);
    return data;
  },

  async updateRoom(id: number, payload: any) {
    const { id: _, ...clean } = payload;

    const { data, error } = await supabase
      .from("rooms")
      .update(clean)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`[updateRoom] ${error.message}`);
    return data;
  },

  async deleteRoom(id: number) {
    const { error } = await supabase
      .from("rooms")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`[deleteRoom] ${error.message}`);
  },

  // =========================================================
  // 🧹 HOUSEKEEPING TASKS
  // =========================================================

  async getHousekeepingTasks() {
    const { data, error } = await supabase
      .from("housekeeping_tasks")
      .select(`
        *,
        rooms (id, room_number, status),
        housekeeping_task_items (*),
        assigned_user:users!fk_assigned_user (id, fname, lname),
        completed_user:users!fk_completed_user (id, fname, lname)
      `)
      .order("created_at", { ascending: false });

    if (error)
      throw new Error(`[getHousekeepingTasks] ${error.message}`);

    return data ?? [];
  },

  async getTaskById(taskId: number) {
    const { data, error } = await supabase
      .from("housekeeping_tasks")
      .select(`
        *,
        rooms (room_number, status),
        housekeeping_task_items (*),
        assigned_user:users!fk_assigned_user (id, fname, lname),
        completed_user:users!fk_completed_user (id, fname, lname)
      `)
      .eq("id", taskId)
      .maybeSingle();

    if (error) throw new Error(`[getTaskById] ${error.message}`);
    if (!data) throw new Error("Task not found");

    return data;
  },

  // =========================================================
  // 👤 USER
  // =========================================================

  async getCurrentUserId(): Promise<string> {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user?.id) {
      throw new Error("User not authenticated");
    }

    return data.user.id;
  },

  // =========================================================
  // 🟡 START CLEANING (FIXED)
  // =========================================================

  async startCleaning(taskId: number) {
    const staffId = await this.getCurrentUserId();
    const now = new Date().toISOString();

    // 🔒 PREVENT DOUBLE START
    const { data: existingTask } = await supabase
      .from("housekeeping_tasks")
      .select("status, started_at")
      .eq("id", taskId)
      .single();

    if (!existingTask) throw new Error("Task not found");

    if (existingTask.status === "in_progress") {
      throw new Error("Task already in progress");
    }

    if (existingTask.status === "completed") {
      throw new Error("Task already completed");
    }

    const { data, error } = await supabase
      .from("housekeeping_tasks")
      .update({
        status: "in_progress",
        assigned_to: staffId,
        started_at: existingTask.started_at ?? now, // 🔥 NEVER overwrite if exists
      })
      .eq("id", taskId)
      .select("id, room_id")
      .single();

    if (error)
      throw new Error(`[startCleaning] ${error.message}`);

    await supabase
      .from("rooms")
      .update({ status: "cleaning" })
      .eq("id", data.room_id);

    return data;
  },

  // =========================================================
  // 🧹 UPDATE CHECKLIST
  // =========================================================

  async updateChecklistItem(itemId: number, isDone: boolean, note?: string) {
    const { error } = await supabase
      .from("housekeeping_task_items")
      .update({
        is_done: isDone,
        note: note ?? null,
      })
      .eq("id", itemId);

    if (error)
      throw new Error(`[updateChecklistItem] ${error.message}`);
  },

  // =========================================================
  // 🟢 COMPLETE CLEANING (FIXED TIME CALC)
  // =========================================================

  async completeCleaning(taskId: number, note?: string) {
    const staffId = await this.getCurrentUserId();
    const now = new Date().toISOString();

    const { data: task, error: fetchError } = await supabase
      .from("housekeeping_tasks")
      .select("id, room_id, started_at")
      .eq("id", taskId)
      .single();

    if (fetchError)
      throw new Error(`[completeCleaning-fetch] ${fetchError.message}`);

    if (!task.started_at) {
      throw new Error("Task has no start time");
    }

    // 🔥 FIXED ACCURATE DURATION
    const startTime = new Date(task.started_at).getTime();
    const endTime = new Date(now).getTime();

    const durationMinutes = Math.max(
      1,
      Math.round((endTime - startTime) / 60000)
    );

    const { error: updateError } = await supabase
      .from("housekeeping_tasks")
      .update({
        status: "completed",
        note: note ?? null,
        completed_at: now,
        completed_by: staffId,
        duration_minutes: durationMinutes,
      })
      .eq("id", taskId);

    if (updateError)
      throw new Error(`[completeCleaning-update] ${updateError.message}`);

    await supabase
      .from("rooms")
      .update({ status: "available" })
      .eq("id", task.room_id);

    return true;
  },

  // =========================================================
  // 🏷 ROOM TYPES
  // =========================================================

  async getRoomTypes() {
    const { data, error } = await supabase
      .from("room_types")
      .select(`*, room_amenities (amenities (id, name))`);

    if (error)
      throw new Error(`[getRoomTypes] ${error.message}`);

    return data ?? [];
  },

  // =========================================================
  // 🧂 AMENITIES
  // =========================================================

  async getAmenities() {
    const { data, error } = await supabase
      .from("amenities")
      .select("*")
      .order("name");

    if (error)
      throw new Error(`[getAmenities] ${error.message}`);

    return data ?? [];
  },

  // =========================================================
  // 📦 BOOKING HISTORY
  // =========================================================

  async getRoomBookingHistory(roomId: number) {
    const { data, error } = await supabase
      .from("archived_bookings")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (error)
      throw new Error(`[getRoomBookingHistory] ${error.message}`);

    return data ?? [];
  },

  // =========================================================
  // 📋 TEMPLATE FUNCTIONS (UNCHANGED BUT SAFE)
  // =========================================================

  async getTemplateByRoomType(roomTypeId: number) {
    const { data, error } = await supabase
      .from("housekeeping_templates")
      .select("*")
      .eq("room_type_id", roomTypeId)
      .maybeSingle();

    if (error)
      throw new Error(`[getTemplateByRoomType] ${error.message}`);

    return data;
  },

  async createTemplate(roomTypeId: number) {
    const { data, error } = await supabase
      .from("housekeeping_templates")
      .insert({ room_type_id: roomTypeId })
      .select()
      .single();

    if (error)
      throw new Error(`[createTemplate] ${error.message}`);

    return data;
  },
};