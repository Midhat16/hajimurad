/**
 * Helper to convert Pakistani / International phone strings to WhatsApp 923... format.
 */
export const formatWhatsAppPhone = (phoneStr) => {
  if (!phoneStr) return "";
  let digits = String(phoneStr).replace(/\D/g, ""); // Remove non-digits
  if (digits.startsWith("0092")) {
    digits = digits.slice(4);
  } else if (digits.startsWith("92")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return `92${digits}`;
};

/**
 * Builds pre-filled WhatsApp message URL for Appointment Status Changes (Confirm, Cancel, Reschedule)
 */
export const getWhatsAppAppointmentUrl = (action, appt, dateStr = "", timeStr = "") => {
  const phone = formatWhatsAppPhone(appt?.phone || "");
  if (!phone) return "";
  const name = appt?.name || "Patient";
  const date = dateStr || appt?.date || "N/A";
  const time = timeStr || appt?.time || "N/A";

  let message = "";
  const act = (action || "").toLowerCase();

  if (act.includes("reschedule")) {
    message = `Dear ${name}, your appointment at Haji Murad Eye Hospital Trust has been rescheduled to ${date} at ${time}. We apologize for any inconvenience and look forward to seeing you. Thank you for your understanding.`;
  } else if (act.includes("confirm") || act.includes("accept")) {
    message = `Dear ${name}, your appointment at Haji Murad Eye Hospital Trust has been confirmed for ${date} at ${time}. Please arrive 10 minutes early. For any queries, feel free to contact us. Thank you.`;
  } else if (act.includes("cancel") || act.includes("reject")) {
    message = `Dear ${name}, we regret to inform you that your requested appointment at Haji Murad Eye Hospital Trust could not be scheduled at this time. Please contact us to arrange an alternative time. We apologize for the inconvenience.`;
  } else {
    message = `Dear ${name}, your appointment details at Haji Murad Eye Hospital Trust: Date: ${date}, Time: ${time}. Thank you.`;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

/**
 * Builds pre-filled WhatsApp reply URL for Contact Form Inquiries
 */
export const getWhatsAppContactReplyUrl = (msg) => {
  const phone = formatWhatsAppPhone(msg?.phone || "");
  if (!phone) return "";
  const name = msg?.name || "Patient";
  const defaultText = `Dear ${name}, thank you for reaching out to Haji Murad Eye Hospital Trust. We have received your message and would like to follow up with you regarding your inquiry.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(defaultText)}`;
};
