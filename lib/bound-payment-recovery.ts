import type{RetailRawTx}from'./retail/transactions';
import{validateSupplierPaymentPlanTx}from'./supplier-order-plan';
import{needsPaymentReview}from'./payment-review';
export type BoundPaymentRecovery='READY'|'CANCELLED'|'PAID_RECORDED'|'PAYMENT_REVIEW'|'OFFER_REVIEW';
/** Inspect only. Never expire/reset a payment marker, call a provider, release
 * stock, infer failure, recapture, refund or claim money moved. Caller owns auth. */
export async function inspectBoundPaymentRecoveryTx(tx:RetailRawTx,input:{orderId:string;userId:string;now:Date;maxAgeMs:number}):Promise<BoundPaymentRecovery>{
 const orders=await tx.$queryRaw<{userId:string;isPaid:boolean;paymentNote:string|null;paymentResult:unknown}[]>`SELECT "userId","isPaid","paymentNote","paymentResult" FROM "Order" WHERE id=${input.orderId}::uuid FOR UPDATE`;
 const o=orders[0];if(orders.length!==1||o.userId!==input.userId)throw Error('Order unavailable');
 if(o.isPaid)return'PAID_RECORDED';
 if(needsPaymentReview(o.paymentNote))return'PAYMENT_REVIEW';
 if(o.paymentNote?.includes('SUPPLIER_ORDER_CANCELLED'))return'CANCELLED';
 try{await validateSupplierPaymentPlanTx(tx,input);return'READY'}catch{return o.paymentResult!==null?'PAYMENT_REVIEW':'OFFER_REVIEW'}
}
