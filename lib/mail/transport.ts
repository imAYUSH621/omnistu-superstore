import { devOutboxEnabled, writeDevOutbox } from '@/lib/dev-outbox';
import { APP_NAME, SENDER_EMAIL } from '@/lib/constants';

/**
 * Transport-neutral mail layer.
 *
 * A transport EXISTS only when its environment is configured - no SMTP env,
 * no SMTP transport, nothing sends. Production today has no SMTP variables,
 * so mail stays undelivered exactly as before; the dev outbox keeps its
 * existing rules (never in production). Sender identity is unchanged: the
 * same APP_NAME <SENDER_EMAIL> the receipt path already uses, overridable
 * only by an explicit SMTP_FROM that is likewise unset until approved.
 */
export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface MailTransport {
  kind: 'smtp' | 'dev-outbox';
  /** Returns true when the message was accepted by the transport. */
  send(message: MailMessage): Promise<boolean>;
}

export function smtpConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

function smtpTransport(env: NodeJS.ProcessEnv): MailTransport {
  return {
    kind: 'smtp',
    async send(message) {
      // Lazy require: nodemailer only loads when SMTP is actually configured,
      // so builds and non-SMTP environments never touch it.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodemailer = require('nodemailer');
      const port = Number(env.SMTP_PORT || 587);
      const transport = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port,
        secure: env.SMTP_SECURE === 'true' || port === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      });
      const from = env.SMTP_FROM || `${APP_NAME} <${SENDER_EMAIL}>`;
      await transport.sendMail({ from, to: message.to, subject: message.subject, text: message.text });
      return true;
    },
  };
}

function devOutboxTransport(env: NodeJS.ProcessEnv): MailTransport {
  return {
    kind: 'dev-outbox',
    async send(message) {
      return writeDevOutbox({ to: message.to, subject: message.subject, body: message.text }, env);
    },
  };
}

/**
 * Picks the single configured transport, or null when nothing can deliver.
 * SMTP wins when both exist; the dev outbox is the development fallback.
 */
export function resolveMailTransport(env: NodeJS.ProcessEnv = process.env): MailTransport | null {
  if (smtpConfigured(env)) return smtpTransport(env);
  if (devOutboxEnabled(env)) return devOutboxTransport(env);
  return null;
}
