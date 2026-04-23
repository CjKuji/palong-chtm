import { BookingStatus } from "./enums.types";

/* =========================================================
  USER
========================================================= */

export interface BookingUser {
  id: string;
  fname: string;
  lname: string;
  email?: string | null;
}

/* =========================================================
  AMENITIES
========================================================= */

export interface BookingAmenity {
  id: number;
  name: string;
}

export interface BookingRoomAmenity {
  amenities?: BookingAmenity | null;
}

/* =========================================================
  ROOM TYPE
========================================================= */

export interface BookingRoomType {
  id: number;
  name: string;
  description?: string | null;
  capacity: number;
  base_price: number;

  room_amenities?: BookingRoomAmenity[];
}

/* =========================================================
  ROOM
========================================================= */

export interface BookingRoom {
  id: number;
  room_number: string;
  floor?: number | null;
  status?: string;

  room_type?: BookingRoomType | null;
}

/* =========================================================
  LOGS
========================================================= */

export interface BookingLog {
  id: number;
  action: string;
  created_at: string;
}

/* =========================================================
  PAYMENT
========================================================= */

export type PaymentMethod = "Gcash" | "Cash";

/* =========================================================
  MAIN BOOKING
========================================================= */

export interface Booking {
  id: number;

  user_id: string;
  room_id: number;

  start_at: string;
  end_at?: string | null;

  guests: number;
  extra_beds: number;

  status: BookingStatus;

  message?: string | null;

  checked_in_at?: string | null;
  checked_out_at?: string | null;

  price_at_booking: number;
  total_amount: number;

  has_child: boolean;
  has_pwd: boolean;
  has_senior: boolean;

  child_age_group?: string | null;

  payment_method?: PaymentMethod | null;

  created_at: string;

  /* 🔗 RELATIONS (Supabase joins) */
  users?: BookingUser | null;
  room?: BookingRoom | null;

  logs?: BookingLog[];
}

/* =========================================================
  SERVICE META TYPE
========================================================= */

export interface BookingWithMeta extends Booking {
  amenities: string[];

  extra_bed_fee: number;
  extra_bed_label: string;
}