/**
 * Helper function for sending WhatsApp messages via Vercel backend API service.
 * API Endpoint: https://whatsapp-service-bay.vercel.app/api/send-whatsapp
 */
export async function sendWhatsAppMessage(to, templateName, params = []) {
  try {
    if (!to) {
      console.warn("[WhatsApp API] Missing recipient phone number.");
      return { success: false, error: "Missing recipient phone number" };
    }

    // Phone formatting: "0" se shuru ho to "92" se replace karo, handle +92/0092
    let digits = String(to).replace(/\D/g, "");
    if (digits.startsWith("0092")) {
      digits = digits.slice(4);
    } else if (digits.startsWith("92")) {
      digits = digits.slice(2);
    } else if (digits.startsWith("0")) {
      digits = digits.slice(1);
    }
    const formattedPhone = `92${digits}`;

    const response = await fetch(
      "https://whatsapp-service-bay.vercel.app/api/send-whatsapp",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: formattedPhone,
          templateName,
          params: Array.isArray(params) ? params : [params],
        }),
      }
    );

    const data = await response.json();
    console.log("[WhatsApp API Response]:", data);
    return data;
  } catch (err) {
    console.error("WhatsApp send failed:", err);
    return { success: false, error: err.message };
  }
}

export default sendWhatsAppMessage;
