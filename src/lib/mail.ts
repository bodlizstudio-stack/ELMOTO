import "server-only";
import nodemailer from "nodemailer";

export function mailConfigured() {
  if (process.env.RESEND_API_KEY) return true;
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMail(input: { to: string; subject: string; text: string }) {
  if (!mailConfigured()) return { sent: false as const, reason: "unconfigured" as const };
  try {
    if (process.env.RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM || "EL-MOTO <info@elmoto.si>",
          to: [input.to],
          subject: input.subject,
          text: input.text,
        }),
      });
      if (!response.ok) return { sent: false as const, reason: "failed" as const };
      return { sent: true as const };
    }
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.MAIL_FROM || "EL-MOTO <info@elmoto.si>",
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { sent: true as const };
  } catch (error) {
    console.error("Pošiljanje e-pošte ni uspelo.", error);
    return { sent: false as const, reason: "failed" as const };
  }
}
