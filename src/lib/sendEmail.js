import nodemailer from "nodemailer";

/**
 * Server-only SMTP email sender utility for HostMaria / cPanel SMTP server.
 * Uses port 465 with SSL/TLS (secure: true).
 */
export async function sendEmail({ to, subject, html }) {
  const host = process.env.SMTP_HOST || "smtp.stackmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER || "info@hmeht.com";
  const pass = process.env.SMTP_PASSWORD || "hmeht123";

  if (!to) {
    console.warn("[sendEmail] Missing recipient email address.");
    return { success: false, error: "Recipient email is missing" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false, // Prevent SSL cert validation issues on cPanel shared hosts
      },
    });

    const mailOptions = {
      from: `"Haji Murad Eye Hospital" <${user}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[sendEmail] Email successfully sent to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[sendEmail] Error sending email via SMTP:", error);
    return { success: false, error: error.message };
  }
}
