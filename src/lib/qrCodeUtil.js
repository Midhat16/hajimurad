import QRCode from "qrcode";

/**
 * Generate a Base64 Data URL for a given appointment ID or string
 * @param {string} text - Appointment ID or text content
 * @returns {Promise<string>} Base64 Data URL string for PNG QR Code
 */
export async function generateAppointmentQRCode(text) {
  try {
    if (!text) return "";
    const dataUrl = await QRCode.toDataURL(text, {
      width: 200,
      margin: 1,
      color: {
        dark: "#8C6CFF",
        light: "#FFFFFF",
      },
    });
    return dataUrl;
  } catch (err) {
    console.error("Error generating QR code:", err);
    return "";
  }
}
