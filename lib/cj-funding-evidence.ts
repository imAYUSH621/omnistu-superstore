import {z} from 'zod';
const id=z.string().trim().min(1).max(200);
const empty=z.array(z.unknown()).max(0);
const money=z.union([z.string(),z.number()]).transform(v=>String(v)).refine(v=>/^\d+(\.\d{1,2})?$/.test(v)&&Number.isSafeInteger(Math.round(Number(v)*100)),'Exact non-negative USD amount required');
export function addedSingleOrder(raw:unknown,supplierOrderId:string){const s=z.object({successCount:z.literal(1),addSuccessOrders:z.array(id).length(1),unInterceptAddressCount:z.literal(0),interceptOrders:empty}).parse(raw);if(s.addSuccessOrders[0]!==supplierOrderId)throw Error('Supplier cart order set requires review');}
const confirmation=z.object({successCount:z.literal(1),submitSuccess:z.literal(true),shipmentsId:id,result:z.literal(0),interceptOrders:empty,unMatchOrderCodes:empty.optional(),unMatchProductCodes:empty.optional()});
/** Pure contract validators. Server-authenticated responses only; caller JSON is
 * not supplier evidence or authority. No final total is calculated from retail. */
export function confirmedSingleShipment(raw:unknown){return confirmation.parse(raw).shipmentsId;}
const payment=z.object({actualPayment:money,payableAmount:money,balanceDeduction:money,billAmount:money,commodityDiscount:money,commodityTotalAmount:money,couponAmount:money,freight:money,iossAmount:money,iossTaxHandlingFee:money,iossTaxes:money,orderOriginalAmount:money,orderProductAmount:money,postageDiscount:money,serviceFee:money,canDeduct:z.boolean()});
const parent=z.object({orderMoney:money,payId:id,payExpireTime:z.string().min(1).max(100),result:z.literal(0),submitSuccess:z.literal(true),successOrders:z.array(id).length(1),unMatchOrderCodes:empty,unMatchProductCodes:empty,interceptOrders:empty,paymentInformation:payment});
export type SupplierFundingQuote={currency:'USD';supplierOrderId:string;shipmentOrderId:string;payId:string;payExpireTime:string;orderMoney:string;paymentInformation:z.infer<typeof payment>;reviewOnly:true;expiryTimezoneVerified:false};
export function supplierFundingQuote(raw:unknown,supplierOrderId:string,shipmentOrderId:string):SupplierFundingQuote{
 const s=parent.parse(raw);if(s.successOrders[0]!==supplierOrderId)throw Error('Final payment quote order set requires review');
 if(Number(s.paymentInformation.payableAmount)<=0||s.paymentInformation.actualPayment!==s.paymentInformation.payableAmount||Number(s.paymentInformation.couponAmount)!==0)throw Error('Final payment amount semantics require review');
 // The endpoint's expiry example has no timezone contract. Preserve it as
 // supplier text, never invent UTC or convert it into permission to pay.
 return {currency:'USD',supplierOrderId,shipmentOrderId,payId:s.payId,payExpireTime:s.payExpireTime,orderMoney:s.orderMoney,paymentInformation:s.paymentInformation,reviewOnly:true,expiryTimezoneVerified:false};
}
