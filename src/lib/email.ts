import { env } from "@/lib/env";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

// De momento los emails se muestran en la consola del servidor.
// Cuando haya dominio (P-8.4) se sustituye por un EmailSender de Resend.
const consoleSender: EmailSender = {
  async send({ to, subject, text }) {
    console.info(
      `\n[email] De: ${env.EMAIL_FROM}\n[email] Para: ${to}\n[email] Asunto: ${subject}\n${text}\n`,
    );
  },
};

export const email: EmailSender = consoleSender;
