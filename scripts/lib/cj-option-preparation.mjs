// Offline, non-writing exact-option preparation shared by live-read staging and
// retained-source reconciliation. No publication, retail pricing or reservations.
import {parseCjReferenceNumber} from './cj-reference-number.mjs';
const id=v=>typeof v==='string'&&v.trim()&&v===v.trim()&&v.length<=200?v:null;
const quantity=v=>Number.isSafeInteger(v)&&v>=0?v:null;
const image=v=>{try{return typeof v==='string'&&new URL(v).protocol==='https:'?v:null}catch{return null}};
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(v)&&Number.isFinite(Date.parse(v));
export function prepareCjOptions({detail,inventory,detailObservedAt,inventoryObservedAt,reviews=[],now=new Date(),maxAgeMs=600000}){
 if(!detail||!id(detail.pid)||!Array.isArray(detail.variants)||!Array.isArray(inventory?.variantInventories)||!date(detailObservedAt)||!date(inventoryObservedAt)||!Number.isFinite(now.getTime())||!Number.isFinite(maxAgeMs)||maxAgeMs<=0)throw Error('INVALID_SOURCE_ENVELOPE');
 const fresh=t=>{const age=now.getTime()-Date.parse(t);return age>=0&&age<=maxAgeMs};
 const variants=new Map(),stock=new Map(),review=new Map(),skus=new Set();
 for(const v of detail.variants){if(!id(v?.vid)||v.pid!==detail.pid||variants.has(v.vid))throw Error('VARIANT_IDENTITY_CONFLICT');if(id(v.variantSku)&&skus.has(v.variantSku))throw Error('VARIANT_SKU_CONFLICT');if(id(v.variantSku))skus.add(v.variantSku);variants.set(v.vid,v)}
 for(const v of inventory.variantInventories){if(!id(v?.vid)||stock.has(v.vid)||!variants.has(v.vid)||!Array.isArray(v.inventory))throw Error('INVENTORY_IDENTITY_CONFLICT');stock.set(v.vid,v.inventory)}
 if(!Array.isArray(reviews))throw Error('INVALID_OPTION_REVIEW');
 for(const r of reviews){if(!r||r.pid!==detail.pid||!variants.has(r.vid)||review.has(r.vid)||typeof r.buyerLabel!=='string'||!r.buyerLabel.trim()||r.buyerLabel.length>200||!id(r.sourceRef)||!date(r.observedAt)||Date.parse(r.observedAt)>now.getTime())throw Error('INVALID_OPTION_REVIEW');review.set(r.vid,r)}
 const options=[];
 for(const [vid,v]of variants){
  const reasons=['RETAIL_APPROVAL_REQUIRED','DESTINATION_FREIGHT_REQUIRED','MERCHANT_COSTS_REQUIRED','PUBLICATION_REVIEW_REQUIRED'];
  const r=review.get(vid),cost=parseCjReferenceNumber(v.variantSellPrice),url=image(v.variantImage);
  if(!fresh(detailObservedAt)||!fresh(inventoryObservedAt))reasons.push('SOURCE_STALE_OR_FUTURE');
  if(!r)reasons.push('BUYER_OPTION_REVIEW_REQUIRED');
  if(cost===null)reasons.push('EXACT_VARIANT_COST_REQUIRED');
  if(!id(v.variantSku))reasons.push('SUPPLIER_SKU_REQUIRED');
  if(!url)reasons.push('EXACT_VARIANT_IMAGE_REQUIRED');
  reasons.push('IMAGE_USAGE_REVIEW_REQUIRED');
  const origins=[];const countries=new Set();
  for(const row of stock.get(vid)??[]){
   if(typeof row?.countryCode!=='string'||!/^[A-Z]{2}$/.test(row.countryCode)||countries.has(row.countryCode))throw Error('INVENTORY_COUNTRY_CONFLICT');countries.add(row.countryCode);
   const warehouse=quantity(row.cjInventory),factory=quantity(row.factoryInventory),total=quantity(row.totalInventory);
   // Factory/total inventory never becomes warehouse-ready stock. A supplier-
   // shipped listing is still supplier-shipped even with positive CJ fields.
   const ready=row.verifiedWarehouse===1?warehouse:null;
   const kind=ready!==null&&ready>0?'WAREHOUSE_SNAPSHOT':factory!==null&&factory>0?'FACTORY_ONLY':ready===0&&factory===0?'ZERO_REPORTED':'UNKNOWN';
   origins.push({country:row.countryCode,warehouseQty:warehouse,factoryQty:factory,totalQty:total,verifiedWarehouse:row.verifiedWarehouse??null,warehouseReadyQty:ready,kind});
  }
  if(!origins.length)reasons.push('EXACT_VARIANT_STOCK_REQUIRED');
  if(!origins.some(o=>o.kind==='WAREHOUSE_SNAPSHOT'))reasons.push('WAREHOUSE_READY_STOCK_UNESTABLISHED');
  options.push({pid:detail.pid,vid,sku:id(v.variantSku),supplierOption:typeof v.variantKey==='string'?v.variantKey:null,buyerLabel:r?.buyerLabel.trim()??null,buyerReview:r?{sourceRef:r.sourceRef,observedAt:r.observedAt}:null,referenceCostUsd:cost,imageUrl:url,origins,fulfillmentListingType:typeof detail.productType==='string'?detail.productType:null,detailObservedAt,inventoryObservedAt,status:'HOLD',reasons,retailPrice:null,publish:false,writes:false});
 }
 return{pid:detail.pid,options,status:'HOLD',publish:false,writes:false};
}
