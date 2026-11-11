import{quoteApprovalDigest,classifyPayBalanceResponse,classifyFundingState,quoteMatchesReviewedApproval}from'../lib/supplier-funding-execution';
import type{SupplierFundingQuote}from'../lib/cj-funding-evidence';
const payment={actualPayment:'3.00',payableAmount:'3.00',balanceDeduction:'3.00',billAmount:'3.00',commodityDiscount:'0.00',commodityTotalAmount:'1.00',couponAmount:'0.00',freight:'2.00',iossAmount:'0.00',iossTaxHandlingFee:'0.00',iossTaxes:'0.00',orderOriginalAmount:'3.00',orderProductAmount:'1.00',postageDiscount:'0.00',serviceFee:'0.00',canDeduct:true};
const quote=(over:Partial<SupplierFundingQuote>={},pay:Partial<typeof payment>={}):SupplierFundingQuote=>({currency:'USD',supplierOrderId:'SD_1',shipmentOrderId:'SHIP_1',payId:'PAY_1',payExpireTime:'2026-11-12 00:00:00',orderMoney:'3.00',paymentInformation:{...payment,...pay},reviewOnly:true,expiryTimezoneVerified:false,...over});
test('quote approval digest binds parent identity and every money field, independent of key order and non-money metadata',()=>{
 const a=quote();
 expect(quoteApprovalDigest(a)).toBe(quoteApprovalDigest(quote({payId:'PAY_2',payExpireTime:'later'})));
 const roundTripped=JSON.parse(JSON.stringify(a));const shuffled={...roundTripped,paymentInformation:Object.fromEntries(Object.entries(roundTripped.paymentInformation).reverse())};
 expect(quoteApprovalDigest(shuffled)).toBe(quoteApprovalDigest(a));
 expect(quoteApprovalDigest(quote({shipmentOrderId:'SHIP_2'}))).not.toBe(quoteApprovalDigest(a));
 expect(quoteApprovalDigest(quote({orderMoney:'3.01'}))).not.toBe(quoteApprovalDigest(a));
 expect(quoteApprovalDigest(quote({},{freight:'2.50'}))).not.toBe(quoteApprovalDigest(a));
 expect(quoteApprovalDigest(quote({},{serviceFee:'0.01'}))).not.toBe(quoteApprovalDigest(a));
 expect(quoteApprovalDigest(quote({supplierOrderId:'SD_2'}))).not.toBe(quoteApprovalDigest(a));
});
test('pay response success requires explicit result without error code; every other shape is a vendor error, never proof of unpaid or paid',()=>{
 expect(classifyPayBalanceResponse({result:true,code:200})).toEqual({kind:'success'});
 expect(classifyPayBalanceResponse({result:true})).toEqual({kind:'success'});
 expect(classifyPayBalanceResponse({result:false,code:1600100,message:'Parameter error'})).toEqual({kind:'error'});
 expect(classifyPayBalanceResponse({result:false,message:'The payment has expired, please regenerate'})).toEqual({kind:'error'});
 expect(classifyPayBalanceResponse({result:true,code:500})).toEqual({kind:'error'});
 expect(classifyPayBalanceResponse(null)).toEqual({kind:'error'});
 expect(classifyPayBalanceResponse({success:true,result:false})).toEqual({kind:'error'});
});
test('paid is only an explicit funded state; cancelled and unpaid stay distinct',()=>{
 expect(classifyFundingState('UNPAID')).toBe('UNPAID');
 expect(classifyFundingState('AWAITING_FUNDING_REVIEW')).toBe('UNPAID');
 expect(classifyFundingState('CANCELLED')).toBe('CANCELLED');
 expect(classifyFundingState('FUNDED_AWAITING_SHIPMENT')).toBe('PAID');
 expect(classifyFundingState('SHIPPED')).toBe('PAID');
 expect(classifyFundingState('DELIVERED')).toBe('PAID');
});
test('a fresh quote matches the reviewed approval only for the same parent with identical amounts; field equality is integrity, not authority',()=>{
 const reviewed=quote();
 expect(()=>quoteMatchesReviewedApproval(reviewed,quote({payId:'PAY_2',payExpireTime:'2026-11-13 00:00:00'}))).not.toThrow();
 expect(()=>quoteMatchesReviewedApproval(reviewed,quote({shipmentOrderId:'SHIP_OTHER'}))).toThrow(/different parent/);
 expect(()=>quoteMatchesReviewedApproval(reviewed,quote({supplierOrderId:'SD_OTHER'}))).toThrow(/different parent/);
 expect(()=>quoteMatchesReviewedApproval(reviewed,quote({orderMoney:'3.01'}))).toThrow(/total changed/);
 expect(()=>quoteMatchesReviewedApproval(reviewed,quote({},{freight:'2.50'}))).toThrow(/amounts changed/);
 expect(()=>quoteMatchesReviewedApproval(reviewed,quote({},{payableAmount:'3.01',actualPayment:'3.01'}))).toThrow(/amounts changed/);
 expect(()=>quoteMatchesReviewedApproval(reviewed,quote({},{canDeduct:false}))).toThrow(/balance cannot cover/);
});
