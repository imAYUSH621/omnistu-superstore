// Read-only staging transport. No automatic retry: quota, rate, auth and suspension
// require different recovery, and a short sleep cannot safely resolve all HTTP 429s.
export class CjReadError extends Error {
  constructor(kind, code, requestId) {
    super(`CJ read stopped: ${kind}`);
    this.name = 'CjReadError';
    this.kind = kind;
    this.code = code;
    this.requestId = requestId;
  }
}
export function classifyCjResponse(status, body) {
  const code = Number(body?.code);
  if (code === 1600014) return 'SUSPENDED';
  if (code === 1600201 || code === 16900500 || (status === 429 && body?.pointsInfo)) return 'QUOTA';
  if (code === 1600200) return 'RATE_LIMIT';
  if (status === 429) return 'THROTTLED_UNKNOWN';
  if ([1600001, 1600002, 1600003, 1600004, 1600005, 1600006, 1600008].includes(code) || status === 401) return 'AUTH';
  if (status >= 500) return 'SERVER';
  if (status < 200 || status >= 300 || body?.result !== true) return 'REJECTED';
  return null;
}
export function createCjReadClient({ fetchImpl = fetch, sleep = ms => new Promise(r => setTimeout(r, ms)), now = Date.now } = {}) {
  let nextAt = 0;
  let stopped = false;
  return async function call(path, token, body) {
    if (stopped) throw new CjReadError('STOPPED');
    // Conservative free-tier limit, shared by all calls in this client, including authentication.
    await sleep(Math.max(0, nextAt - now()));
    nextAt = now() + 1100;
    let response;
    try {
      response = await fetchImpl('https://developers.cjdropshipping.com/api2.0/v1' + path, {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'CJ-Access-Token': token } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      stopped = true;
      throw new CjReadError('NETWORK');
    }
    const data = await response.json().catch(() => null);
    const kind = data ? classifyCjResponse(response.status, data) : 'UNREADABLE';
    if (kind) {
      stopped = true;
      throw new CjReadError(kind, Number(data?.code) || response.status, data?.requestId);
    }
    return data;
  };
}
