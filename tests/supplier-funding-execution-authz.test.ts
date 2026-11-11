const mockAuth=jest.fn(),mockExecute=jest.fn(),mockReview=jest.fn();
jest.mock('@/auth',()=>({auth:()=>mockAuth()}));
jest.mock('@/lib/supplier-funding-execution',()=>({executeSupplierFunding:(...a:unknown[])=>mockExecute(...a),reviewSupplierFundingExecution:(...a:unknown[])=>mockReview(...a)}));
import{executeSupplierFundingAction,reviewSupplierFundingExecutionAction}from'@/lib/actions/supplier-funding.actions';
beforeEach(()=>{mockAuth.mockReset();mockExecute.mockReset();mockReview.mockReset()});
it('denies guests and customer roles before any supplier execution',async()=>{
 for(const session of[null,{user:{role:'user'}},{user:{id:'u1',role:'user'}}]){
  mockAuth.mockResolvedValue(session);
  expect(await executeSupplierFundingAction('00000000-0000-4000-8000-000000000001','3.00')).toMatchObject({success:false,message:'User is not authorized'});
  expect(await reviewSupplierFundingExecutionAction('00000000-0000-4000-8000-000000000001')).toMatchObject({success:false,message:'User is not authorized'});
 }
 expect(mockExecute).not.toHaveBeenCalled();expect(mockReview).not.toHaveBeenCalled();
});
it('requires a real order identifier and an exact amount',async()=>{
 mockAuth.mockResolvedValue({user:{id:'00000000-0000-4000-8000-0000000000aa',role:'admin'}});
 expect((await executeSupplierFundingAction('wrong','3.00')).success).toBe(false);
 expect((await executeSupplierFundingAction('00000000-0000-4000-8000-000000000001','not-money')).success).toBe(false);
 expect(mockExecute).not.toHaveBeenCalled();
});
it('passes the admin identity and exact amount through once, and reports held states verbatim',async()=>{
 mockAuth.mockResolvedValue({user:{id:'00000000-0000-4000-8000-0000000000aa',role:'admin'}});
 mockExecute.mockResolvedValue({state:'PAY_UNKNOWN',message:'Supplier payment outcome unconfirmed',shipmentOrderId:'S',payId:'P',attempts:1});
 const r=await executeSupplierFundingAction('00000000-0000-4000-8000-000000000001','3.00');
 expect(r).toMatchObject({success:true,state:'PAY_UNKNOWN'});
 expect(mockExecute).toHaveBeenCalledTimes(1);
 expect(mockExecute).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000001','3.00','00000000-0000-4000-8000-0000000000aa');
 mockReview.mockResolvedValue({state:'PAID',message:'confirmed',shipmentOrderId:'S',payId:'P',attempts:1});
 expect(await reviewSupplierFundingExecutionAction('00000000-0000-4000-8000-000000000001')).toMatchObject({success:true,state:'PAID'});
});
it('a rejected execution is reported without a second attempt',async()=>{
 mockAuth.mockResolvedValue({user:{id:'00000000-0000-4000-8000-0000000000aa',role:'admin'}});
 mockExecute.mockRejectedValue(Error('Supplier funding execution is OFF'));
 expect(await executeSupplierFundingAction('00000000-0000-4000-8000-000000000001','3.00')).toMatchObject({success:false,message:'Supplier funding execution is OFF'});
 expect(mockExecute).toHaveBeenCalledTimes(1);
});
