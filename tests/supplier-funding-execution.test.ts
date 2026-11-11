import{approvedAmountCents,classifyPayBalanceResponse,classifyFundingState,quoteMatchesReviewedApproval}from'../lib/supplier-funding-execution';
import type{SupplierFundingQuote}from'../lib/cj-funding-evidence';
const payment={actualPayment:'3.00',payableAmount:'3.00',balanceDeduction:'3.00',billAmount:'3.00',commodityDiscount:'0.00',commodityTotalAmount:'1.00',couponAmount:'0.00',freight:'2.00',iossAmount:'0.00',iossTaxHandlingFee:'0.00',iossTaxes:'0.00',orderOriginalAmount:'3.00',orderProductAmount:'1.00',postageDiscount:'0.00',serviceFee:'0.00',canDeduct:true};
const quote=(over:Partial<SupplierFundingQuote>={},pay:Partial<typeof payment>={}):SupplierFundingQuote=>({currency:'USD',supplierOrderId:'SD_1',shipmentOrderId:'SHIP_1',payId:'PAY_1',payExpireTime:'2026-11-12 00:00:00',orderMoney:'3.00',paymentInformation:{...payment,...pay},reviewOnly:true,expiryTimezoneVerified:false,...over});
test('approved amount must be exact positive USD cents',()=>{
 expect(approvedAmountCents('3.00')).toBe(300);expect(approvedAmountCents('0.01')).toBe(1);expect(approvedAmountCents('12')).toBe(1200);
 for(const bad of['0','0.00','-1','1.234','abc','1e3','','3.0.0','3,00'])expect(()=>approvedAmountCents(bad)).toThrow();
});
test('pay response success requires explicit result without error code',()=>{
 expect(classifyPayBalanceResponse({result:true,code:200})).toEqual({kind:'success'});
 expect(classifyPayBalanceResponse({result:true})).toEqual({kind:'success'});
 expect(classifyPayBalanceResponse({result:false,code:1600100,message:'Parameter error'})).toEqual({kind:'error',expirySignalled:false});
 expect(classifyPayBalanceResponse({result:false,message:'The payment has expired, please regenerate'})).toEqual({kind:'error',expirySignalled:true});
 expect(classifyPayBalanceResponse({result:true,code:500})).toEqual({kind:'error',expirySignalled:false});
 expect(classifyPayBalanceResponse(null)).toEqual({kind:'error',expirySignalled:false});
 expect(classifyPayBalanceResponse({success:true,result:false})).toEqual({kind:'error',expirySignalled:false});
});
test('paid is only an explicit funded state; cancelled and unpaid stay distinct',()=>{
 expect(classifyFundingState('UNPAID')).toBe('UNPAID');
 expect(classifyFundingState('AWAITING_FUNDING_REVIEW')).toBe('UNPAID');
 expect(classifyFundingState('CANCELLED')).toBe('CANCELLED');
 expect(classifyFundingState('FUNDED_AWAITING_SHIPMENT')).toBe('PAID');
 expect(classifyFundingState('SHIPPED')).toBe('PAID');
 expect(classifyFundingState('DELIVERED')).toBe('PAID');
});
test('a regenerated quote keeps approval only for the same parent with identical amounts',()=>{
 const reviewed=quote();
 expect(()=>quoteMatchesReviewedApproval(reviewed,quote({payId:'PAY_2',payExpireTime:'2026-11-13 00:00:00'}),300)).not.toThrow();
 expect(()=>quoteMatchesReviewedApproval(reviewed,quote({shipmentOrderId:'SHIP_OTHER'}),300)).toThrow(/different parent/);
 expect(()=>quoteMatchesReviewedApproval(reviewed,quote({supplierOrderId:'SD_OTHER'}),300)).toThrow(/different parent/);
 expect(()=>quoteMatchesReviewedApproval(reviewed,quote({orderMoney:'3.01'}),300)).toThrow(/total changed/);
 expect(()=>quoteMatchesReviewedApproval(reviewed,quote({},{freight:'2.50'}),300)).toThrow(/amounts changed/);
 expect(()=>quoteMatchesReviewedApproval(reviewed,quote({},{payableAmount:'3.01',actualPayment:'3.01'}),300)).toThrow(/amounts changed/);
 expect(()=>quoteMatchesReviewedApproval(reviewed,quote(),301)).toThrow(/exact approved amount/);
 expect(()=>quoteMatchesReviewedApproval(reviewed,quote({},{canDeduct:false}),300)).toThrow(/balance cannot cover/);
});
