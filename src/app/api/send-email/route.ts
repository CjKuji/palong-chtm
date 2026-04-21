import { sendBookingApprovalEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    // ✅ Parse request body safely
    const body = await req.json();
    const { email, name, booking } = body;

    // ✅ Basic validation
    if (!email || !name || !booking) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing required fields (email, name, booking)",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Optional: extra validation (recommended)
    if (typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid email format",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Send email
    await sendBookingApprovalEmail({
      email,
      name,
      booking,
    });

    // ✅ Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[EMAIL ROUTE ERROR]", err);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to send email",
        error: err?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}