import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { to, subject, message, patientName, inquiryId } = await req.json();

    if (!to || !message) {
      return NextResponse.json(
        { error: "Recipient email and message content are required." },
        { status: 400 }
      );
    }

    // SMTP Configuration from environment variables
    const host = process.env.SMTP_HOST || process.env.GMAIL_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER || process.env.GMAIL_USER || "";
    const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS || "";
    const fromName = process.env.SMTP_FROM_NAME || "Haji Murad Eye Hospital";
    const fromEmail = process.env.SMTP_FROM_EMAIL || user || "info@hajimuradhospital.org";

    // If SMTP credentials are not configured, simulate success with a friendly message
    if (!user || !pass) {
      console.warn("SMTP credentials not set in environment variables. Email response simulated.");
      return NextResponse.json({
        success: true,
        simulated: true,
        message: "Email reply logged & recorded! To enable real email delivery, configure SMTP_USER & SMTP_PASS in .env.local.",
      });
    }

    // Create Transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #0B3D5C; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">Haji Murad Eye Hospital</h2>
          <p style="color: #5EEAD4; margin: 5px 0 0 0; font-size: 13px;">Official Inquiry Response</p>
        </div>

        <div style="padding: 24px; color: #334155; line-height: 1.6;">
          <p style="font-size: 14px; font-weight: 600; color: #0B3D5C;">Dear ${patientName || "Patient"},</p>
          <div style="font-size: 14px; color: #1e293b; background-color: #f8fafc; padding: 16px; border-left: 4px solid #3E8E6E; margin: 16px 0; border-radius: 4px; whitespace-wrap: pre-line;">
            ${message.replace(/\n/g, "<br/>")}
          </div>
          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
            If you have further questions, feel free to reply to this email or contact us at our helpline.
          </p>
        </div>

        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #64748b;">
          <p style="margin: 0; font-weight: 600;">Haji Murad Eye Hospital & Research Center</p>
          <p style="margin: 4px 0 0 0;">Upper Chanab Canal Bank G.T Road Gujranwala | UAN: 111 333 456</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: subject || "Reply to your inquiry - Haji Murad Eye Hospital",
      text: message,
      html: htmlContent,
    });

    return NextResponse.json({
      success: true,
      message: `Email successfully sent to ${to}!`,
    });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email reply." },
      { status: 500 }
    );
  }
}
