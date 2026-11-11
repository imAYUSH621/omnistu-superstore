const mockAuth=jest.fn(),mockExecute=jest.fn(),mockReview=jest.fn();
jest.mock('@/auth',()=>({auth:()=>mockAuth()}));
jest.mock('@/lib/supplier-funding-execution',()=>({executeSupplierFunding:(...a:unknown[])=>mockExecute(...a),reviewSupplierFundingExecution:(...a:unknown[])=>mockReview(...a)}));
import{executeSupplierFundingAction,reviewSupplierFundingExecutionAction}from'@/lib/actions/supplier-funding.actions';
import*as fundingActions from'@/lib/actions/supplier-funding.actions';
import{readFileSync}from'node:fs';
const OID='00000000-0000-4000-8000-000000000001';
beforeEach(()=>{mockAuth.mockReset();mockExecute.mockReset();mockReview.mockReset()});
it('denies guests and customer roles before any supplier execution path',async()=>{
 for(const session of[null,{user:{role:'user'}},{user:{id:'u1',role:'user'}}]){
  mockAuth.mockResolvedValue(session);
  expect(await executeSupplierFundingAction(OID)).toMatchObject({success:false,message:'User is not authorized'});
  expect(await reviewSupplierFundingExecutionAction(OID)).toMatchObject({success:false,message:'User is not authorized'});
 }
 expect(mockExecute).not.toHaveBeenCalled();expect(mockReview).not.toHaveBeenCalled();
});
it('no web-reachable path can mint spend authority: the approval journal has no server action, route or UI writer',()=>{
 expect(Object.keys(fundingActions).sort()).toEqual(['executeSupplierFundingAction','prepareSupplierFundingReviewAction','reviewSupplierFundingExecutionAction']);
 const source=readFileSync('lib/supplier-funding-execution.ts','utf8');
 expect(source).toContain('never from any HTTP route');
 expect(readFileSync('components/shared/order/supplier-funding-review.tsx','utf8')).not.toContain('Record owner approval');
 expect(readFileSync('scripts/record-supplier-funding-approval.ts','utf8')).toContain('operator');
});
it('requires a real order identifier on every path',async()=>{
 mockAuth.mockResolvedValue({user:{id:'admin-1',role:'admin'}});
 expect((await executeSupplierFundingAction('wrong')).success).toBe(false);
 expect((await reviewSupplierFundingExecutionAction('wrong')).success).toBe(false);
 expect(mockExecute).not.toHaveBeenCalled();expect(mockReview).not.toHaveBeenCalled();
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
it('a rejected execution is reported without a second attempt',async()=>{
 mockAuth.mockResolvedValue({user:{id:'admin-1',role:'admin'}});
 mockExecute.mockRejectedValue(Error('No bound owner funding approval for this exact reviewed quote; execution is unavailable'));
 expect(await executeSupplierFundingAction(OID)).toMatchObject({success:false,message:'No bound owner funding approval for this exact reviewed quote; execution is unavailable'});
 expect(mockExecute).toHaveBeenCalledTimes(1);
});
