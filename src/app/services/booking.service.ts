import { supabase } from "@/lib/supabase";
import { BookingStatus } from "@/types/enums.types";

export class BookingService {

  // =========================================================
  // AMENITIES FORMATTER
  // =========================================================
  private static formatAmenities(roomType: any): string[] {
    return (
      roomType?.room_amenities
        ?.map((ra: any) => ra?.amenities?.name)
        .filter(Boolean) ?? []
    );
  }

  // =========================================================
  // ARCHIVE BOOKING SNAPSHOT
  // =========================================================
  private static async archiveBooking(booking: any) {

    const { data: existing } = await supabase
      .from("archived_bookings")
      .select("id")
      .eq("original_booking_id", booking.id)
      .maybeSingle();

    if (existing) return;

    const { error } = await supabase
      .from("archived_bookings")
      .insert({
        original_booking_id: booking.id,
        user_id: booking.user_id,
        room_id: booking.room_id,
        start_at: booking.start_at,
        end_at: booking.checked_out_at ?? booking.start_at,
        guests: booking.guests,
        status: booking.status,
        message: booking.message,
        checked_in_at: booking.checked_in_at,
        checked_out_at: booking.checked_out_at,
        price_at_booking: booking.price_at_booking,
        total_amount: booking.total_amount,
        amenities: booking.amenities ?? [],
        payments: booking.payments ?? [],
        logs: booking.logs ?? [],
        guest_fname: booking.users?.fname,
        guest_lname: booking.users?.lname,
        room_number: booking.room?.room_number,
      });

    if (error) throw error;
  }

  // =========================================================
  // 🧹 HOUSEKEEPING AUTO TRIGGER
  // =========================================================
  private static async triggerHousekeeping(roomId: number, bookingId: number) {

    // 1. get room type
    const { data: room, error: roomErr } = await supabase
      .from("rooms")
      .select("room_type_id")
      .eq("id", roomId)
      .single();

    if (roomErr || !room) return;

    // 2. get template
    const { data: template, error: tplErr } = await supabase
      .from("housekeeping_templates")
      .select("id")
      .eq("room_type_id", room.room_type_id)
      .single();

    if (tplErr || !template) return;

    // 3. create task
    const { data: task, error: taskErr } = await supabase
      .from("housekeeping_tasks")
      .insert({
        room_id: roomId,
        booking_id: bookingId,
        template_id: template.id,
        status: "pending",
      })
      .select()
      .single();

    if (taskErr || !task) return;

    // 4. copy checklist items
    const { data: items } = await supabase
      .from("housekeeping_template_items")
      .select("*")
      .eq("template_id", template.id);

    if (!items?.length) return;

    await supabase.from("housekeeping_task_items").insert(
      items.map((i) => ({
        task_id: task.id,
        item_name: i.item_name,
        quantity: i.default_quantity,
        is_done: false,
      }))
    );
  }

  // =========================================================
  // GET ALL BOOKINGS
  // =========================================================
  static async getAll() {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        user_id,
        room_id,
        start_at,
        guests,
        extra_beds,
        status,
        message,
        checked_in_at,
        checked_out_at,
        price_at_booking,
        total_amount,
        has_child,
        child_age_group,
        has_pwd,
        has_senior,
        created_at,

        users (
          id,
          fname,
          lname
        ),

        room:rooms (
          id,
          room_number,

          room_type:room_types (
            id,
            name,
            capacity,
            base_price,

            room_amenities (
              amenity_id,
              amenities (
                id,
                name
              )
            )
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((b: any) => ({
      ...b,
      amenities: this.formatAmenities(b.room?.room_type),
    }));
  }

  // =========================================================
  // GET BY ID
  // =========================================================
  static async getById(id: number) {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        users (id, fname, lname),

        room:rooms (
          id,
          room_number,

          room_type:room_types (
            id,
            name,
            capacity,
            base_price,

            room_amenities (
              amenity_id,
              amenities (
                id,
                name
              )
            )
          )
        ),

        payments (
          id,
          amount,
          status,
          method,
          paid_at
        ),

        booking_logs (
          id,
          action,
          created_at
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    return {
      ...data,
      amenities: this.formatAmenities(data?.room?.room_type),
      payments: data?.payments ?? [],
      logs: data?.booking_logs ?? [],
    };
  }

  // =========================================================
  // CREATE BOOKING
  // =========================================================
  static async create(payload: any) {
    const { data, error } = await supabase
      .from("bookings")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =========================================================
  // UPDATE STATUS (CHECK-IN / CHECK-OUT)
  // =========================================================
  static async updateStatus(id: number, status: BookingStatus) {

    const update: any = { status };

    if (status === "checked_in") {
      update.checked_in_at = new Date().toISOString();
    }

    if (status === "checked_out") {
      update.checked_out_at = new Date().toISOString();
    }

    const { data: updated, error } = await supabase
      .from("bookings")
      .update(update)
      .eq("id", id)
      .select(`
        *,
        users (id, fname, lname),
        room:rooms (id, room_number)
      `)
      .single();

    if (error) throw error;

    // =========================================================
    // 🔥 CHECKOUT FLOW AUTOMATION
    // =========================================================
    if (status === "checked_out") {

      // 1. archive booking
      await this.archiveBooking(updated);

      // 2. mark room dirty
      await supabase
        .from("rooms")
        .update({ status: "dirty" })
        .eq("id", updated.room_id);

      // 3. create housekeeping task
      await this.triggerHousekeeping(updated.room_id, updated.id);
    }

    return updated;
  }

  // =========================================================
  // AVAILABILITY CHECK
  // =========================================================
  static async checkAvailability(start: string, end: string) {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        room_id,
        status,
        start_at,
        checked_in_at,
        checked_out_at
      `)
      .neq("status", "cancelled");

    if (error) throw error;

    const targetStart = new Date(start);
    const targetEnd = new Date(end);

    return (data ?? []).filter((b) => {

      if (b.checked_out_at) return false;
      if (b.checked_in_at && !b.checked_out_at) return true;

      const bookingStart = new Date(b.start_at);

      return bookingStart <= targetEnd && bookingStart >= targetStart;
    });
  }

  // =========================================================
  // OVERLAP UTILITY
  // =========================================================
  static isOverlapping(
    bookingStart: string,
    bookingEnd: string,
    targetStart: string,
    targetEnd: string
  ) {
    return (
      new Date(bookingStart) <= new Date(targetEnd) &&
      new Date(bookingEnd) >= new Date(targetStart)
    );
  }
}