const mockAuth=jest.fn(),mockExecute=jest.fn(),mockReview=jest.fn(),mockRecord=jest.fn();
jest.mock('@/auth',()=>({auth:()=>mockAuth()}));
jest.mock('@/lib/supplier-funding-execution',()=>({executeSupplierFunding:(...a:unknown[])=>mockExecute(...a),reviewSupplierFundingExecution:(...a:unknown[])=>mockReview(...a),recordSupplierFundingApproval:(...a:unknown[])=>mockRecord(...a)}));
import{executeSupplierFundingAction,reviewSupplierFundingExecutionAction,recordSupplierFundingApprovalAction}from'@/lib/actions/supplier-funding.actions';
const OID='00000000-0000-4000-8000-000000000001';
beforeEach(()=>{mockAuth.mockReset();mockExecute.mockReset();mockReview.mockReset();mockRecord.mockReset()});
it('denies guests and customer roles before any supplier execution path',async()=>{
 for(const session of[null,{user:{role:'user'}},{user:{id:'u1',role:'user'}}]){
  mockAuth.mockResolvedValue(session);
  expect(await executeSupplierFundingAction(OID)).toMatchObject({success:false,message:'User is not authorized'});
  expect(await reviewSupplierFundingExecutionAction(OID)).toMatchObject({success:false,message:'User is not authorized'});
  expect(await recordSupplierFundingApprovalAction(OID,'wamid.TEST_EVIDENCE')).toMatchObject({success:false,message:'User is not authorized'});
 }
 expect(mockExecute).not.toHaveBeenCalled();expect(mockReview).not.toHaveBeenCalled();expect(mockRecord).not.toHaveBeenCalled();
});
it('requires a real order identifier on every path',async()=>{
 mockAuth.mockResolvedValue({user:{id:'admin-1',role:'admin'}});
 expect((await executeSupplierFundingAction('wrong')).success).toBe(false);
 expect((await reviewSupplierFundingExecutionAction('wrong')).success).toBe(false);
 expect((await recordSupplierFundingApprovalAction('wrong','wamid.TEST_EVIDENCE')).success).toBe(false);
 expect(mockExecute).not.toHaveBeenCalled();expect(mockReview).not.toHaveBeenCalled();expect(mockRecord).not.toHaveBeenCalled();
});
it('execution and review pass only the order through once; no caller input reaches the spend path',async()=>{
 mockAuth.mockResolvedValue({user:{id:'admin-1',role:'admin'}});
 mockExecute.mockResolvedValue({state:'PAY_UNKNOWN',message:'unconfirmed',shipmentOrderId:'S',payId:'P',attempts:1});
 expect(await executeSupplierFundingAction(OID)).toMatchObject({success:true,state:'PAY_UNKNOWN'});
 expect(mockExecute).toHaveBeenCalledTimes(1);expect(mockExecute).toHaveBeenCalledWith(OID);
 mockReview.mockResolvedValue({state:'PAID',message:'confirmed',shipmentOrderId:'S',payId:'P',attempts:1});
 expect(await reviewSupplierFundingExecutionAction(OID)).toMatchObject({success:true,state:'PAID'});
 expect(mockReview).toHaveBeenCalledTimes(1);expect(mockReview).toHaveBeenCalledWith(OID);
});
it('approval recording passes only the order, the owner evidence reference and the admin identity',async()=>{
 mockAuth.mockResolvedValue({user:{id:'admin-1',role:'admin'}});
 mockRecord.mockResolvedValue({quoteDigest:'D',approvedAmountUsd:'3.00',evidenceRef:'wamid.TEST_EVIDENCE',createdAt:'2026-11-11T00:00:00.000Z'});
 const r=await recordSupplierFundingApprovalAction(OID,'wamid.TEST_EVIDENCE');
 expect(r).toMatchObject({success:true,approval:{approvedAmountUsd:'3.00',evidenceRef:'wamid.TEST_EVIDENCE'}});
 expect(mockRecord).toHaveBeenCalledTimes(1);expect(mockRecord).toHaveBeenCalledWith(OID,'wamid.TEST_EVIDENCE','admin-1');
});
it('a rejected execution is reported without a second attempt',async()=>{
 mockAuth.mockResolvedValue({user:{id:'admin-1',role:'admin'}});
 mockExecute.mockRejectedValue(Error('No bound owner funding approval for this exact reviewed quote; execution is unavailable'));
 expect(await executeSupplierFundingAction(OID)).toMatchObject({success:false,message:'No bound owner funding approval for this exact reviewed quote; execution is unavailable'});
 expect(mockExecute).toHaveBeenCalledTimes(1);
});
