import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Creates a notification in the unified `notifications` collection in Firestore.
 */
export const createNotification = async ({
  recipient_type, // "admin" | "doctor"
  recipient_id,   // "admin" or doctorId
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
    const doctorName = apptData.doctor || "Specialist";
    const doctorId = apptData.doctorId || "";
    const dateTimeStr = `${apptData.date || "N/A"} (${apptData.time || "N/A"})`;

    // 1. Doctor Notification
    if (doctorId) {
      await createNotification({
        recipient_type: "doctor",
        recipient_id: doctorId,
        type: "appointment_booked",
        title: "New Appointment Request",
        message: `New appointment request from ${patientName} for ${dateTimeStr}`,
        appointmentId,
        doctorId,
        doctorName,
        patientName,
        href: "/doctor/notifications",
      });
    }

    // 2. Admin Notification
    await createNotification({
      recipient_type: "admin",
      recipient_id: "admin",
      type: "appointment_booked",
      title: "New Appointment Booked",
      message: `New appointment booked with Dr. ${doctorName} by ${patientName}`,
      appointmentId,
      doctorId,
      doctorName,
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
export const notifyOnDoctorAction = async (action, apptData, doctorName = "Doctor", newDate = "", newTime = "") => {
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
      href: "/admin/notifications",
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
      type: "admin_action",
      title,
      message,
      appointmentId: apptData.id || "",
      doctorId,
      doctorName: apptData.doctor || "",
      patientName: apptData.name || "",
      href: "/doctor/notifications",
    });
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
        type: "direct_message",
        title: `New Doctor Inquiry: ${cleanDocName}`,
        message: textSnippet,
        doctorId,
        doctorName: cleanDocName,
        href: `/admin/messages?doctorId=${doctorId}`,
      });
    } else if (sender_type === "admin") {
      // Notify Doctor
      if (doctorId) {
        await createNotification({
          recipient_type: "doctor",
          recipient_id: doctorId,
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
      href: "/admin/messages",
    });
  } catch (err) {
    console.warn("Notice: notifyOnPatientMessage error handled:", err);
  }
};
