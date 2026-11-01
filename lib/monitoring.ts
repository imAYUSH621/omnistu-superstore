/**
 * Monitoring hook (G6 groundwork). Fail-closed: without
 * MONITORING_WEBHOOK_URL this is a deliberate no-op. With a URL set,
 * notable operational events (refund UNKNOWN/FAILED, dispatch blocks)
 * POST a small JSON alert. No customer data beyond ids/amounts the
 * operator already owns; no payload content from users.
 */

export type MonitoringEvent = {
  event: string;
  level: 'info' | 'warning' | 'critical';
  detail?: string;
};

export async function reportEvent(e: MonitoringEvent): Promise<'sent' | 'disabled' | 'failed'> {
  const url = process.env.MONITORING_WEBHOOK_URL;
  if (!url) return 'disabled';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'omnistu-superstore', time: new Date().toISOString(), ...e }),
    });
    return res.ok ? 'sent' : 'failed';
  } catch {
    return 'failed';
  }
}
