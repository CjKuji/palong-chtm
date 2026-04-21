export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type UserRole =
  | "user"
  | "admin"
  | "staff";

export type ToolStatus =
  | "no_stck"
  | "low_stck"
  | "in_stck"
  | "full_stck"
  | "archived";

export type ToolCategory =
  | "kitchen"
  | "bar"
  | "baking";

export type BookingStatus =
  | "pending"
  | "approved"
  | "cancelled"
  | "checked_in"
  | "checked_out"
  | "rejected"
  | "archived";