import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

/**
 * Development-only outbox. Writes a message to a local folder instead of
 * sending anything. It is off in production and off unless DEV_OUTBOX_DIR is
 * set. No route reads this folder. It is not delivered mail.
 */
export function devOutboxEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV !== 'production' && !!env.DEV_OUTBOX_DIR;
}

export function writeDevOutbox(
  message: { to: string; subject: string; body: string },
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (!devOutboxEnabled(env)) return false;
  const dir = env.DEV_OUTBOX_DIR as string;
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const name = `${Date.now()}-${randomBytes(4).toString('hex')}.json`;
  writeFileSync(join(dir, name), JSON.stringify({ ...message, createdAt: new Date().toISOString() }), {
    mode: 0o600,
  });
  return true;
}
