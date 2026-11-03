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
  /** Resolves true only when the transport confirmed acceptance; false on any failure. Never throws. */
  send(message: MailMessage): Promise<boolean>;
}

export function smtpConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

function smtpTransport(env: NodeJS.ProcessEnv): MailTransport {
  return {
    kind: 'smtp',
    async send(message) {
      try {
        // Lazy require: nodemailer only loads when SMTP is actually configured,
        // so builds and non-SMTP environments never touch it.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const nodemailer = require('nodemailer');
        const port = Number(env.SMTP_PORT || 587);
        const transport = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port,
          secure: env.SMTP_SECURE === 'true' || port === 465,
          requireTLS: !(env.SMTP_SECURE === 'true' || port === 465),
          auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: 15_000,
        });
        const from = env.SMTP_FROM || `${APP_NAME} <${SENDER_EMAIL}>`;
        const info = await transport.sendMail({ from, to: message.to, subject: message.subject, text: message.text });
        // Success only when the server accepted this recipient and rejected none.
        const accepted: unknown[] = Array.isArray(info?.accepted) ? info.accepted : [];
        const rejected: unknown[] = Array.isArray(info?.rejected) ? info.rejected : [];
        return accepted.length > 0 && rejected.length === 0;
      } catch (e) {
        // Never log the error message or config: it can echo credentials or addresses.
        const code = (e as { code?: unknown })?.code;
        console.warn('smtp send failed', e instanceof Error ? e.name : 'error', typeof code === 'string' ? code : '');
        return false;
      }
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
