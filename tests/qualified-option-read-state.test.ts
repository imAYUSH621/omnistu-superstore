const user=jest.fn(),raw=jest.fn(),gate=jest.fn();jest.mock('@/db/prisma',()=>({prisma:{user:{findUnique:(...args:unknown[])=>user(...args)},$queryRaw:(...args:unknown[])=>raw(...args)}}));jest.mock('@/lib/retail/gate',()=>({qualifiedRetailTestEnabled:()=>gate()}));
import{loadQualifiedOptions}from '@/lib/retail/store';
const id='11111111-1111-4111-8111-111111111111',pid='22222222-2222-4222-8222-222222222222';
beforeEach(()=>{jest.clearAllMocks();gate.mockReturnValue(true);user.mockResolvedValue({address:{country:'US',postalCode:'10001'}});raw.mockResolvedValue([])});
it('confirmed nooffer is available with empty options',async()=>{expect(await loadQualifiedOptions(id,pid)).toEqual({status:'available',options:[]});expect(raw).toHaveBeenCalledTimes(1)});
it('missing destination is not nooffer and never queries offers',async()=>{user.mockResolvedValue({address:null});expect(await loadQualifiedOptions(id,pid)).toEqual({status:'destination-required',options:[]});expect(raw).not.toHaveBeenCalled()});
it('DBerror is unavailable not zero; no private diagnostics returned',async()=>{raw.mockRejectedValue(Error('secret database diagnostic'));const result=await loadQualifiedOptions(id,pid);expect(result).toEqual({status:'unavailable',options:[]});expect(JSON.stringify(result)).not.toContain('secret')});
it('gate failure refuses before reading owner/offer',async()=>{gate.mockReturnValue(false);expect(await loadQualifiedOptions(id,pid)).toEqual({status:'unavailable',options:[]});expect(user).not.toHaveBeenCalled();expect(raw).not.toHaveBeenCalled()});
