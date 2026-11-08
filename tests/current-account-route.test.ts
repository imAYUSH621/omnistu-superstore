const mockCurrent=jest.fn();jest.mock('@/lib/foundation/current-customer-server',()=>({currentCustomer:()=>mockCurrent()}));
import {GET} from '@/app/api/account/route';
afterEach(()=>jest.clearAllMocks());
it.each(['guest','not-found'])('no unauthenticated identity disclosure %s',async status=>{mockCurrent.mockResolvedValue({status,customer:null});const r=await GET();expect(r.status).toBe(401);expect(await r.json()).toEqual({error:'Authentication required'});expect(r.headers.get('cache-control')).toContain('no-store')});
it('reports storage failure honestly',async()=>{mockCurrent.mockResolvedValue({status:'unavailable',customer:null});expect((await GET()).status).toBe(503)});
it('returns only server-resolved self with private nocache',async()=>{const customer={customerId:'self',name:'Self',email:'self@example.test',joinedAt:'2026-01-01',identitySource:'existing-user'};mockCurrent.mockResolvedValue({status:'authenticated',customer});const r=await GET();expect(await r.json()).toEqual({account:customer});expect(r.headers.get('vary')).toBe('Cookie')});
