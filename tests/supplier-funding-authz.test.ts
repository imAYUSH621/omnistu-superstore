const mockAuth=jest.fn(),mockPrepare=jest.fn();
jest.mock('@/auth',()=>({auth:()=>mockAuth()}));
jest.mock('@/lib/supplier-funding-preparation',()=>({prepareSupplierFundingReview:(...a:unknown[])=>mockPrepare(...a)}));
import{prepareSupplierFundingReviewAction}from'@/lib/actions/supplier-funding.actions';
beforeEach(()=>{mockAuth.mockReset();mockPrepare.mockReset()});
it('denies guests and customer roles before touching a supplier',async()=>{for(const session of[null,{user:{role:'user'}}]){mockAuth.mockResolvedValue(session);expect(await prepareSupplierFundingReviewAction('00000000-0000-4000-8000-000000000001')).toMatchObject({success:false,message:'User is not authorized'})}expect(mockPrepare).not.toHaveBeenCalled()});
it('requires a real order identifier before preparation',async()=>{mockAuth.mockResolvedValue({user:{role:'admin'}});expect((await prepareSupplierFundingReviewAction('wrong')).success).toBe(false);expect(mockPrepare).not.toHaveBeenCalled()});
it('returns review-only evidence to an admin without claiming paid',async()=>{mockAuth.mockResolvedValue({user:{role:'admin'}});mockPrepare.mockResolvedValue({reviewOnly:true,payId:'TEST'});const r=await prepareSupplierFundingReviewAction('00000000-0000-4000-8000-000000000001');expect(r).toMatchObject({success:true,quote:{reviewOnly:true}});expect(r.message).toContain('No payment made')});
it('reports uncertain preparation without a second attempt',async()=>{mockAuth.mockResolvedValue({user:{role:'admin'}});mockPrepare.mockRejectedValue(Error('Supplier outcome uncertain'));expect(await prepareSupplierFundingReviewAction('00000000-0000-4000-8000-000000000001')).toMatchObject({success:false,message:'Supplier outcome uncertain'});expect(mockPrepare).toHaveBeenCalledTimes(1)});
