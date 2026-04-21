// app/types.ts

// ----------------------
// USER
// ----------------------
export interface User {
  id: string;
  fname: string;
  lname: string;
  role: string;
  email?: string | null;
}

// ----------------------
// AMENITIES
// ----------------------
export interface Amenity {
  id: number;
  name: string;
  price: number;
}

// ----------------------
// ROOM TYPES
// ----------------------
export interface RoomType {
  id: number;
  name: string;
  description?: string | null;
  capacity: number;
  base_price: number;
  created_at?: string;
}

// ----------------------
// ROOM
// ----------------------
export interface Room {
  id: number;
  room_number: string;
  floor?: number;
  cleanup_start: string; // 'HH:MM:SS'
  cleanup_end: string;   // 'HH:MM:SS'
  room_type: RoomType;
}

// ----------------------
// BOOKING AMENITY JOIN
// ----------------------
export interface BookingAmenity {
  amenity_id: number;
  amenities: Amenity;
}

// ----------------------
// BOOKING STATUS (DB enum only)
// ----------------------
export type BookingStatus = 'pending' | 'accepted' | 'rejected';

// ----------------------
// BOOKING
// ----------------------
export interface Booking {
  id: number;
  user_id: string;
  user?: User;
  room: Room;
  start_at: string;
  end_at: string;
  guests: number;
  status: BookingStatus;
  message?: string | null;
  early_checkin_at?: string | null;
  early_checkout_at?: string | null;
  price_at_booking: number;
  total_amount: number;
  amenities: Amenity[];
}

// ----------------------
// BOOKING LOGS
// ----------------------
export interface BookingLog {
  id: number;
  booking_id: number;
  action: string;
  performed_by?: string | null; // user id (admin)
  created_at: string;
}

// ----------------------
// CLEANUP SCHEDULE (Optional helper type)
// ----------------------
export interface RoomCleanup {
  id?: number;           // for DB ID
  room_id: number;
  cleanup_start: string; // 'HH:MM:SS'
  cleanup_end: string;   // 'HH:MM:SS'
}