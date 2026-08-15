/**
 * Production-ready HTML Email Templates for Haji Murad Eye Hospital Trust.
 * Standardized with inline CSS and table-based layouts for cross-client email compatibility (Gmail, Outlook, Apple Mail).
 */

const HOSPITAL_BRAND_HEADER = `
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #1E1433 0%, #C4232C 100%); border-radius: 16px 16px 0 0;">
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
          <a href="https://hmeht.com/" target="_blank" style="color: #1E1433; font-size: 12px; font-weight: 700; text-decoration: none;">
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
              <tr style="background-color: #1E1433;">
                <td colspan="2" style="padding: 10px 14px; color: #FFFFFF; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                  Appointment Summary
                </td>
              </tr>
              ${renderDetailRow("Reference ID", `<span style="color: #1E1433; font-family: monospace;">#${refId}</span>`, "#F8FAFC")}
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
              ${renderDetailRow("Reference ID", `<span style="color: #1E1433; font-family: monospace;">#${refId}</span>`, "#F8FAFC")}
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
          <td align="center" style="padding: 24px 20px; background: linear-gradient(135deg, #059669 0%, #1E1433 100%); border-radius: 16px 16px 0 0;">
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
                  <a href="https://hmeht.com/#appointment" target="_blank" style="display: inline-block; background-color: #1E1433; color: #FFFFFF; padding: 12px 24px; font-size: 13px; font-weight: 800; border-radius: 10px; text-decoration: none;">
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
          <td align="center" style="padding: 24px 20px; background: linear-gradient(135deg, #D97706 0%, #1E1433 100%); border-radius: 16px 16px 0 0;">
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

/**
 * 6. Email — To Candidate (Internship Application Received Notice)
 */
export function getUserInternshipApplicationReceivedEmail(data) {
  const applicantName = data.applicantName || "Valued Applicant";
  const programTitle = data.internshipTitle || "Internship Program";
  const department = data.department || "Medical / Clinical";
  const institute = data.instituteName || "University";

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #F1F5F9; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
        <tr><td>${HOSPITAL_BRAND_HEADER}</td></tr>
        <tr>
          <td style="padding: 28px 24px; font-family: 'Segoe UI', Arial, sans-serif;">
            <div style="display: inline-block; background-color: #EEF2FF; border: 1px solid #C7D2FE; color: #4338CA; font-size: 11px; font-weight: 800; padding: 4px 12px; rounded: 8px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
              Academic Training Portal
            </div>
            <h2 style="color: #0F172A; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">
              Internship Application Submitted Successfully! 🎓
            </h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear <strong>${applicantName}</strong>,<br/><br/>
              Thank you for applying to the <strong>${programTitle}</strong> at Haji Murad Trust Eye Hospital. We have received your application and educational credentials.
            </p>

            <!-- Application Details Card -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #CBD5E1; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
              <tr style="background-color: #1E1433;">
                <td colspan="2" style="padding: 10px 14px; color: #FFFFFF; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                  Application Details Summary
                </td>
              </tr>
              ${renderDetailRow("Program Applied", programTitle, "#F8FAFC")}
              ${renderDetailRow("Department", department, "#FFFFFF")}
              ${renderDetailRow("Institute / University", institute, "#F8FAFC")}
              ${renderDetailRow("Application Status", "<span style='color: #D97706; font-weight: 800;'>Under Academic Board Review (Pending)</span>", "#FFFFFF")}
            </table>

            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; margin-bottom: 20px;">
              <tr>
                <td style="padding: 16px; font-size: 13px; color: #166534; line-height: 1.6;">
                  📅 <strong>What Happens Next?</strong><br/>
                  Our Academic Selection Board will evaluate your background. You will receive an official notification regarding the status of your application within <strong>3 to 5 business days</strong> via email or WhatsApp.
                </td>
              </tr>
            </table>

            <p style="color: #64748B; font-size: 13px; margin: 0;">
              We wish you the very best in your professional journey,<br/>
              <strong>Haji Murad Trust Eye Hospital Academic Directorate</strong>
            </p>
          </td>
        </tr>
        <tr><td>${HOSPITAL_FOOTER}</td></tr>
      </table>
    </body>
    </html>
  `;

  return {
    subject: `Application Received: ${programTitle} – Haji Murad Eye Hospital`,
    html,
  };
}

/**
 * 7. Email — To Hospital Admin (New Internship Application Notification)
 */
export function getAdminNewInternshipApplicationEmail(data) {
  const applicantName = data.applicantName || "Candidate";
  const programTitle = data.internshipTitle || "Internship Program";
  const department = data.department || "General";
  const institute = data.instituteName || "N/A";
  const graduationYear = data.graduationYear || "N/A";
  const email = data.email || "N/A";
  const phone = data.phone || "N/A";
  const message = data.coverMessage || "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #F1F5F9; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
        <tr>
          <td align="center" style="padding: 24px 20px; background: linear-gradient(135deg, #4338CA 0%, #1E1433 100%); border-radius: 16px 16px 0 0;">
            <h1 style="color: #FFFFFF; font-size: 20px; font-weight: 800; margin: 0; text-transform: uppercase;">
              NEW INTERNSHIP CANDIDATE 🎓
            </h1>
            <p style="color: rgba(255,255,255,0.85); font-size: 12px; margin: 4px 0 0 0; font-weight: 700;">
              Haji Murad Trust Eye Hospital Admin Alert
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 28px 24px;">
            <p style="color: #0F172A; font-size: 14px; font-weight: 700; margin: 0 0 16px 0;">
              A new candidate has submitted an official application for <strong>${programTitle}</strong>.
            </p>

            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #CBD5E1; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
              ${renderDetailRow("Applicant Name", applicantName, "#F8FAFC")}
              ${renderDetailRow("Program Title", programTitle, "#FFFFFF")}
              ${renderDetailRow("Department", department, "#F8FAFC")}
              ${renderDetailRow("Institute / University", institute, "#FFFFFF")}
              ${renderDetailRow("Graduation Year", `Class of ${graduationYear}`, "#F8FAFC")}
              ${renderDetailRow("Email Address", `<a href="mailto:${email}" style="color: #4338CA;">${email}</a>`, "#FFFFFF")}
              ${renderDetailRow("Phone / WhatsApp", `<a href="tel:${phone}" style="color: #047857; font-weight: 800;">${phone}</a>`, "#F8FAFC")}
            </table>

            ${
              message
                ? `
            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px; margin-bottom: 20px;">
              <span style="font-size: 11px; font-weight: 800; color: #4338CA; text-transform: uppercase; display: block; margin-bottom: 4px;">Candidate Cover Statement:</span>
              <p style="color: #334155; font-size: 13px; font-style: italic; margin: 0; line-height: 1.5;">"${message}"</p>
            </div>
            `
                : ""
            }

            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center">
                  <a href="https://hmeht.com/admin/internships/applications" target="_blank" style="display: inline-block; background-color: #4338CA; color: #FFFFFF; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; font-weight: 800; padding: 12px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(67, 56, 202, 0.3);">
                    Open Admin Applications Portal &rarr;
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
    subject: `🎓 New Internship Application: ${applicantName} – ${programTitle}`,
    html,
  };
}

/**
 * 8. Email — Candidate Application ACCEPTED
 */
export function getUserInternshipAcceptedEmail(data) {
  const applicantName = data.applicantName || "Candidate";
  const programTitle = data.internshipTitle || "Internship Program";
  const department = data.department || "Medical";
  const timing = data.timing || "08:00 AM - 02:00 PM";

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #F1F5F9; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
        <tr>
          <td align="center" style="padding: 24px 20px; background: linear-gradient(135deg, #059669 0%, #1E1433 100%); border-radius: 16px 16px 0 0;">
            <h1 style="color: #FFFFFF; font-size: 22px; font-weight: 800; margin: 0; text-transform: uppercase;">
              CONGRATULATIONS! ACCEPTED ✅
            </h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 12px; margin: 4px 0 0 0; font-weight: 700;">
              Haji Murad Trust Eye Hospital Academic Board
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 28px 24px;">
            <p style="color: #0F172A; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear <strong>${applicantName}</strong>,<br/><br/>
              We are delighted to inform you that your application for the <strong>${programTitle}</strong> has been officially <strong>ACCEPTED</strong> by the Academic Directorate of Haji Murad Trust Eye Hospital!
            </p>

            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #A7F3D0; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
              <tr style="background-color: #059669;">
                <td colspan="2" style="padding: 10px 14px; color: #FFFFFF; font-size: 12px; font-weight: 800; text-transform: uppercase;">
                  Accepted Candidate Enrollment Summary
                </td>
              </tr>
              ${renderDetailRow("Applicant Name", applicantName, "#ECFDF5")}
              ${renderDetailRow("Accepted Program", programTitle, "#FFFFFF")}
              ${renderDetailRow("Department", department, "#ECFDF5")}
              ${renderDetailRow("Program Schedule Timing", timing, "#FFFFFF")}
              ${renderDetailRow("Status", "<span style='color: #059669; font-weight: 800;'>ACCEPTED & CONFIRMED ✅</span>", "#ECFDF5")}
            </table>

            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ECFDF5; border: 1px solid #6EE7B7; border-radius: 12px; margin-bottom: 20px;">
              <tr>
                <td style="padding: 16px; font-size: 13px; color: #065F46; line-height: 1.6;">
                  📋 <strong>Orientation Instructions:</strong><br/>
                  Our academic coordinator will reach out to you via Phone/WhatsApp to guide you through the orientation schedule and document submission. Please keep your educational original certificates ready.
                </td>
              </tr>
            </table>

            <p style="color: #334155; font-size: 13px; margin: 0;">
              Congratulations once again on joining Haji Murad Eye Hospital!<br/><br/>
              Warm regards,<br/>
              <strong>Academic Selection Directorate</strong><br/>
              Haji Murad Trust Eye Hospital
            </p>
          </td>
        </tr>
        <tr><td>${HOSPITAL_FOOTER}</td></tr>
      </table>
    </body>
    </html>
  `;

  return {
    subject: `🎉 Congratulations! Application Accepted for ${programTitle} – Haji Murad Eye Hospital`,
    html,
  };
}

/**
 * 9. Email — Candidate Application REJECTED / REGRET
 */
export function getUserInternshipRejectedEmail(data) {
  const applicantName = data.applicantName || "Candidate";
  const programTitle = data.internshipTitle || "Internship Program";

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #F1F5F9; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
        <tr><td>${HOSPITAL_BRAND_HEADER}</td></tr>
        <tr>
          <td style="padding: 28px 24px;">
            <h2 style="color: #0F172A; font-size: 18px; font-weight: 800; margin: 0 0 14px 0;">
              Update Regarding Your Internship Application
            </h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
              Dear <strong>${applicantName}</strong>,<br/><br/>
              Thank you for taking the time to apply for the <strong>${programTitle}</strong> at Haji Murad Trust Eye Hospital.
            </p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              After a thorough review of all applications by our Academic Board, we regret to inform you that we are unable to offer you a position for this current intake due to high candidate competition and limited seat availability.
            </p>

            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; margin-bottom: 20px;">
              <tr>
                <td style="padding: 16px; font-size: 13px; color: #475569; line-height: 1.6;">
                  💡 <strong>Future Opportunities:</strong><br/>
                  Your profile has been saved in our academic talent database. We encourage you to re-apply for upcoming training cohorts and specialized academic workshops.
                </td>
              </tr>
            </table>

            <p style="color: #64748B; font-size: 13px; margin: 0;">
              We wish you every success in your future academic and professional endeavors.<br/><br/>
              Sincerely,<br/>
              <strong>Academic Directorate</strong><br/>
              Haji Murad Trust Eye Hospital
            </p>
          </td>
        </tr>
        <tr><td>${HOSPITAL_FOOTER}</td></tr>
      </table>
    </body>
    </html>
  `;

  return {
    subject: `Update Regarding Your Application for ${programTitle} – Haji Murad Eye Hospital`,
    html,
  };
}
