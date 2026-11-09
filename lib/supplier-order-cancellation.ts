import {supplierPlanDigest,type SupplierOrderPlan} from './supplier-order-plan';
import type {RetailRawTx} from './retail/transactions';
/** Unpaid, unattempted order cancellation only. Never a refund, provider cancel,
 * stale-payment cleanup or a way to clear an uncertain financial effect. Caller
 * is trusted server code and must authenticate the owner before entering. */
export async function cancelUnattemptedSupplierOrderTx(tx:RetailRawTx,input:{orderId:string;userId:string}){
 const rows=await tx.$queryRaw<{id:string;userId:string;isPaid:boolean;paymentNote:string|null;paymentResult:unknown}[]>`SELECT id,"userId","isPaid","paymentNote","paymentResult" FROM "Order" WHERE id=${input.orderId}::uuid FOR UPDATE`;
 const order=rows[0];if(rows.length!==1||order.userId!==input.userId)throw Error('Order unavailable');
 const cancelled=order.paymentNote?.includes('SUPPLIER_ORDER_CANCELLED')===true;
 if(order.isPaid)throw Error('Paid order cancellation requires review');
 if(order.isPaid||order.paymentResult!==null||/PAYPAL_CREATE_REQUESTED|CAPTURE|STRIPE_|AMOUNT_MISMATCH|CURRENCY_MISMATCH/.test(order.paymentNote||''))throw Error('Payment outcome needs review before cancellation');
 if(cancelled)return{cancelled:true,replayed:true};
 const plans=await tx.$queryRaw<{plan:SupplierOrderPlan;digest:string}[]>`SELECT plan,digest FROM "OrderSupplierPlan" WHERE "orderId"=${input.orderId}::uuid`;
 const allocations=await tx.$queryRaw<{lineKey:string;qty:number;state:string}[]>`SELECT "lineKey",qty,state FROM "OrderSupplierAllocation" WHERE "orderId"=${input.orderId}::uuid ORDER BY "lineKey" FOR UPDATE`;
 if(plans.length!==1||supplierPlanDigest(plans[0].plan)!==plans[0].digest||plans[0].plan.userId!==input.userId||plans[0].plan.orderId!==input.orderId||allocations.length!==plans[0].plan.lines.length||allocations.some(a=>a.state!=='HELD'||!plans[0].plan.lines.some(l=>l.lineKey===a.lineKey&&l.qty===a.qty)))throw Error('Exact held allocation requires review');
 const attempts=await tx.$queryRaw<{state:string}[]>`SELECT state FROM "OrderSupplierAttempt" WHERE "orderId"=${input.orderId}::uuid`;if(attempts.length)throw Error('Supplier attempt requires review');
 for(const allocation of allocations){const line=plans[0].plan.lines.find(l=>l.lineKey===allocation.lineKey)!;
  const count=await tx.$executeRaw`UPDATE "RetailOffer" SET "availableQty"="availableQty"+${allocation.qty} WHERE "lineKey"=${line.lineKey} AND "snapshotId"=${line.snapshotId} AND "availableQty"+${allocation.qty}<=(snapshot->>'availableQty')::integer`;
  if(count!==1)throw Error('Changed supplier offer requires reviewed allocation recovery');
 }
 await tx.$executeRaw`UPDATE "OrderSupplierAllocation" SET state='RELEASED' WHERE "orderId"=${input.orderId}::uuid AND state='HELD'`;
 const note=[order.paymentNote,'SUPPLIER_ORDER_CANCELLED - no payment or supplier attempt; exact internal allocation released'].filter(Boolean).join(' | ');
 await tx.$executeRaw`UPDATE "Order" SET "paymentNote"=${note} WHERE id=${input.orderId}::uuid`;
 return{cancelled:true,replayed:false};
}
