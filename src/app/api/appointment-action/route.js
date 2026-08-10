import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendEmail } from "@/lib/sendEmail";
import { getConfirmedEmail, getCancelledEmail } from "@/lib/emailTemplates";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const action = searchParams.get("action");
  const token = searchParams.get("token");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl?.origin || "https://hmeht.com";

  if (!id || !action) {
    return NextResponse.redirect(`${baseUrl}/admin/action-success?error=missing_params`);
  }

  try {
    // 1. Fetch appointment from Firestore
    const apptRef = doc(db, "appointments", id);
    const apptSnap = await getDoc(apptRef);

    if (!apptSnap.exists()) {
      return NextResponse.redirect(`${baseUrl}/admin/action-success?error=not_found`);
    }

    const apptData = { id: apptSnap.id, ...apptSnap.data() };

    // 2. Validate actionToken (security verification)
    if (apptData.actionToken && token && apptData.actionToken !== token) {
      console.warn(`[AppointmentAction API] Invalid token attempt for appointment ${id}`);
      return NextResponse.redirect(`${baseUrl}/admin/action-success?error=invalid_token`);
    }

    // 3. Action: Reschedule -> Redirect to Admin Panel Scheduler
    if (action === "reschedule") {
      return NextResponse.redirect(`${baseUrl}/admin/appointments?rescheduleId=${id}`);
    }

    // 4. Action: Confirm
    if (action === "confirm") {
      await updateDoc(apptRef, {
        status: "confirmed",
        is_read: true,
        read: true,
        confirmedAt: new Date().toISOString(),
      });

      // Send Confirmed Email to Patient
      if (apptData.email) {
        const emailContent = getConfirmedEmail(apptData);
        await sendEmail({
          to: apptData.email,
          subject: emailContent.subject,
          html: emailContent.html,
        }).catch((err) => console.warn("[AppointmentAction API] Patient confirm email error:", err));
      }

      const patientName = apptData.name || apptData.patientName || "Patient";
      return NextResponse.redirect(
        `${baseUrl}/admin/action-success?status=confirmed&name=${encodeURIComponent(patientName)}&id=${encodeURIComponent(apptData.appointmentId || id)}`
      );
    }

    // 5. Action: Cancel
    if (action === "cancel") {
      await updateDoc(apptRef, {
        status: "cancelled",
        is_read: true,
        read: true,
        cancelledAt: new Date().toISOString(),
      });

      // Send Cancelled Email to Patient
      if (apptData.email) {
        const emailContent = getCancelledEmail(apptData);
        await sendEmail({
          to: apptData.email,
          subject: emailContent.subject,
          html: emailContent.html,
        }).catch((err) => console.warn("[AppointmentAction API] Patient cancel email error:", err));
      }

      const patientName = apptData.name || apptData.patientName || "Patient";
      return NextResponse.redirect(
        `${baseUrl}/admin/action-success?status=cancelled&name=${encodeURIComponent(patientName)}&id=${encodeURIComponent(apptData.appointmentId || id)}`
      );
    }

    return NextResponse.redirect(`${baseUrl}/admin/action-success?error=unknown_action`);
  } catch (error) {
    console.error("[AppointmentAction API] Error processing email action:", error);
    return NextResponse.redirect(`${baseUrl}/admin/action-success?error=${encodeURIComponent(error.message)}`);
  }
}
