import { BookingStatus } from "./enums.types";

/**
 * =========================
 * BOOKING TYPE (SCHEMA-ALIGNED)
 * =========================
 */
export interface Booking {

  // =========================================================
  // CORE
  // =========================================================
  id: number;

  user_id: string;
  room_id: number;

  start_at: string;

  guests: number;
  extra_beds: number;

  status: BookingStatus;

  message?: string | null;

  checked_in_at?: string | null;
  checked_out_at?: string | null;

  price_at_booking: number;
  total_amount: number;

  has_child: boolean;
  child_age_group?: string | null;

  has_pwd: boolean;
  has_senior: boolean;

  created_at: string;

  // =========================================================
  // RELATIONS (FIXED BASED ON YOUR SCHEMA)
  // =========================================================

  users?: {
    id: string;
    fname: string;
    lname: string;
  };

  room?: {
    id: number;
    room_number: string;

    room_type?: {
      id: number;
      name: string;
      capacity: number;
      base_price: number;

      room_amenities?: {
        amenities?: {
          id: number;
          name: string;
        };
      }[];
    };
  };

  // =========================================================
  // DERIVED (FROM SERVICE MAPPING)
  // =========================================================

  /**
   * Flattened amenities list (already processed in service)
   */
  amenities?: string[];

  payments?: {
    id: number;
    amount: number;
    status: string;
    method: string;
    paid_at: string | null;
  }[];

  logs?: {
    id: number;
    action: string;
    created_at: string;
  }[];
}