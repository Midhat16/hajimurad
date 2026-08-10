/**
 * Production-ready HTML Email Templates for Haji Murad Eye Hospital Trust.
 * Standardized with inline CSS and table-based layouts for cross-client email compatibility (Gmail, Outlook, Apple Mail).
 */

const HOSPITAL_BRAND_HEADER = `
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #8C6CFF 0%, #C4232C 100%); border-radius: 16px 16px 0 0;">
    <tr>
      <td align="center" style="padding: 28px 20px;">
        <h1 style="color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; font-size: 22px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
          HAJI MURAD TRUST EYE HOSPITAL
        </h1>
        <p style="color: rgba(255,255,255,0.85); font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; margin: 4px 0 0 0; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
          Excellence in Ophthalmic Care
        </p>
      </td>
    </tr>
  </table>
`;

const HOSPITAL_FOOTER = `
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-radius: 0 0 16px 16px; border-top: 1px solid #E2E8F0;">
    <tr>
      <td align="center" style="padding: 20px; font-family: 'Segoe UI', Arial, sans-serif;">
        <p style="color: #475569; font-size: 12px; font-weight: 700; margin: 0 0 6px 0;">
          Haji Murad Trust Eye Hospital & Laser Center
        </p>
        <p style="color: #64748B; font-size: 11px; margin: 0 0 10px 0;">
          Helpline: +92 300 0000000 | Email: info@hmeht.com
        </p>
        <p style="margin: 0;">
          <a href="https://hmeht.com/" target="_blank" style="color: #8C6CFF; font-size: 12px; font-weight: 700; text-decoration: none;">
            Visit Official Website (hmeht.com) &rarr;
          </a>
        </p>
        <p style="color: #94A3B8; font-size: 10px; margin: 12px 0 0 0;">
          &copy; ${new Date().getFullYear()} Haji Murad Trust Eye Hospital. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
`;

// Helper for detail rows in tables
function renderDetailRow(label, value, bg = "#FFFFFF") {
  return `
    <tr style="background-color: ${bg};">
      <td width="35%" style="padding: 10px 14px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #475569; border-bottom: 1px solid #E2E8F0;">
        ${label}
      </td>
      <td width="65%" style="padding: 10px 14px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #0F172A; border-bottom: 1px solid #E2E8F0;">
        ${value || 'N/A'}
      </td>
    </tr>
  `;
}

/**
 * 1. Email A — To Patient (Booking Received Notice)
 */
export function getUserBookingReceivedEmail(data) {
  const patientName = data.patientName || data.name || "Valued Patient";
  const refId = data.id || data.appointmentId || "N/A";
  const service = data.service || "Ophthalmic Consultation";
  const doctor = data.doctorName || data.doctor || "Assigned Specialist";
  const dateStr = data.date || "Requested Date";
  const timeStr = data.time || "Requested Time";
  const branch = data.branch || data.location || "Main Hospital Center";

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #F1F5F9; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
        <tr><td>${HOSPITAL_BRAND_HEADER}</td></tr>
        <tr>
          <td style="padding: 28px 24px; font-family: 'Segoe UI', Arial, sans-serif;">
            <h2 style="color: #0F172A; font-size: 18px; font-weight: 800; margin: 0 0 12px 0;">
              Your Appointment Request Received
            </h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear <strong>${patientName}</strong>,<br/>
              Thank you for booking with us. Your appointment request has been received and our medical coordination team will contact you shortly to confirm your slot.
            </p>

            <!-- Details Card -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #CBD5E1; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
              <tr style="background-color: #8C6CFF;">
                <td colspan="2" style="padding: 10px 14px; color: #FFFFFF; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                  Appointment Summary
                </td>
              </tr>
              ${renderDetailRow("Reference ID", `<span style="color: #8C6CFF; font-family: monospace;">#${refId}</span>`, "#F8FAFC")}
              ${renderDetailRow("Service", service, "#FFFFFF")}
              ${renderDetailRow("Doctor / Specialist", doctor, "#F8FAFC")}
              ${renderDetailRow("Requested Date", dateStr, "#FFFFFF")}
              ${renderDetailRow("Requested Time", timeStr, "#F8FAFC")}
              ${renderDetailRow("Branch / Location", branch, "#FFFFFF")}
            </table>

            <!-- Notice Box -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 10px; margin-bottom: 20px;">
              <tr>
                <td style="padding: 14px; color: #92400E; font-size: 13px; font-weight: 700; line-height: 1.5;">
                  🔔 <strong>Note:</strong> Our representative will contact you via phone or WhatsApp within 24 hours to confirm your final booking slot.
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td>${HOSPITAL_FOOTER}</td></tr>
      </table>
    </body>
    </html>
  `;

  return {
    subject: "Your Appointment Request Has Been Received – Haji Murad Eye Hospital Trust",
    html,
  };
}

/**
 * 2. Email B — To Admin (New Appointment Notification)
 */
export function getAdminNewBookingEmail(data) {
  const patientName = data.patientName || data.name || "Patient";
  const refId = data.id || data.appointmentId || "N/A";
  const service = data.service || "General Eye Service";

  const isForSomeoneElse = data.isForSomeoneElse || false;
  const guardianInfo = isForSomeoneElse
    ? `${data.guardianName || 'N/A'} (${data.guardianRelation || 'Relative'})`
    : "Self";

  const selectedFeatures = Array.isArray(data.selectedFeatures) && data.selectedFeatures.length > 0
    ? data.selectedFeatures.join(", ")
    : "None / Standard Procedure";

  const appointmentId = data.firestoreId || data.id || data.appointmentId || "";
  const actionToken = data.actionToken || data.token || "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hmeht.com";

  const confirmUrl = `${baseUrl}/api/appointment-action?id=${appointmentId}&action=confirm&token=${actionToken}`;
  const cancelUrl = `${baseUrl}/api/appointment-action?id=${appointmentId}&action=cancel&token=${actionToken}`;
  const rescheduleUrl = `${baseUrl}/api/appointment-action?id=${appointmentId}&action=reschedule&token=${actionToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #0F172A; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
        <tr>
          <td align="center" style="padding: 24px 20px; background-color: #1E1B4B; border-radius: 16px 16px 0 0;">
            <h1 style="color: #F59E0B; font-family: 'Segoe UI', Arial, sans-serif; font-size: 20px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
              🚨 NEW APPOINTMENT REQUEST
            </h1>
            <p style="color: #E2E8F0; font-size: 12px; margin: 4px 0 0 0; font-weight: 600;">
              Haji Murad Trust Eye Hospital Admin System
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 24px;">
            <p style="color: #0F172A; font-size: 14px; font-weight: 700; margin: 0 0 16px 0;">
              A new appointment request has been submitted online. Details are as follows:
            </p>

            <!-- Patient Info Card -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #CBD5E1; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
              <tr style="background-color: #475569;">
                <td colspan="2" style="padding: 8px 14px; color: #FFFFFF; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                  1. Patient Personal Info
                </td>
              </tr>
              ${renderDetailRow("Reference ID", `<span style="color: #8C6CFF; font-family: monospace;">#${refId}</span>`, "#F8FAFC")}
              ${renderDetailRow("Patient Name", patientName, "#FFFFFF")}
              ${renderDetailRow("Age & Gender", `${data.age || 'N/A'} yrs / ${data.gender || 'N/A'}`, "#F8FAFC")}
              ${renderDetailRow("CNIC / ID", data.cnic || "N/A", "#FFFFFF")}
              ${renderDetailRow("Contact Phone", data.phone || data.contactNumber || "N/A", "#F8FAFC")}
              ${renderDetailRow("Email Address", data.email || "N/A", "#FFFFFF")}
              ${renderDetailRow("Address", data.address || "N/A", "#F8FAFC")}
              ${renderDetailRow("Booking For", isForSomeoneElse ? "Someone Else" : "Self", "#FFFFFF")}
              ${renderDetailRow("Guardian Details", guardianInfo, "#F8FAFC")}
            </table>

            <!-- Appointment Details Card -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #CBD5E1; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
              <tr style="background-color: #475569;">
                <td colspan="2" style="padding: 8px 14px; color: #FFFFFF; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                  2. Booking Request Details
                </td>
              </tr>
              ${renderDetailRow("Service Category", service, "#F8FAFC")}
              ${renderDetailRow("Assigned Doctor", data.doctorName || data.doctor || "N/A", "#FFFFFF")}
              ${renderDetailRow("Requested Date", data.date || "N/A", "#F8FAFC")}
              ${renderDetailRow("Requested Time", data.time || "N/A", "#FFFFFF")}
              ${renderDetailRow("Branch Location", data.branch || data.location || "Main Hospital", "#F8FAFC")}
              ${renderDetailRow("Selected Procedures", selectedFeatures, "#FFFFFF")}
            </table>

            <!-- Admin Direct Action Buttons Box -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 12px; padding: 18px; margin-top: 20px;">
              <tr>
                <td align="center" style="font-family: 'Segoe UI', Arial, sans-serif;">
                  <p style="color: #0F172A; font-size: 13px; font-weight: 800; margin: 0 0 14px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                    ⚡ Direct Admin Actions (One-Click)
                  </p>
                  <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                    <tr>
                      <!-- Confirm Button -->
                      <td align="center" style="padding: 0 5px;">
                        <a href="${confirmUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 800; text-decoration: none; padding: 11px 18px; border-radius: 8px; border: 1px solid #047857;">
                          ✅ Confirm
                        </a>
                      </td>
                      <!-- Cancel Button -->
                      <td align="center" style="padding: 0 5px;">
                        <a href="${cancelUrl}" target="_blank" style="display: inline-block; background-color: #DC2626; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 800; text-decoration: none; padding: 11px 18px; border-radius: 8px; border: 1px solid #B91C1C;">
                          ❌ Cancel
                        </a>
                      </td>
                      <!-- Reschedule Button -->
                      <td align="center" style="padding: 0 5px;">
                        <a href="${rescheduleUrl}" target="_blank" style="display: inline-block; background-color: #D97706; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 800; text-decoration: none; padding: 11px 18px; border-radius: 8px; border: 1px solid #B45309;">
                          📅 Reschedule
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #64748B; font-size: 11px; margin: 12px 0 0 0; font-weight: 600;">
                    Clicking Confirm or Cancel will update appointment status & send instant WhatsApp + Email notifications to the patient.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td>${HOSPITAL_FOOTER}</td></tr>
      </table>
    </body>
    </html>
  `;

  return {
    subject: `New Appointment Request – ${patientName} – ${service}`,
    html,
  };
}

/**
 * 3. Email — Status: CONFIRMED
 */
export function getConfirmedEmail(data) {
  const patientName = data.patientName || data.name || "Valued Patient";
  const refId = data.id || data.appointmentId || "N/A";
  const service = data.service || "Ophthalmic Procedure";
  const doctor = data.doctorName || data.doctor || "Consultant Specialist";
  const dateStr = data.date || "Confirmed Date";
  const timeStr = data.time || "Confirmed Time";
  const branch = data.branch || data.location || "Main Hospital Center";

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #F1F5F9; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
        <tr>
          <td align="center" style="padding: 24px 20px; background: linear-gradient(135deg, #059669 0%, #8C6CFF 100%); border-radius: 16px 16px 0 0;">
            <h1 style="color: #FFFFFF; font-size: 20px; font-weight: 800; margin: 0; text-transform: uppercase;">
              APPOINTMENT CONFIRMED ✅
            </h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 12px; margin: 4px 0 0 0; font-weight: 700;">
              Haji Murad Trust Eye Hospital
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 28px 24px;">
            <p style="color: #0F172A; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear <strong>${patientName}</strong>,<br/>
              Great news! Your appointment has been officially <strong>CONFIRMED</strong> by our medical team.
            </p>

            <!-- Confirmed Details -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #10B981; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
              <tr style="background-color: #059669;">
                <td colspan="2" style="padding: 10px 14px; color: #FFFFFF; font-size: 12px; font-weight: 800; text-transform: uppercase;">
                  Confirmed Appointment Details
                </td>
              </tr>
              ${renderDetailRow("Reference ID", `<span style="color: #059669; font-family: monospace;">#${refId}</span>`, "#ECFDF5")}
              ${renderDetailRow("Service", service, "#FFFFFF")}
              ${renderDetailRow("Doctor / Specialist", doctor, "#ECFDF5")}
              ${renderDetailRow("Confirmed Date", dateStr, "#FFFFFF")}
              ${renderDetailRow("Confirmed Time", timeStr, "#ECFDF5")}
              ${renderDetailRow("Branch / Location", branch, "#FFFFFF")}
            </table>

            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px;">
              <tr>
                <td style="padding: 14px; color: #065F46; font-size: 13px; font-weight: 700; line-height: 1.5;">
                  📌 <strong>Important Reminder:</strong> Please arrive 15 minutes before your scheduled appointment time. Bring your original CNIC/ID and previous eye medical reports if available.
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td>${HOSPITAL_FOOTER}</td></tr>
      </table>
    </body>
    </html>
  `;

  return {
    subject: "Your Appointment is Confirmed ✅ – Haji Murad Eye Hospital Trust",
    html,
  };
}

/**
 * 4. Email — Status: CANCELLED
 */
export function getCancelledEmail(data) {
  const patientName = data.patientName || data.name || "Valued Patient";
  const refId = data.id || data.appointmentId || "N/A";
  const service = data.service || "Ophthalmic Procedure";
  const cancelReason = data.cancelReason || "Medical schedule adjustment or doctor unavailability.";

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #F1F5F9; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
        <tr>
          <td align="center" style="padding: 24px 20px; background: linear-gradient(135deg, #DC2626 0%, #475569 100%); border-radius: 16px 16px 0 0;">
            <h1 style="color: #FFFFFF; font-size: 20px; font-weight: 800; margin: 0; text-transform: uppercase;">
              APPOINTMENT CANCELLED
            </h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 12px; margin: 4px 0 0 0; font-weight: 700;">
              Haji Murad Trust Eye Hospital
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 28px 24px;">
            <p style="color: #0F172A; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear <strong>${patientName}</strong>,<br/>
              We regret to inform you that your appointment (Reference <strong>#${refId}</strong> for <strong>${service}</strong>) has been <strong>CANCELLED</strong>.
            </p>

            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 10px; margin-bottom: 20px;">
              <tr>
                <td style="padding: 14px; color: #991B1B; font-size: 13px; font-weight: 700; line-height: 1.5;">
                  ⚠️ <strong>Reason for Cancellation:</strong> ${cancelReason}
                </td>
              </tr>
            </table>

            <p style="color: #334155; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0;">
              You can easily rebook a new date and time at your convenience directly from our website.
            </p>

            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center">
                  <a href="https://hmeht.com/#appointment" target="_blank" style="display: inline-block; background-color: #8C6CFF; color: #FFFFFF; padding: 12px 24px; font-size: 13px; font-weight: 800; border-radius: 10px; text-decoration: none;">
                    Rebook New Appointment &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td>${HOSPITAL_FOOTER}</td></tr>
      </table>
    </body>
    </html>
  `;

  return {
    subject: "Your Appointment Has Been Cancelled – Haji Murad Eye Hospital Trust",
    html,
  };
}

/**
 * 5. Email — Status: RESCHEDULED
 */
export function getRescheduledEmail(data) {
  const patientName = data.patientName || data.name || "Valued Patient";
  const refId = data.id || data.appointmentId || "N/A";
  const service = data.service || "Ophthalmic Service";
  const doctor = data.doctorName || data.doctor || "Assigned Specialist";
  
  const oldDate = data.oldDate || data.previousDate || "Previous Date";
  const oldTime = data.oldTime || data.previousTime || "Previous Time";
  const newDate = data.date || data.newDate || "New Date";
  const newTime = data.time || data.newTime || "New Time";
  const branch = data.branch || data.location || "Main Hospital";

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #F1F5F9; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
        <tr>
          <td align="center" style="padding: 24px 20px; background: linear-gradient(135deg, #D97706 0%, #8C6CFF 100%); border-radius: 16px 16px 0 0;">
            <h1 style="color: #FFFFFF; font-size: 20px; font-weight: 800; margin: 0; text-transform: uppercase;">
              APPOINTMENT RESCHEDULED 📅
            </h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 12px; margin: 4px 0 0 0; font-weight: 700;">
              Haji Murad Trust Eye Hospital
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 28px 24px;">
            <p style="color: #0F172A; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear <strong>${patientName}</strong>,<br/>
              Please note that your appointment (Reference <strong>#${refId}</strong>) has been <strong>RESCHEDULED</strong> to a new time slot.
            </p>

            <!-- Schedule Comparison Table -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #CBD5E1; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
              <tr style="background-color: #FEF3C7;">
                <td width="50%" style="padding: 12px; border-right: 1px solid #FCD34D; font-size: 12px; color: #92400E;">
                  <strong style="text-transform: uppercase; letter-spacing: 0.5px;">Previous Schedule</strong><br/>
                  <span style="font-size: 13px; text-decoration: line-through; color: #B45309;">${oldDate} at ${oldTime}</span>
                </td>
                <td width="50%" style="padding: 12px; background-color: #ECFDF5; font-size: 12px; color: #065F46;">
                  <strong style="text-transform: uppercase; letter-spacing: 0.5px;">NEW Confirmed Schedule ✅</strong><br/>
                  <span style="font-size: 14px; font-weight: 800; color: #047857;">${newDate} at ${newTime}</span>
                </td>
              </tr>
            </table>

            <!-- Additional Details -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #CBD5E1; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
              ${renderDetailRow("Service", service, "#FFFFFF")}
              ${renderDetailRow("Doctor", doctor, "#F8FAFC")}
              ${renderDetailRow("Branch / Location", branch, "#FFFFFF")}
            </table>

            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px;">
              <tr>
                <td style="padding: 14px; color: #B45309; font-size: 13px; font-weight: 700; line-height: 1.5;">
                  💬 <strong>Need Changes?</strong> If this new schedule does not suit you, please reply to this email or call our helpline.
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td>${HOSPITAL_FOOTER}</td></tr>
      </table>
    </body>
    </html>
  `;

  return {
    subject: "Your Appointment Has Been Rescheduled – Haji Murad Eye Hospital Trust",
    html,
  };
}
