/**
 * Supplier adapter edge cases with mocked provider APIs.
 * No live supplier calls anywhere in the test suite.
 */
import { CjAdapter, parseCost } from '@/lib/suppliers/cj-adapter';
import { SupplierError } from '@/lib/suppliers/types';
import { searchAllSuppliers, type SupplierSearchResult } from '@/lib/suppliers/router';
import type { SupplierAdapter } from '@/lib/suppliers/types';

const okJson = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;

function tokenRes(t = 't1') {
  return okJson({ code: 200, result: true, data: { accessToken: t } });
}
function listRes(list: unknown[]) {
  return okJson({ code: 200, result: true, data: { list } });
}

describe('CJ adapter HTTP edge cases (mocked)', () => {
  let fetchMock: jest.SpyInstance;
  beforeEach(() => { fetchMock = jest.spyOn(global, 'fetch'); });
  afterEach(() => fetchMock.mockRestore());

  it('auth failure throws SupplierError with status, no product call', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({ result: false, message: 'bad key' }) } as unknown as Response);
    const a = new CjAdapter('bad-key');
    await expect(a.searchProducts('x', { page: 1, limit: 5 })).rejects.toBeInstanceOf(SupplierError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('caches the token: two searches trigger only one auth call', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenRes())
      .mockResolvedValueOnce(listRes([{ pid: 'P1', productNameEn: 'A', sellPrice: '1.00' }]))
      .mockResolvedValueOnce(listRes([{ pid: 'P2', productNameEn: 'B', sellPrice: '2.00' }]));
    const a = new CjAdapter('k');
    await a.searchProducts('a', { page: 1, limit: 5 });
    await a.searchProducts('b', { page: 1, limit: 5 });
    const authCalls = fetchMock.mock.calls.filter((c) => String(c[0]).includes('authentication'));
    expect(authCalls).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('401 mid-session refreshes the token once and retries; never loops', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenRes('t1'))
      .mockResolvedValueOnce({ ok: false, status: 401, statusText: 'expired', json: async () => ({ result: false, message: 'expired' }) } as unknown as Response)
      .mockResolvedValueOnce(tokenRes('t2'))
      .mockResolvedValueOnce(listRes([{ pid: 'P3', productNameEn: 'C', sellPrice: '3.00' }]));
    const a = new CjAdapter('k');
    const res = await a.searchProducts('x', { page: 1, limit: 5 });
    expect(res).toHaveLength(1);
    expect(res[0].supplierProductId).toBe('P3');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('persistent 401 after refresh still throws (no infinite retry)', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenRes('t1'))
      .mockResolvedValueOnce({ ok: false, status: 401, statusText: 'x', json: async () => ({ result: false }) } as unknown as Response)
      .mockResolvedValueOnce(tokenRes('t2'))
      .mockResolvedValueOnce({ ok: false, status: 401, statusText: 'x', json: async () => ({ result: false }) } as unknown as Response);
    const a = new CjAdapter('k');
    await expect(a.searchProducts('x', { page: 1, limit: 5 })).rejects.toBeInstanceOf(SupplierError);
  });

  it('missing/empty list yields an empty result, not a crash', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenRes())
      .mockResolvedValueOnce(okJson({ code: 200, result: true, data: {} }));
    const a = new CjAdapter('k');
    expect(await a.searchProducts('x', { page: 1, limit: 5 })).toEqual([]);
  });

  it('normalizes malformed items without throwing (missing names/skus)', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenRes())
      .mockResolvedValueOnce(listRes([{ pid: 'P4' }]));
    const a = new CjAdapter('k');
    const [p] = await a.searchProducts('x', { page: 1, limit: 5 });
    expect(p.id).toBe('CJ-P4');
    expect(p.title).toBe('');
    expect(p.wholesaleCost).toBeNull();
    expect(p.retailPrice).toBeNull();
    expect(p.inStock).toBeNull();
  });

  it('getProduct returns null on 404, rethrows other errors', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenRes())
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found', json: async () => ({ result: false, message: 'nope' }) } as unknown as Response);
    const a = new CjAdapter('k');
    expect(await a.getProduct('missing')).toBeNull();
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'err', json: async () => ({ result: false, message: 'boom' }) } as unknown as Response);
    await expect(a.getProduct('x')).rejects.toBeInstanceOf(SupplierError);
  });

  it('pins the CJ wire contract: apiKey only in auth body, productName param, token header', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenRes('tok-abc'))
      .mockResolvedValueOnce(listRes([{ pid: 'P9', productNameEn: 'Widget', sellPrice: '2.00' }]));
    const a = new CjAdapter('secret-api-key');
    await a.searchProducts('wooden puzzle', { page: 2, limit: 7 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [authUrl, authInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    // Auth: apiKey travels ONLY in the POST body to getAccessToken, never as a bearer/CJ-Access-Token.
    expect(String(authUrl)).toContain('/authentication/getAccessToken');
    expect(authInit?.method).toBe('POST');
    expect(JSON.parse(String(authInit?.body))).toEqual({ apiKey: 'secret-api-key' });
    expect((authInit?.headers as Record<string, string>)?.['CJ-Access-Token']).toBeUndefined();

    const [listUrl, listInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    // Search: CJ silently ignores `keyWord` (returns the whole catalog); `productName` is the honored param.
    expect(String(listUrl)).toContain('/product/list?');
    expect(String(listUrl)).toContain('productName=wooden+puzzle');
    expect(String(listUrl)).not.toContain('keyWord=');
    expect(String(listUrl)).toContain('pageNum=2');
    expect(String(listUrl)).toContain('pageSize=7');
    // The raw apiKey must never be sent as the access token.
    expect((listInit?.headers as Record<string, string>)?.['CJ-Access-Token']).toBe('tok-abc');
  });
});

describe('parseCost adversarial inputs', () => {
  it('handles junk, negatives, and empty strings safely', () => {
    expect(parseCost(undefined)).toBeNull();
    expect(parseCost('')).toBeNull();
    expect(parseCost('no numbers here')).toBeNull();
    expect(parseCost('1.20 -- 3.40')).toBe(3.4);
    expect(parseCost(0)).toBe(0);
    for (const bad of [-1, NaN, Infinity, Number.MAX_VALUE, '-2', 'USD4plus10', '1-2', '1 -- -2', '1e309']) expect(parseCost(bad)).toBeNull();
  });
});

describe('router fault isolation', () => {
  const stub = (id: string, fail: boolean): SupplierAdapter => ({
    supplier: 'CJ',
    searchProducts: async () => {
      if (fail) throw new Error(`${id} down`);
      return [{
        id, supplier: 'CJ', supplierProductId: id, sku: id, title: id, description: '',
        specs: [], category: 'c', wholesaleCost: 1, retailPrice: 2, compareAtPrice: null,
        images: [], inStock: true, stockQuantity: null, shippingNote: '',
      }];
    },
    getProduct: async () => null,
  });

  it('ALL suppliers failing returns empty products and one error per supplier', async () => {
    const r: SupplierSearchResult = await searchAllSuppliers('x', { page: 1, limit: 5 }, [
      { ...stub('A', true), supplier: 'CJ' },
      { ...stub('B', true), supplier: 'PRINTIFY' },
    ]);
    expect(r.products).toEqual([]);
    expect(r.errors).toHaveLength(2);
  });

  it('no adapters configured returns an empty, error-free result', async () => {
    const r = await searchAllSuppliers('x', { page: 1, limit: 5 }, []);
    expect(r).toEqual({ products: [], errors: [] });
  });
});
