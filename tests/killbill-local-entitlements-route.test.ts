const gate=jest.fn(),identity=jest.fn(),read=jest.fn();
jest.mock('@/lib/foundation/current-customer-server',()=>({currentCustomer:()=>identity()}));
jest.mock('@/lib/foundation/killbill-local-test',()=>({localBillingConfig:()=>gate()}));
jest.mock('@/lib/foundation/killbill-local-entitlements',()=>({readLocalEntitlements:(...a:unknown[])=>read(...a)}));
import{GET}from '@/app/api/account/entitlements/route';
beforeEach(()=>{jest.clearAllMocks();gate.mockReturnValue({});identity.mockResolvedValue({status:'guest',customer:null})});
it('disabled deployment is404 before identity or core read',async()=>{gate.mockReturnValue(null);const r=await GET();expect(r.status).toBe(404);expect(identity).not.toHaveBeenCalled();expect(read).not.toHaveBeenCalled()});
it.each([['guest',401],['unavailable',503],['not-linked',200],['ready',200]])('route%s uses private no-store and correctHTTPstatus',async(status,http)=>{read.mockResolvedValue({status});const r=await GET();expect(r.status).toBe(http);expect(r.headers.get('cache-control')).toBe('private, no-store');expect(r.headers.get('vary')).toBe('Cookie');expect(await r.json()).toEqual({entitlements:{status}})});
