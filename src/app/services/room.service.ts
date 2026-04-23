import { supabase } from "@/lib/supabase";

/* =========================================================
  DATE HELPERS (NEW – SAFE CLEANING TIME HANDLING)
========================================================= */

export const toLocalDateTime = (value?: string | null) => {
  if (!value) return null;

  const d = new Date(value);
  if (isNaN(d.getTime())) return null;

  return d;
};

export const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return "N/A";

  const date = toLocalDateTime(dateString);
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

/* OPTIONAL DEBUG HELPER (safe to keep for dev) */
export const formatDebugDate = (label: string, value?: string | null) => {
  if (!value) {
    console.log(`❌ ${label}: NULL`);
    return;
  }

  const d = new Date(value);

  console.log(`🧪 ${label}:`, {
    raw: value,
    parsed: d.toString(),
    iso: d.toISOString(),
    local: d.toLocaleString("en-PH"),
  });
};

/* =========================================================
  NORMALIZER
========================================================= */
const normalizeRoom = (room: any, roomTypes: any[]) => {
  return {
    ...room,
    room_type:
      roomTypes.find((t) => t.id === room.room_type_id) ?? null,
  };
};

/* =========================================================
  ROOM SERVICE
========================================================= */
export const RoomService = {
  /* =========================================================
    🏨 ROOMS
  ========================================================= */

  async getRooms() {
    const [roomsRes, typesRes] = await Promise.all([
      supabase
        .from("rooms")
        .select(`
          id,
          room_number,
          floor,
          status,
          room_type_id,
          created_at,

          room_types (
            id,
            name,
            capacity,
            base_price,
            description,

            room_amenities (
              amenities (
                id,
                name
              )
            )
          ),

          room_images (
            id,
            image_url,
            display_order
          )
        `)
        .order("created_at", { ascending: false }),

      supabase.from("room_types").select("*"),
    ]);

    if (roomsRes.error)
      throw new Error(`[getRooms] ${roomsRes.error.message}`);

    if (typesRes.error)
      throw new Error(`[getRoomTypes] ${typesRes.error.message}`);

    const rooms = roomsRes.data ?? [];
    const types = typesRes.data ?? [];

    return rooms.map((room) => normalizeRoom(room, types));
  },

  async getRoomById(id: number) {
    const [roomRes, typesRes] = await Promise.all([
      supabase
        .from("rooms")
        .select(`
          *,
          room_types (
            *,
            room_amenities (
              amenities (id, name)
            )
          ),
          room_images (*)
        `)
        .eq("id", id)
        .maybeSingle(),

      supabase.from("room_types").select("*"),
    ]);

    if (roomRes.error)
      throw new Error(`[getRoomById] ${roomRes.error.message}`);

    if (!roomRes.data) throw new Error("Room not found");

    return normalizeRoom(roomRes.data, typesRes.data ?? []);
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

  /* =========================================================
    🧹 HOUSEKEEPING TASKS
  ========================================================= */

  async getHousekeepingTasks() {
    const { data, error } = await supabase
      .from("housekeeping_tasks")
      .select(`
        *,
        rooms (
          id,
          room_number,
          status,
          room_types (
            id,
            name,
            capacity,
            base_price
          )
        ),
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
        housekeeping_task_items (*),
        rooms (
          id,
          room_number,
          room_types (id, name)
        ),
        completed_user:users!fk_completed_user (id, fname, lname)
      `)
      .eq("id", taskId)
      .single();

    if (error)
      throw new Error(`[getTaskById] ${error.message}`);

    return data;
  },

  /* =========================================================
    USER
  ========================================================= */

  async getCurrentUserId(): Promise<string> {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user?.id) {
      throw new Error("User not authenticated");
    }

    return data.user.id;
  },

  /* =========================================================
    START CLEANING (stores START time)
  ========================================================= */

  async startCleaning(taskId: number) {
    const staffId = await this.getCurrentUserId();
    const now = new Date().toISOString();

    const { data: existingTask } = await supabase
      .from("housekeeping_tasks")
      .select("status, started_at")
      .eq("id", taskId)
      .single();

    if (!existingTask) throw new Error("Task not found");

    const { data, error } = await supabase
      .from("housekeeping_tasks")
      .update({
        status: "in_progress",
        assigned_to: staffId,
        started_at: existingTask.started_at ?? now,
      })
      .eq("id", taskId)
      .select("id, room_id")
      .single();

    if (error)
      throw new Error(`[startCleaning] ${error.message}`);

    if (data?.room_id) {
      await supabase
        .from("rooms")
        .update({ status: "cleaning" })
        .eq("id", data.room_id);
    }

    return data;
  },

  /* =========================================================
    CHECKLIST
  ========================================================= */

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

    if (error)
      throw new Error(`[updateChecklistItem] ${error.message}`);
  },

  /* =========================================================
    COMPLETE CLEANING (stores END time + duration)
  ========================================================= */

  async completeCleaning(taskId: number, note?: string) {
    const staffId = await this.getCurrentUserId();
    const now = new Date().toISOString();

    const { data: task, error } = await supabase
      .from("housekeeping_tasks")
      .select("id, room_id, started_at")
      .eq("id", taskId)
      .single();

    if (error)
      throw new Error(`[completeCleaning] ${error.message}`);

    const start = new Date(task.started_at).getTime();
    const end = new Date(now).getTime();

    const durationMinutes = Math.max(
      1,
      Math.round((end - start) / 60000)
    );

    const { error: updateError } = await supabase
      .from("housekeeping_tasks")
      .update({
        status: "completed",
        note: note ?? null,
        completed_at: now,          // ✅ CLEANING END TIME
        completed_by: staffId,
        duration_minutes: durationMinutes,
      })
      .eq("id", taskId);

    if (updateError)
      throw new Error(`[completeCleaning-update] ${updateError.message}`);

    if (task.room_id) {
      await supabase
        .from("rooms")
        .update({ status: "available" })
        .eq("id", task.room_id);
    }

    return true;
  },

  /* =========================================================
    ROOM TYPES
  ========================================================= */

  async getRoomTypes() {
    const { data, error } = await supabase
      .from("room_types")
      .select(`
        *,
        room_amenities (
          amenities (id, name)
        )
      `);

    if (error)
      throw new Error(`[getRoomTypes] ${error.message}`);

    return data ?? [];
  },

  /* =========================================================
    AMENITIES
  ========================================================= */

  async getAmenities() {
    const { data, error } = await supabase
      .from("amenities")
      .select("*")
      .order("name");

    if (error)
      throw new Error(`[getAmenities] ${error.message}`);

    return data ?? [];
  },

  /* =========================================================
    HISTORY
  ========================================================= */

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
};