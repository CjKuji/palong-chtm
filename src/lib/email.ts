import nodemailer from "nodemailer";

interface BookingEmailPayload {
  email: string;
  name: string;
  booking: any;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendBookingApprovalEmail({
  email,
  name,
  booking,
}: BookingEmailPayload) {
  try {
    const info = await transporter.sendMail({
      from: `"Hotel System" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your Booking is Confirmed 🎉",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Hi ${name},</h2>
          <p>Your booking has been <strong>approved</strong>.</p>

          <ul>
            <li>Room: ${booking.room?.room_number ?? "N/A"}</li>
            <li>Check-in: ${booking.start_at}</li>
            <li>Guests: ${booking.guests}</li>
          </ul>

          <p>We look forward to your stay! 🏨</p>
        </div>
      `,
    });

    return info;
  } catch (err) {
    console.error("[EMAIL ERROR]", err);
    throw err;
  }
}