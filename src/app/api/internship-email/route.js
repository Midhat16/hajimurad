import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/sendEmail";
import {
  getUserInternshipApplicationReceivedEmail,
  getAdminNewInternshipApplicationEmail,
  getUserInternshipAcceptedEmail,
  getUserInternshipRejectedEmail,
} from "@/lib/emailTemplates";

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, data } = body;
    const appData = data || body;

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || "info@hmeht.com";
    const candidateEmail = appData.email;

    // -------------------------------------------------------------
    // ACTION TYPE 1: INTERNSHIP_APPLICATION_RECEIVED
    // (Fires 2 emails: Candidate confirmation + Admin alert)
    // -------------------------------------------------------------
    if (type === "INTERNSHIP_APPLICATION_RECEIVED") {
      const results = { userEmail: null, adminEmail: null };

      // 1. Candidate confirmation email
      if (candidateEmail) {
        const userTemplate = getUserInternshipApplicationReceivedEmail(appData);
        results.userEmail = await sendEmail({
          to: candidateEmail,
          subject: userTemplate.subject,
          html: userTemplate.html,
        });
      }

      // 2. Admin alert email
      if (adminEmail) {
        const adminTemplate = getAdminNewInternshipApplicationEmail(appData);
        results.adminEmail = await sendEmail({
          to: adminEmail,
          subject: adminTemplate.subject,
          html: adminTemplate.html,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Internship application emails sent successfully.",
        results,
      });
    }

    // -------------------------------------------------------------
    // ACTION TYPE 2: INTERNSHIP_ACCEPTED
    // -------------------------------------------------------------
    if (type === "INTERNSHIP_ACCEPTED") {
      if (!candidateEmail) {
        return NextResponse.json({ error: "Candidate email is missing" }, { status: 400 });
      }

      const template = getUserInternshipAcceptedEmail(appData);
      const res = await sendEmail({
        to: candidateEmail,
        subject: template.subject,
        html: template.html,
      });

      return NextResponse.json({
        success: true,
        message: "Acceptance email sent to candidate.",
        result: res,
      });
    }

    // -------------------------------------------------------------
    // ACTION TYPE 3: INTERNSHIP_REJECTED
    // -------------------------------------------------------------
    if (type === "INTERNSHIP_REJECTED") {
      if (!candidateEmail) {
        return NextResponse.json({ error: "Candidate email is missing" }, { status: 400 });
      }

      const template = getUserInternshipRejectedEmail(appData);
      const res = await sendEmail({
        to: candidateEmail,
        subject: template.subject,
        html: template.html,
      });

      return NextResponse.json({
        success: true,
        message: "Rejection / regret email sent to candidate.",
        result: res,
      });
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (error) {
    console.error("[api/internship-email] Error handling internship email route:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
