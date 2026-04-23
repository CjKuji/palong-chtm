import { supabase } from "@/lib/supabase";
import { BookingStatus } from "@/types/enums.types";
import { BookingWithMeta } from "@/types/booking.types";

/* =========================================================
  BOOKING SERVICE (FINAL SNAPSHOT-SAFE VERSION)
========================================================= */

export class BookingService {

  /* =========================================================
    DEBUG
  ========================================================= */
  private static debug(label: string, data?: any) {
    console.log(`[BookingService:${label}]`, data ?? "");
  }

  /* =========================================================
    PRICING
  ========================================================= */
  private static EXTRA_BED_PRICE: Record<number, number> = {
    0: 0,
    1: 700,
    2: 1400,
  };

  static getExtraBedFee(extraBeds: number) {
    return this.EXTRA_BED_PRICE[extraBeds] ?? 0;
  }

  static getExtraBedLabel(extraBeds: number) {
    if (extraBeds === 1) return "1 Extra Bed";
    if (extraBeds === 2) return "2 Extra Beds";
    return "No Extra Bed";
  }

  /* =========================================================
    AMENITIES
  ========================================================= */
  private static formatAmenities(roomType: any): string[] {
    return (
      roomType?.room_amenities
        ?.map((ra: any) => ra?.amenities?.name)
        .filter(Boolean) ?? []
    );
  }

  /* =========================================================
    GET ALL BOOKINGS
  ========================================================= */
  static async getAll(): Promise<BookingWithMeta[]> {
    this.debug("getAll:start");

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        user_id,
        room_id,
        start_at,
        end_at,
        guests,
        extra_beds,
        price_at_booking,
        total_amount,
        message,
        status,
        payment_method,
        created_at,
        checked_in_at,
        checked_out_at,

        users!fk_bookings_user (
          id,
          fname,
          lname,
          email
        ),

        rooms (
          id,
          room_number,
          floor,
          status,
          room_type_id,

          room_types (
            id,
            name,
            description,
            capacity,
            base_price,
            room_amenities (
              amenities (id, name)
            )
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      this.debug("getAll:error", error);
      throw error;
    }

    return (data ?? []).map((b) => this.mapBooking(b));
  }

  /* =========================================================
    GET BY ID
  ========================================================= */
  static async getById(id: number): Promise<BookingWithMeta> {
    this.debug("getById", id);

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        users!fk_bookings_user (
          id,
          fname,
          lname,
          email
        ),
        rooms (
          id,
          room_number,
          floor,
          status,
          room_type_id,

          room_types (
            id,
            name,
            description,
            capacity,
            base_price,
            room_amenities (
              amenities (id, name)
            )
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      this.debug("getById:error", error);
      throw error;
    }

    return this.mapBooking(data);
  }

  /* =========================================================
    STATUS UPDATE
  ========================================================= */
  static async updateStatus(
    id: number,
    status: BookingStatus,
    actorId?: string
  ) {
    const now = new Date().toISOString();

    const update: any = { status };

    if (status === "approved") update.approved_by = actorId ?? null;
    if (status === "rejected") update.rejected_by = actorId ?? null;

    if (status === "checked_in") {
      update.checked_in_by = actorId ?? null;
      update.checked_in_at = now;
    }

    if (status === "checked_out") {
      update.checked_out_by = actorId ?? null;
      update.checked_out_at = now;
    }

    const { data, error } = await supabase
      .from("bookings")
      .update(update)
      .eq("id", id)
      .select(`
        *,
        users!fk_bookings_user (
          id,
          fname,
          lname,
          email
        ),
        rooms (
          id,
          room_number,
          floor,
          status,
          room_type_id,

          room_types (
            id,
            name,
            description,
            capacity,
            base_price
          )
        )
      `)
      .single();

    if (error) {
      this.debug("updateStatus:error", error);
      throw error;
    }

    /* =========================================================
      SAFE ARCHIVE FLOW (CRITICAL FIX)
      ALWAYS REFRESH BEFORE ARCHIVING
    ========================================================= */
    if (status === "checked_out") {
      await this.generateHousekeepingFromTemplate(data, actorId);

      const { data: freshBooking } = await supabase
  .from("bookings")
  .select(`
    *,
    payment_method,
    start_at,
    end_at,
    guests,
    message,
    status,
    total_amount,
    extra_beds,
    has_child,
    has_pwd,
    has_senior,
    child_age_group,

    checked_in_at,
    checked_out_at,

    users (id, fname, lname, email),

    approved_by,
    rejected_by,
    checked_in_by,
    checked_out_by,

    rooms (
      id,
      room_number,
      floor,
      room_type_id,
      room_types (
        id,
        name,
        capacity,
        base_price
      )
    )
  `)
  .eq("id", data.id)
  .single();

      await this.archiveBooking(freshBooking);
    }

    return this.mapBooking(data);
  }

  /* =========================================================
    HOUSEKEEPING ENGINE
  ========================================================= */
  private static async generateHousekeepingFromTemplate(
    booking: any,
    actorId?: string
  ) {
    if (!booking?.room_id) return;

    const { data: room } = await supabase
      .from("rooms")
      .select("room_type_id")
      .eq("id", booking.room_id)
      .single();

    if (!room) return;

    const { data: template } = await supabase
      .from("housekeeping_templates")
      .select("id")
      .eq("room_type_id", room.room_type_id)
      .single();

    if (!template) return;

    const { data: task } = await supabase
      .from("housekeeping_tasks")
      .insert({
        room_id: booking.room_id,
        booking_id: booking.id,
        template_id: template.id,
        status: "pending",
      })
      .select()
      .single();

    if (!task) return;

    const { data: items } = await supabase
      .from("housekeeping_template_items")
      .select("*")
      .eq("template_id", template.id);

    if (!items) return;

    await supabase.from("housekeeping_task_items").insert(
      items.map((i) => ({
        task_id: task.id,
        item_name: i.item_name,
        quantity: i.default_quantity,
        is_done: false,
      }))
    );

    await supabase
      .from("rooms")
      .update({ status: "dirty" })
      .eq("id", booking.room_id);
  }

  /* =========================================================
    ARCHIVE BOOKING (FINAL SNAPSHOT SAFE)
  ========================================================= */
  private static async archiveBooking(booking: any) {
  if (!booking) return;

  const room = booking?.rooms;
  const roomType = room?.room_types;

  const payload = {
    original_booking_id: booking.id,
    user_id: booking.user_id,
    room_id: booking.room_id,

    room_number: room?.room_number ?? null,
    room_type_name: roomType?.name ?? null,
    room_type_id: roomType?.id ?? null,
    room_capacity: roomType?.capacity ?? null,
    room_base_price: roomType?.base_price ?? null,
    room_floor: room?.floor ?? null,

    start_at: booking.start_at ?? null,
    end_at: booking.end_at ?? null,

    checked_in_at: booking.checked_in_at ?? null,
    checked_out_at: booking.checked_out_at ?? null,

    guests: booking.guests ?? 0,
    status: booking.status ?? "unknown",
    message: booking.message ?? null,

    payment_method: booking.payment_method ?? "unknown",

    total_amount: booking.total_amount ?? 0,
    extra_beds: booking.extra_beds ?? 0,

    has_child: booking.has_child ?? false,
    has_pwd: booking.has_pwd ?? false,
    has_senior: booking.has_senior ?? false,
    child_age_group: booking.child_age_group ?? null,

    guest_fname: booking.users?.fname ?? null,
    guest_lname: booking.users?.lname ?? null,

    approved_by: booking.approved_by ?? null,
    rejected_by: booking.rejected_by ?? null,
    checked_in_by: booking.checked_in_by ?? null,
    checked_out_by: booking.checked_out_by ?? null,
  };

  const { error } = await supabase
    .from("archived_bookings")
    .insert(payload);

  if (error) {
    console.error("[ARCHIVE ERROR]", error);
  }
}
  /* =========================================================
    MAPPER (FINAL UI SAFE)
  ========================================================= */
  private static mapBooking(b: any): BookingWithMeta {
    const room = b?.rooms ?? null;
    const roomType = room?.room_types ?? null;

    return {
      ...b,

      room: room
        ? {
            id: room.id,
            room_number: room.room_number,
            floor: room.floor,
            status: room.status,
            room_type: roomType,
          }
        : null,

      users: b?.users ?? null,

      room_type_name: roomType?.name ?? "Unknown Type",

      amenities: this.formatAmenities(roomType),

      extra_bed_fee: this.getExtraBedFee(b?.extra_beds ?? 0),
      extra_bed_label: this.getExtraBedLabel(b?.extra_beds ?? 0),
    };
  }
}