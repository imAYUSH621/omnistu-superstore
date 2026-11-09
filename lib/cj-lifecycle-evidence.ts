import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {SupplierOrderPlan} from './supplier-order-plan';
const text=z.string().trim().min(1).max(500);
const detailSchema=z.object({orderId:text,orderNum:text,shippingZip:z.string().optional(),shippingCountryCode:text,shippingProvince:text,shippingCity:text,shippingPhone:text,shippingAddress:text,shippingCustomerName:text,fromCountryCode:text,logisticName:text,storageId:z.string().nullable().optional(),isSandbox:z.literal(0),orderStatus:z.enum(['CREATED','IN_CART','UNPAID','UNSHIPPED','SHIPPED','DELIVERED','CANCELLED']),paymentDate:z.string().nullable(),outWarehouseTime:z.string().nullable().optional(),currency:z.literal('USD'),orderAmount:z.union([z.string(),z.number()]),trackNumber:z.string().nullable(),trackingProvider:z.string().nullable(),productList:z.array(z.object({vid:text,quantity:z.number().int().positive(),storeLineItemId:text})).min(1)});
const trackSchema=z.object({trackingNumber:text,trackingFrom:text,trackingTo:text,trackingStatus:text,deliveryTime:z.string().nullable().optional()});
function utc(s:string|null|undefined){if(!s)return null;const iso=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)?s.replace(' ','T')+'Z':s;if(!/Z$|[+-]\d\d:\d\d$/.test(iso))return null;const d=new Date(iso);return Number.isFinite(d.getTime())?d:null;}
export type CJLifecycleEvidence={state:'UNPAID'|'AWAITING_FUNDING_REVIEW'|'FUNDED_AWAITING_SHIPMENT'|'SHIPPED'|'DELIVERED'|'CANCELLED';supplierOrderId:string;trackingNumber:string|null;carrier:string|null;deliveredAt:string|null;dispatchedAt:string|null;providerAmountUsd:string;providerStatus:string};
/** A response is evidence only when read from the authenticated provider by the
 * server adapter. Pure validation cannot authenticate supplied JSON. No spend. */
export function inspectCJOrderIdentity(plan:SupplierOrderPlan,supplierOrderId:string,raw:unknown,now:Date){
 const s=detailSchema.parse(raw),a=plan.address,first=plan.lines[0]?.snapshot;
 if(!first||!Number.isFinite(now.getTime())||!([1,2]as unknown[]).includes(first.cjShippingMode)||plan.lines.some(l=>l.snapshot.provider!=='CJ'||l.snapshot.originCountry!==first.originCountry||l.snapshot.shippingMethod!==first.shippingMethod||l.snapshot.warehouseId!==first.warehouseId)||s.orderId!==supplierOrderId||s.shippingCountryCode!==a.country||s.shippingProvince!==a.state||s.shippingCity!==a.city||s.shippingPhone!==a.phone||s.shippingAddress!==a.streetAddress||s.shippingCustomerName!==a.fullName||s.fromCountryCode!==first.originCountry||s.logisticName!==first.shippingMethod||(first.cjShippingMode===1&&s.storageId!==first.warehouseId))throw Error('Supplier order identity requires review');
 if(s.productList.length!==plan.lines.length||new Set(s.productList.map(l=>l.storeLineItemId)).size!==s.productList.length||s.productList.some(p=>!plan.lines.some(l=>l.lineKey===p.storeLineItemId&&l.snapshot.providerVariantId===p.vid&&l.qty===p.quantity)))throw Error('Supplier product lines require review');
 const amount=String(s.orderAmount);if(!/^\d+(\.\d{1,2})?$/.test(amount)||!Number.isSafeInteger(Math.round(Number(amount)*100)))throw Error('Supplier amount requires review');
 return s;
}
export function assessCJLifecycle(plan:SupplierOrderPlan,supplierOrderId:string,raw:unknown,tracking:unknown,now:Date):CJLifecycleEvidence{
 const s=inspectCJOrderIdentity(plan,supplierOrderId,raw,now),a=plan.address,amount=String(s.orderAmount);
 const out:CJLifecycleEvidence={state:'UNPAID',supplierOrderId:s.orderId,trackingNumber:null,carrier:null,deliveredAt:null,dispatchedAt:null,providerAmountUsd:amount,providerStatus:s.orderStatus};
 if(s.orderStatus==='CANCELLED')return {...out,state:'CANCELLED'};
 if(['CREATED','IN_CART','UNPAID'].includes(s.orderStatus)){if(s.paymentDate)throw Error('Conflicting supplier payment evidence');return {...out,state:s.orderStatus==='CREATED'?'UNPAID':'AWAITING_FUNDING_REVIEW'};}
 const paid=utc(s.paymentDate);if(!paid||paid>now)throw Error('Supplier payment not confirmed');
 if(s.orderStatus==='UNSHIPPED')return {...out,state:'FUNDED_AWAITING_SHIPMENT'};
 // CJ documents orderNum as its order name, not the merchant orderNumber.
 // Use the persisted accepted CJ orderId. Do not invent postal verification:
 // its published detail schema omits shippingZip, so absence blocks delivery.
 if(s.shippingZip!==a.postalCode)throw Error('Supplier destination postal evidence unavailable; delivery requires review');
 const shipped=utc(s.outWarehouseTime);if(!shipped||shipped>now||shipped<paid||!s.trackNumber?.trim()||!s.trackingProvider?.trim())throw Error('Supplier shipment not confirmed');
 out.state='SHIPPED';out.trackingNumber=s.trackNumber;out.carrier=s.trackingProvider;out.dispatchedAt=shipped.toISOString();
 if(s.orderStatus==='DELIVERED'){
  const t=trackSchema.parse(tracking),delivered=utc(t.deliveryTime);
  if(t.trackingNumber!==s.trackNumber||t.trackingFrom!==s.fromCountryCode||t.trackingTo!==s.shippingCountryCode||t.trackingStatus!=='Delivered'||!delivered||delivered<shipped||delivered>now)throw Error('Carrier delivery not confirmed');
  out.state='DELIVERED';out.deliveredAt=delivered.toISOString();
 }
 return out;
}
export const lifecycleResponseDigest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
