import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendWhatsAppMessage } from "@/lib/whatsappApi";
import { formatWhatsAppPhone, getWhatsAppAppointmentUrl } from "@/lib/whatsappHelper";
import { triggerEmailApi } from "@/lib/clientEmailHelper";

/**
 * Shared helper function when Admin or Doctor updates appointment status.
 * WhatsApp: ALWAYS attempted if a contact number exists.
 * Email: Sent ADDITIONALLY, ONLY IF the patient provided an email address.
 * Both send attempts are wrapped in independent try/catch blocks.
 */
export const notifyPatientOfStatusChange = async (action, apptData, newDate = "", newTime = "") => {
  if (!apptData) return;

  const phoneRaw = apptData.phone || apptData.contactNumber || apptData.mobile || "";
  const emailRaw = (apptData.email || "").trim();
  const act = (action || "").toLowerCase();

  const finalDate = newDate || apptData.date || "N/A";
  const finalTime = newTime || apptData.time || "N/A";
  const patientName = apptData.name || apptData.patientName || "Patient";

  // -------------------------------------------------------------
  // 1. WhatsApp Message (ALWAYS sent if phone exists)
  // -------------------------------------------------------------
  if (phoneRaw) {
    try {
      const serviceName = apptData.service || "Ophthalmic Consultation";
      const doctorName = apptData.doctor || apptData.doctorName || "Medical Specialist";
      let statusText = "Confirmed";

      if (act.includes("cancel") || act.includes("reject")) {
        statusText = "Cancelled";
      } else if (act.includes("reschedule")) {
        statusText = "Rescheduled";
      } else if (act.includes("confirm") || act.includes("accept")) {
        statusText = "Confirmed";
      }

      await sendWhatsAppMessage(phoneRaw, "appointment_status_update", [
        patientName,
        statusText,
        serviceName,
        doctorName,
        finalDate,
        finalTime,
      ]).catch((waApiErr) => console.error("WhatsApp status update send failed:", waApiErr));

      // Also trigger browser WhatsApp link fallback if in client browser
      const waUrl = getWhatsAppAppointmentUrl(act, apptData, finalDate, finalTime);
      if (waUrl && typeof window !== "undefined") {
        window.open(waUrl, "_blank");
      }
    } catch (waErr) {
      console.error("WhatsApp send failed:", waErr);
    }
  }

  // -------------------------------------------------------------
  // 2. Email Notification (Sent ADDITIONALLY, ONLY IF email provided)
  // -------------------------------------------------------------
  if (emailRaw) {
    try {
      let emailType = "";
      if (act.includes("confirm") || act.includes("accept")) {
        emailType = "STATUS_CONFIRMED";
      } else if (act.includes("cancel") || act.includes("reject")) {
        emailType = "STATUS_CANCELLED";
      } else if (act.includes("reschedule")) {
        emailType = "STATUS_RESCHEDULED";
      }

      if (emailType) {
        await triggerEmailApi({
          type: emailType,
          data: {
            ...apptData,
            date: finalDate,
            time: finalTime,
            oldDate: apptData.date,
            oldTime: apptData.time,
            email: emailRaw,
          },
        }).catch((emailApiErr) => console.warn("[Email Service Notice]:", emailApiErr));
      }
    } catch (emailErr) {
      console.warn("[notifyPatientOfStatusChange] Email error (non-blocking):", emailErr);
    }
  }
};

/**
 * Creates a notification in the unified `notifications` collection in Firestore.
 */
export const createNotification = async ({
  recipient_type, // "admin" | "doctor"
  recipient_id,   // "admin" or doctorId
  sender_type,    // "admin" | "doctor" | "patient"
  type,           // "appointment_booked" | "doctor_action" | "admin_action" | "direct_message"
  title,
  message,
  appointmentId = "",
  doctorId = "",
  doctorName = "",
  patientName = "",
  href = ""
}) => {
  try {
    await addDoc(collection(db, "notifications"), {
      recipient_type: recipient_type || "admin",
      recipient_id: recipient_id || "admin",
      sender_type: sender_type || (recipient_type === "doctor" ? "admin" : "doctor"),
      type: type || "general",
      title: title || "Notification",
      message: message || "",
      appointmentId: appointmentId || "",
      doctorId: doctorId || "",
      doctorName: doctorName || "",
      patientName: patientName || "",
      href: href || "",
      is_read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Notice: createNotification exception handled:", err);
  }
};

/**
 * Triggered when a patient books an appointment.
 */
export const notifyOnAppointmentBooked = async (apptData, appointmentId = "") => {
  try {
    const patientName = apptData.name || "Patient";
    const doctorName = apptData.doctor || "";
    const doctorId = apptData.doctorId || "";
    const dateTimeStr = `${apptData.date || "N/A"} (${apptData.time || "N/A"})`;

    // 1. Doctor Notification (ONLY if doctorId is assigned)
    if (doctorId) {
      await createNotification({
        recipient_type: "doctor",
        recipient_id: doctorId,
        type: "appointment_booked",
        title: "New Appointment Request",
        message: `New appointment request from ${patientName} for ${dateTimeStr}`,
        appointmentId,
        doctorId,
        doctorName: doctorName ? (doctorName.startsWith("Dr") ? doctorName : `Dr. ${doctorName}`) : "Doctor",
        patientName,
        href: "/doctor/notifications",
      });
    }

    // 2. Admin Notification (ALWAYS for all appointments)
    const docLabel = doctorName ? (doctorName.startsWith("Dr") ? doctorName : `Dr. ${doctorName}`) : "General Hospital";
    await createNotification({
      recipient_type: "admin",
      recipient_id: "admin",
      type: "appointment_booked",
      title: "New Appointment Booked",
      message: `New appointment booked (${docLabel}) by ${patientName}`,
      appointmentId,
      doctorId,
      doctorName: docLabel,
      patientName,
      href: "/admin/notifications",
    });
  } catch (err) {
    console.warn("Notice: notifyOnAppointmentBooked error handled:", err);
  }
};

/**
 * Triggered when Doctor performs an action (Accept / Reject / Reschedule) on an appointment.
 */
export const notifyOnDoctorAction = async (action, apptData, doctorName = "Doctor", newDate = "", newTime = "", activityLogId = "") => {
  try {
    const patientName = apptData.name || "Patient";
    const apptShortId = apptData.id ? `#${apptData.id.slice(0, 6)}` : "request";

    let title = "Doctor Appointment Update";
    let message = "";

    if (action === "accepted" || action === "confirmed") {
      title = "Appointment Accepted by Doctor";
      message = `Appointment ${apptShortId} with ${patientName} has been ACCEPTED by Dr. ${doctorName}`;
    } else if (action === "rejected" || action === "cancelled") {
      title = "Appointment Rejected by Doctor";
      message = `Appointment ${apptShortId} with ${patientName} has been REJECTED by Dr. ${doctorName}`;
    } else if (action === "rescheduled") {
      title = "Appointment Rescheduled by Doctor";
      message = `Appointment ${apptShortId} with ${patientName} has been RESCHEDULED by Dr. ${doctorName} to ${newDate} at ${newTime}`;
    }

    const targetHref = activityLogId
      ? `/admin/notifications/action-detail?id=${activityLogId}`
      : "/admin/appointments";

    await createNotification({
      recipient_type: "admin",
      recipient_id: "admin",
      type: "doctor_action",
      title,
      message,
      appointmentId: apptData.id || "",
      doctorId: apptData.doctorId || "",
      doctorName,
      patientName,
      href: targetHref,
    });
  } catch (err) {
    console.warn("Notice: notifyOnDoctorAction error handled:", err);
  }
};

/**
 * Triggered when Admin performs an action on an appointment.
 */
export const notifyOnAdminAction = async (action, apptData, newDate = "", newTime = "") => {
  try {
    const doctorId = apptData.doctorId || "";
    if (!doctorId) return;

    const apptShortId = apptData.id ? `#${apptData.id.slice(0, 6)}` : "request";

    let title = "Admin Appointment Update";
    let message = "";

    if (action === "accepted" || action === "confirmed") {
      title = "Appointment Accepted by Admin";
      message = `Appointment ${apptShortId} has been ACCEPTED by Admin`;
    } else if (action === "rejected" || action === "cancelled") {
      title = "Appointment Rejected by Admin";
      message = `Appointment ${apptShortId} has been REJECTED by Admin`;
    } else if (action === "rescheduled") {
      title = "Appointment Rescheduled by Admin";
      message = `Appointment ${apptShortId} has been RESCHEDULED by Admin to ${newDate} at ${newTime}`;
    }

    await createNotification({
      recipient_type: "doctor",
      recipient_id: doctorId,
      sender_type: "admin",
      type: "admin_action",
      title,
      message,
      appointmentId: apptData.id || "",
      doctorId,
      doctorName: apptData.doctor || "",
      patientName: apptData.name || "",
      href: "/doctor/notifications",
    });

    try {
      await addDoc(collection(db, "activityLog"), {
        action: action,
        appointmentId: apptData.id || "",
        doctorId,
        doctorName: apptData.doctor || "Admin",
        patientName: apptData.name || "Patient",
        details: title,
        message: message,
        read: false,
        timestamp: serverTimestamp(),
      });
    } catch (logErr) {
      console.warn("activityLog notice in notifyOnAdminAction:", logErr);
    }
  } catch (err) {
    console.warn("Notice: notifyOnAdminAction error handled:", err);
  }
};

/**
 * Triggered when a direct message is sent in the Chat System.
 * Supports both object ({ sender_type, message, doctorId, doctorName }) and positional arguments.
 */
export const notifyOnDirectMessage = async (arg1, arg2, arg3, arg4) => {
  try {
    let sender_type = "doctor";
    let messageText = "";
    let doctorId = "";
    let doctorName = "";

    if (typeof arg1 === "object" && arg1 !== null) {
      sender_type = arg1.sender_type || arg1.senderType || "doctor";
      messageText = arg1.message || arg1.messageText || "";
      doctorId = arg1.doctorId || "";
      doctorName = arg1.doctorName || "Doctor";
    } else {
      sender_type = arg1;
      messageText = arg2;
      doctorId = arg3;
      doctorName = arg4;
    }

    const textSnippet = messageText.length > 50 ? messageText.slice(0, 50) + "..." : messageText;

    if (sender_type === "doctor") {
      // Notify Admin
      const cleanDocName = doctorName ? (doctorName.startsWith("Dr") ? doctorName : `Dr. ${doctorName}`) : "Doctor";
      await createNotification({
        recipient_type: "admin",
        recipient_id: "admin",
        sender_type: "doctor",
        type: "direct_message",
        title: `New Doctor Inquiry: ${cleanDocName}`,
        message: textSnippet,
        doctorId,
        doctorName: cleanDocName,
        href: `/admin/messages?tab=doctor_chats&doctorId=${doctorId}`,
      });
    } else if (sender_type === "admin") {
      // Notify Doctor
      if (doctorId) {
        await createNotification({
          recipient_type: "doctor",
          recipient_id: doctorId,
          sender_type: "admin",
          type: "direct_message",
          title: "Admin replied to your message",
          message: textSnippet,
          doctorId,
          doctorName,
          href: "/doctor/messages",
        });
      }
    }
  } catch (err) {
    console.warn("Notice: notifyOnDirectMessage error handled:", err);
  }
};

/**
 * Triggered when a patient submits a contact message on the public website.
 */
export const notifyOnPatientMessage = async (patientName = "Patient", messageText = "") => {
  try {
    const textSnippet = messageText.length > 50 ? messageText.slice(0, 50) + "..." : messageText;
    await createNotification({
      recipient_type: "admin",
      recipient_id: "admin",
      type: "patient_message",
      title: `New Patient Inquiry: ${patientName || "Patient"}`,
      message: textSnippet,
      patientName: patientName || "",
      href: "/admin/messages?tab=patient_inquiries",
    });
  } catch (err) {
    console.warn("Notice: notifyOnPatientMessage error handled:", err);
  }
};
