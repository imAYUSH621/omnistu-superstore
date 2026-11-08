/** Pure, non-writing preparation boundary. A valid plan is NOT publication approval.
 * Caller must recover real approval/source records; reference strings prove no authority.
 * Never derives retail prices, stock, category, image rights or variant labels. */
import {z}from 'zod';
import {parseRetailSnapshot,retailSnapshotIdentity}from './offers/retail-snapshot';
import {stockEvidencePayload,freightEvidencePayload,retailApprovalPayload}from './offers/catalog-evidence-schema';
const ref=z.string().trim().min(1).max(500);
const source=z.object({ref,observedAt:z.string().datetime()}).strict();
const copy=z.object({productId:z.string().uuid(),name:ref,category:ref,description:ref,approval:source}).strict();
const variant=z.object({productId:z.string().uuid(),variantId:z.string().uuid(),providerVariantId:ref,sku:ref,label:ref,source}).strict();
const carrierSchema=z.object({providerProductId:ref,providerVariantId:ref,warehouseId:ref,country:ref,postal:ref,method:ref,source}).strict();
const publicationSchema=z.object({productId:z.string().uuid(),variantId:z.string().uuid(),snapshotId:ref,source}).strict();
const image=z.object({url:z.string().url().refine(v=>new URL(v).protocol==='https:'),productId:z.string().uuid(),providerProductId:ref,source,usageApproval:source}).strict();
export type CatalogPlanResult={status:'HOLD';reasons:string[];writes:false;publish:false}|{status:'PREPARED_ONLY';writes:false;publish:false;identity:{lineKey:string;snapshotId:string};product:{id:string;name:string;category:string;description:string;images:string[]};variant:{id:string;sku:string;label:string;providerVariantId:string};route:{country:string;postal:string;method:string;quantity:number};retailUnitCents:number;currency:'USD';availableQty:number;refs:string[]};
export function prepareQualifiedCatalogRow(input:{snapshot:unknown;stock:unknown;freight:unknown;retail:unknown;copy:unknown;variant:unknown;images:unknown[];carrierReview:unknown;publicationReview:unknown;now:Date;maxAgeMs:number}):CatalogPlanResult{
 const reasons:string[]=[];const hold=():CatalogPlanResult=>({status:'HOLD',reasons,writes:false,publish:false});
 let s;try{s=parseRetailSnapshot(input.snapshot,input.now,input.maxAgeMs)}catch{reasons.push('SNAPSHOT_INVALID_OR_STALE');return hold()}
 const st=stockEvidencePayload.safeParse(input.stock),f=freightEvidencePayload.safeParse(input.freight),r=retailApprovalPayload.safeParse(input.retail),c=copy.safeParse(input.copy),v=variant.safeParse(input.variant),carrier=carrierSchema.safeParse(input.carrierReview),publication=publicationSchema.safeParse(input.publicationReview);
 const imgs=(Array.isArray(input.images)?input.images:[]).map(x=>image.safeParse(x));
 if(!st.success)reasons.push('STOCK_EVIDENCE_REQUIRED');if(!f.success)reasons.push('FREIGHT_EVIDENCE_REQUIRED');if(!r.success)reasons.push('RETAIL_APPROVAL_REQUIRED');if(!c.success)reasons.push('PRODUCT_COPY_REVIEW_REQUIRED');if(!v.success)reasons.push('EXACT_VARIANT_MAPPING_REQUIRED');if(!imgs.length||imgs.some(x=>!x.success))reasons.push('PRODUCT_ASSET_EVIDENCE_REQUIRED');if(!carrier.success)reasons.push('CARRIER_REVIEW_REQUIRED');if(!publication.success)reasons.push('PUBLICATION_REVIEW_REQUIRED');
 if(reasons.length)return hold();
 if(!st.success||!f.success||!r.success||!c.success||!v.success||!carrier.success||!publication.success)return hold();
 const stock=st.data,freight=f.data,retail=r.data,product=c.data,opt=v.data,images=imgs.flatMap(x=>x.success?[x.data]:[]);
 const fresh=(date:string)=>{const t=Date.parse(date);return t<=input.now.getTime()&&input.now.getTime()-t<=input.maxAgeMs};
 if(![stock.observedAt,freight.observedAt,retail.observedAt,opt.source.observedAt].every(fresh))reasons.push('SOURCE_EVIDENCE_STALE_OR_FUTURE');
 if(stock.provider!==s.provider||stock.providerProductId!==s.providerProductId||stock.providerVariantId!==s.providerVariantId||stock.warehouseId!==s.warehouseId||stock.warehouseReadyQty!==s.availableQty||stock.observedAt!==s.observedAt)reasons.push('STOCK_TUPLE_MISMATCH');
 if(freight.provider!==s.provider||freight.providerProductId!==s.providerProductId||freight.providerVariantId!==s.providerVariantId||freight.warehouseId!==s.warehouseId||freight.destinationCountry!==s.destinationCountry||freight.destinationPostal!==s.destinationPostal||freight.shippingMethod!==s.shippingMethod||freight.freightQuotedQty!==s.freightQuotedQty||freight.shippingQuoteCents!==s.shippingQuoteCents||freight.currency!==s.currency)reasons.push('FREIGHT_TUPLE_MISMATCH');
 if(retail.productId!==s.productId||retail.variantId!==s.variantId||retail.retailUnitCents!==s.retailUnitCents||retail.currency!==s.currency)reasons.push('RETAIL_APPROVAL_MISMATCH');
 if(product.productId!==s.productId||opt.productId!==s.productId||opt.variantId!==s.variantId||opt.providerVariantId!==s.providerVariantId)reasons.push('PRODUCT_VARIANT_IDENTITY_MISMATCH');
 if(images.some(x=>x.productId!==s.productId||x.providerProductId!==s.providerProductId))reasons.push('ASSET_IDENTITY_MISMATCH');
 if([product.approval,carrier.data.source,publication.data.source,...images.flatMap(x=>[x.source,x.usageApproval])].some(x=>Date.parse(x.observedAt)>input.now.getTime()))reasons.push('REVIEW_IN_FUTURE');
 if(carrier.data.providerProductId!==s.providerProductId||carrier.data.providerVariantId!==s.providerVariantId||carrier.data.warehouseId!==s.warehouseId||carrier.data.country!==s.destinationCountry||carrier.data.postal!==s.destinationPostal||carrier.data.method!==s.shippingMethod)reasons.push('CARRIER_REVIEW_TUPLE_MISMATCH');
 if(publication.data.productId!==s.productId||publication.data.variantId!==s.variantId||publication.data.snapshotId!==retailSnapshotIdentity(s).snapshotId)reasons.push('PUBLICATION_REVIEW_TUPLE_MISMATCH');
 if(reasons.length)return hold();
 return{status:'PREPARED_ONLY',writes:false,publish:false,identity:retailSnapshotIdentity(s),product:{id:s.productId,name:product.name,category:product.category,description:product.description,images:[...new Set(images.map(x=>x.url))]},variant:{id:s.variantId,sku:opt.sku,label:opt.label,providerVariantId:s.providerVariantId},route:{country:s.destinationCountry,postal:s.destinationPostal,method:s.shippingMethod,quantity:s.freightQuotedQty},retailUnitCents:s.retailUnitCents,currency:s.currency,availableQty:s.availableQty,refs:[product.approval.ref,opt.source.ref,carrier.data.source.ref,publication.data.source.ref,retail.approvalRef,stock.routeEvidence,...images.flatMap(x=>[x.source.ref,x.usageApproval.ref])]};
}

/** Whole batch prepares atomically; duplicate exact identities/SKUs must be resolved,
 * never overwrite or silently choose a row. This function does not call a database. */
export function prepareQualifiedCatalogBatch(rows:Parameters<typeof prepareQualifiedCatalogRow>[0][]):{status:'HOLD'|'PREPARED_ONLY';rows:CatalogPlanResult[];reasons:string[];writes:false;publish:false}{
 const plans=rows.map(prepareQualifiedCatalogRow),reasons:string[]=[];
 if(!plans.length)reasons.push('EMPTY_BATCH');
 if(plans.some(p=>p.status==='HOLD'))reasons.push('ROW_REQUIRES_REVIEW');
 const keys=new Set<string>(),skus=new Map<string,string>();
 for(const p of plans){if(p.status!=='PREPARED_ONLY')continue;
  if(keys.has(p.identity.lineKey))reasons.push('DUPLICATE_OFFER_IDENTITY');keys.add(p.identity.lineKey);
  const prior=skus.get(p.variant.sku);if(prior&&prior!==p.variant.id)reasons.push('SKU_VARIANT_CONFLICT');skus.set(p.variant.sku,p.variant.id);
 }
 return{status:reasons.length?'HOLD':'PREPARED_ONLY',rows:plans,reasons:[...new Set(reasons)],writes:false,publish:false};
}
