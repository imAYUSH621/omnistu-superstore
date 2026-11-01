import { reportEvent } from '@/lib/monitoring';

describe('monitoring hook (G6)', () => {
  const env = process.env;
  let fetchMock: jest.SpyInstance;
  beforeEach(() => {
    process.env = { ...env };
    delete process.env.MONITORING_WEBHOOK_URL;
    fetchMock = jest.spyOn(global, 'fetch');
  });
  afterEach(() => { process.env = env; fetchMock.mockRestore(); });

  it('is a no-op without MONITORING_WEBHOOK_URL and never calls fetch', async () => {
    expect(await reportEvent({ event: 'refund.uncertain', level: 'critical' })).toBe('disabled');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts a JSON alert when configured', async () => {
    process.env.MONITORING_WEBHOOK_URL = 'https://hooks.example.test/alert';
    fetchMock.mockResolvedValueOnce({ ok: true } as Response);
    expect(await reportEvent({ event: 'refund.uncertain', level: 'critical', detail: 'x' })).toBe('sent');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://hooks.example.test/alert');
    const body = JSON.parse(init.body);
    expect(body.event).toBe('refund.uncertain');
    expect(body.level).toBe('critical');
  });

  it('reports failed without throwing on webhook errors', async () => {
    process.env.MONITORING_WEBHOOK_URL = 'https://hooks.example.test/alert';
    fetchMock.mockRejectedValueOnce(new Error('down'));
    expect(await reportEvent({ event: 'x', level: 'info' })).toBe('failed');
  });
});
