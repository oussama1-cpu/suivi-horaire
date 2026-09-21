import "server-only";
import nodemailer, { Transporter } from "nodemailer";

declare global {
  var __mailTransport: Transporter | null | undefined;
}

// Configuration SMTP via variables d'environnement :
//   SMTP_HOST, SMTP_PORT (587 par défaut), SMTP_USER, SMTP_PASS, SMTP_FROM
// Si SMTP_HOST n'est pas défini, les emails sont simplement journalisés.
function getTransport(): Transporter | null {
  if (global.__mailTransport !== undefined) return global.__mailTransport;

  const host = process.env.SMTP_HOST;
  if (!host) {
    global.__mailTransport = null;
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  global.__mailTransport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return global.__mailTransport;
}

export function isMailConfigured(): boolean {
  return !!process.env.SMTP_HOST;
}

export interface MailMessage {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(message: MailMessage): Promise<{ sent: boolean; error?: string }> {
  const recipients = (Array.isArray(message.to) ? message.to : [message.to]).filter(Boolean);
  if (recipients.length === 0) return { sent: false, error: "Aucun destinataire." };

  const transport = getTransport();
  if (!transport) {
    console.info(`[mail non configuré] → ${recipients.join(", ")} : ${message.subject}`);
    return { sent: false, error: "SMTP non configuré." };
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipients,
      subject: message.subject,
      text: message.text,
      html: message.html ?? `<pre style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(message.text)}</pre>`,
    });
    return { sent: true };
  } catch (err) {
    console.error("[mail] échec d'envoi :", err);
    return { sent: false, error: err instanceof Error ? err.message : "Erreur d'envoi." };
  }
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
