import { safeCallbackPath } from '@/lib/safe-callback';
const O = 'http://localhost:3000';
describe('safeCallbackPath', () => {
  it('keeps same-site paths', () => {
    expect(safeCallbackPath('/shipping-address', O)).toBe('/shipping-address');
    expect(safeCallbackPath('/order/abc?x=1', O)).toBe('/order/abc?x=1');
  });
  it('reduces own-origin absolute URLs to the path', () => {
    expect(safeCallbackPath('http://localhost:3000/shipping-address', O)).toBe('/shipping-address');
  });
  it('rejects open-redirect shapes', () => {
    for (const bad of ['https://evil.example/x', '//evil.example', '/\\evil.example', 'javascript:alert(1)', 'http://localhost:3000.evil.example/', '/a\nb', '', null, undefined, 42]) {
      expect(safeCallbackPath(bad, O)).toBe('/');
    }
    expect(safeCallbackPath('http://evil.example/', undefined)).toBe('/');
  });
});
