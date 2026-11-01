/**
 * The /unauthorized page must never advertise default or example admin
 * credentials. Seed users no longer carry weak hardcoded passwords, so any
 * "pre-configured login" copy is both stale and a credential-disclosure risk.
 */
import { readFileSync } from 'fs';

describe('unauthorized page credential copy', () => {
  const src = readFileSync('app/unauthorized/page.tsx', 'utf8');
  it('contains no default admin credential hints', () => {
    expect(src).not.toMatch(/Pre-configured admin login/i);
    expect(src).not.toMatch(/123456/);
    expect(src).not.toMatch(/admin@omnistu\.com/);
    expect(src).not.toMatch(/\/\s*<code>2026<\/code>/);
  });
  it('still points admins at the real sign-in flow', () => {
    expect(src).toMatch(/callbackUrl=\/admin/);
  });
});
