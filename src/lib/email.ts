import nodemailer from "nodemailer";

/* =========================================================
  TRANSPORTER
========================================================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/* =========================================================
  HELPERS
========================================================= */

const formatDateTime = (date?: string) => {
  if (!date) return "N/A";

  const d = new Date(date);

  const datePart = new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    timeZone: "Asia/Manila",
  }).format(d);

  const timePart = new Intl.DateTimeFormat("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  }).format(d);

  return `${datePart} • ${timePart}`;
};

const money = (value?: number) =>
  value == null ? "N/A" : `₱${Number(value).toLocaleString()}`;

/* =========================================================
  TYPES
========================================================= */

interface BookingEmailPayload {
  email: string;
  name: string;
  booking: any; // Supabase joined booking object
}

/* =========================================================
  EMAIL SENDER
========================================================= */

export async function sendBookingApprovalEmail({
  email,
  name,
  booking,
}: BookingEmailPayload) {
  try {
    /* =====================================================
      CLEAN EXTRACTION (BASED ON YOUR SCHEMA)
    ===================================================== */

    const roomType =
      booking?.room?.room_type?.name || "Room";

    const roomNumber =
      booking?.room?.room_number || "N/A";

    const checkIn = formatDateTime(booking?.start_at);
    const checkOut = formatDateTime(booking?.end_at);

    const guests = booking?.guests ?? "N/A";
    const total = money(booking?.total_amount);

    const extraBeds =
      booking?.extra_beds === 1
        ? "1 Extra Bed"
        : booking?.extra_beds === 2
        ? "2 Extra Beds"
        : "No Extra Bed";

    const status = (booking?.status ?? "updated").toUpperCase();

    const statusColor =
      booking?.status === "approved"
        ? "#16a34a"
        : booking?.status === "rejected"
        ? "#dc2626"
        : "#2563eb";

    /* =====================================================
      SEND EMAIL
    ===================================================== */

    const info = await transporter.sendMail({
      from: `"Hotel Reservations" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Booking ${status} • ${roomType} 🏨`,

      html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 620px;
        margin: auto;
        padding: 24px;
        color: #333;
      ">

        <h2 style="margin-bottom: 6px;">
          Hello ${name},
        </h2>

        <p style="font-size: 15px;">
          Your booking has been
          <strong style="color: ${statusColor};">
            ${status}
          </strong>.
        </p>

        <div style="
          margin-top: 16px;
          background: #f6f7f9;
          padding: 16px;
          border-radius: 10px;
        ">

          <h3 style="margin-top: 0;">Reservation Details</h3>

          <p><strong>Room Type:</strong> ${roomType}</p>
          <p><strong>Room Number:</strong> ${roomNumber}</p>

          <hr style="margin: 10px 0;" />

          <p><strong>Check-in:</strong> ${checkIn}</p>
          <p><strong>Guests:</strong> ${guests}</p>
          <p><strong>Extra Bed:</strong> ${extraBeds}</p>
          <p><strong>Total Amount:</strong> ${total}</p>

        </div>

        <p style="margin-top: 18px; font-size: 14px; line-height: 1.6;">
          We are looking forward to welcoming you.
          If you need assistance, our front desk is available 24/7.
        </p>

        <p style="margin-top: 28px; font-size: 13px; color: #777;">
          — Hotel Management
        </p>

      </div>
      `,
    });

    return info;
  } catch (err) {
    console.error("[BOOKING EMAIL ERROR]", err);
    throw err;
  }
}