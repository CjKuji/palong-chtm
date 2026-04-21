import { supabase } from "@/lib/supabase";

export const RoomService = {

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

  async getCurrentUserId(): Promise<string> {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user?.id) {
      throw new Error("User not authenticated");
    }

    return data.user.id;
  },

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

  async createRoom(payload: any) {
    const { id, ...cleanPayload } = payload;

    const { data, error } = await supabase
      .from("rooms")
      .insert(cleanPayload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateRoom(id: number, payload: any) {
    const { id: _, ...cleanPayload } = payload;

    const { data, error } = await supabase
      .from("rooms")
      .update(cleanPayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
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
  },

  async getTemplateByRoomType(roomTypeId: number) {
    const { data, error } = await supabase
      .from("housekeeping_templates")
      .select("*")
      .eq("room_type_id", roomTypeId)
      .maybeSingle();

    if (error) {
      console.error("[getTemplateByRoomType]", error);
      throw error;
    }

    return data;
  },

  async createTemplate(roomTypeId: number) {
    const { data, error } = await supabase
      .from("housekeeping_templates")
      .insert({
        room_type_id: roomTypeId,
        name: "Auto Template",
      })
      .select()
      .single();

    if (error) {
      console.error("[createTemplate]", error);
      throw error;
    }

    return data;
  },

  async getTemplateItems(templateId: number) {
    const { data, error } = await supabase
      .from("housekeeping_template_items")
      .select("*")
      .eq("template_id", templateId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[getTemplateItems]", error);
      throw error;
    }

    return data ?? [];
  },

  async addTemplateItem(templateId: number, payload: any) {
    const { data, error } = await supabase
      .from("housekeeping_template_items")
      .insert({
        template_id: templateId,
        item_name: payload.item_name,
        default_quantity: payload.default_quantity ?? 1,
      })
      .select()
      .single();

    if (error) {
      console.error("[addTemplateItem]", error);
      throw error;
    }

    return data;
  },

  async deleteTemplateItem(itemId: number) {
    const { error } = await supabase
      .from("housekeeping_template_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      console.error("[deleteTemplateItem]", error);
      throw error;
    }
  },

  async updateTemplateItem(itemId: number, payload: any) {
    const { data, error } = await supabase
      .from("housekeeping_template_items")
      .update({
        item_name: payload.item_name,
        default_quantity: payload.default_quantity,
      })
      .eq("id", itemId)
      .select()
      .single();

    if (error) {
      console.error("[updateTemplateItem]", error);
      throw error;
    }

    return data;
  },
};