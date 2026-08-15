/**
 * WhatsApp Cloud API Client Helper for Eye Hospital App
 */
export async function sendWhatsAppMessage({ to, templateName, params = [], languageCode = "en_US" }) {
  const serviceUrl = process.env.NEXT_PUBLIC_WHATSAPP_SERVICE_URL || "https://whatsapp-service-bay.vercel.app/api/send-whatsapp";

  const response = await fetch(serviceUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      templateName,
      params,
      languageCode: "en_US",
    }),
  });

  return await response.json();
}

export default sendWhatsAppMessage;
