import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/sendEmail";
import {
  getUserBookingReceivedEmail,
  getAdminNewBookingEmail,
  getConfirmedEmail,
  getCancelledEmail,
  getRescheduledEmail,
} from "@/lib/emailTemplates";

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, to, subject, html, message, patientName, data } = body;

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || "info@hmeht.com";

    // -------------------------------------------------------------
    // ACTION TYPE 1: BOOKING_RECEIVED (Fires 2 emails: Patient + Admin)
    // -------------------------------------------------------------
    if (type === "BOOKING_RECEIVED" || type === "NEW_BOOKING") {
      const bookingData = data || body;
      const patientEmail = bookingData.email || to;

      const results = { userEmail: null, adminEmail: null };

      // 1. Send Email A to Patient
      if (patientEmail) {
        const userTemplate = getUserBookingReceivedEmail(bookingData);
        results.userEmail = await sendEmail({
          to: patientEmail,
          subject: userTemplate.subject,
          html: userTemplate.html,
        });
      }

      // 2. Send Email B to Admin
      if (adminEmail) {
        const adminTemplate = getAdminNewBookingEmail(bookingData);
        results.adminEmail = await sendEmail({
          to: adminEmail,
          subject: adminTemplate.subject,
          html: adminTemplate.html,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Booking emails processed.",
        results,
      });
    }

    // -------------------------------------------------------------
    // ACTION TYPE 2: STATUS_CONFIRMED
    // -------------------------------------------------------------
    if (type === "STATUS_CONFIRMED") {
      const bookingData = data || body;
      const recipient = bookingData.email || to;
      if (!recipient) {
        return NextResponse.json({ error: "Missing recipient email" }, { status: 400 });
      }
      const template = getConfirmedEmail(bookingData);
      const res = await sendEmail({
        to: recipient,
        subject: template.subject,
        html: template.html,
      });
      return NextResponse.json(res);
    }

    // -------------------------------------------------------------
    // ACTION TYPE 3: STATUS_CANCELLED
    // -------------------------------------------------------------
    if (type === "STATUS_CANCELLED") {
      const bookingData = data || body;
      const recipient = bookingData.email || to;
      if (!recipient) {
        return NextResponse.json({ error: "Missing recipient email" }, { status: 400 });
      }
      const template = getCancelledEmail(bookingData);
      const res = await sendEmail({
        to: recipient,
        subject: template.subject,
        html: template.html,
      });
      return NextResponse.json(res);
    }

    // -------------------------------------------------------------
    // ACTION TYPE 4: STATUS_RESCHEDULED
    // -------------------------------------------------------------
    if (type === "STATUS_RESCHEDULED") {
      const bookingData = data || body;
      const recipient = bookingData.email || to;
      if (!recipient) {
        return NextResponse.json({ error: "Missing recipient email" }, { status: 400 });
      }
      const template = getRescheduledEmail(bookingData);
      const res = await sendEmail({
        to: recipient,
        subject: template.subject,
        html: template.html,
      });
      return NextResponse.json(res);
    }

    // -------------------------------------------------------------
    // ACTION TYPE 5: Direct Custom Email (Subject & HTML / Message)
    // -------------------------------------------------------------
    if (to && (html || message || subject)) {
      const finalHtml = html || `<p>${message}</p>`;
      const res = await sendEmail({
        to,
        subject: subject || "Notification from Haji Murad Eye Hospital",
        html: finalHtml,
      });
      return NextResponse.json(res);
    }

    return NextResponse.json(
      { error: "Invalid email request payload or missing parameters." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API /api/send-email] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process email request." },
      { status: 500 }
    );
  }
}
