import {createHash}from 'node:crypto';
import {z}from 'zod';
/** Separate from supplier reference-cost Offer. No default retail price, margin or freshness. */
const identity=z.string().min(1).max(200).refine(v=>v===v.trim());
const cents=z.number().int().nonnegative().safe();
/** Independently reviewed pre-order sourcing evidence, not provider order acceptance.
 * References must resolve to exact retained source records outside web-runtime
 * write access. Hashes and these fields cannot authenticate client assertions. */
const managedOrigin=z.object({kind:z.literal('CJ_MANAGED_ORIGIN'),assignment:z.literal('CJ_SELECTS_WAREHOUSE_WITHIN_APPROVED_ORIGIN'),availabilityConfirmationRef:identity,confirmedAvailableQty:z.number().int().positive().safe(),handlingMaxDays:z.number().int().nonnegative().max(365),stockEvidenceRef:identity,freightEvidenceRef:identity,fulfillmentTermsRef:identity,observedAt:z.string().datetime(),validUntil:z.string().datetime()}).strict();
const snapshotSchema=z.object({
 version:z.union([z.literal(1),z.literal(2)]),productId:z.string().uuid(),variantId:z.string().uuid(),
 provider:identity,providerProductId:identity,providerVariantId:identity,warehouseId:identity.optional(),managedOrigin:managedOrigin.optional(),
 destinationCountry:z.string().regex(/^[A-Z]{2}$/),destinationPostal:z.string().min(1).max(20),quoteId:identity,quoteRevision:identity,
 retailUnitCents:cents.refine(v=>v>0),currency:z.literal('USD'),
 supplierUnitCents:cents,shippingQuoteCents:cents,freightQuotedQty:z.number().int().positive().safe(),shippingMethod:identity,
 originCountry:z.string().regex(/^[A-Z]{2}$/).optional(),cjShippingMode:z.union([z.literal(1),z.literal(2)]).optional(),
 availableQty:z.number().int().positive().safe(),
 observedAt:z.string().datetime(),validUntil:z.string().datetime(),
 retailApprovalSource:identity,stockSource:identity,shippingSource:identity,
}).strict().superRefine((s,ctx)=>{
 if(s.version===1){if(!s.warehouseId||s.managedOrigin)ctx.addIssue({code:'custom',message:'Legacy exact warehouse evidence required'});return;}
 if(s.provider!=='CJ'||s.cjShippingMode!==2||s.warehouseId!==undefined||!s.originCountry||!s.managedOrigin)ctx.addIssue({code:'custom',message:'Explicit CJ-managed origin evidence required'});
});
export type RetailSnapshot=z.infer<typeof snapshotSchema>;
export type BoundRetailLine={lineKey:string;snapshotId:string;snapshot:RetailSnapshot;qty:number};
const fail=()=>{throw Error('Retail offer needs review')};
/** Stable, unambiguous tuple encoding. IDs are not concatenated with delimiters. */
function digest(values:unknown[]){return createHash('sha256').update(JSON.stringify(values)).digest('hex')}
function lineKey(s:RetailSnapshot){if(s.version===2)return digest([s.version,s.productId,s.variantId,s.provider,s.providerProductId,s.providerVariantId,s.originCountry,s.cjShippingMode,s.managedOrigin?.kind,s.managedOrigin?.assignment,s.destinationCountry,s.destinationPostal,s.shippingMethod]);return digest([s.version,s.productId,s.variantId,s.provider,s.providerProductId,s.providerVariantId,s.warehouseId,s.destinationCountry,s.destinationPostal,s.shippingMethod])}
function snapshotId(s:RetailSnapshot){return digest([lineKey(s),s.quoteId,s.quoteRevision,s.retailUnitCents,s.currency,s.supplierUnitCents,s.shippingQuoteCents,s.freightQuotedQty,s.availableQty,s.observedAt,s.validUntil,s.retailApprovalSource,s.stockSource,s.shippingSource,...(s.originCountry!==undefined||s.cjShippingMode!==undefined?[s.originCountry,s.cjShippingMode]:[]),...(s.version===2?[s.managedOrigin]:[])])}
function parse(raw:unknown,now:Date,maxAgeMs:number):RetailSnapshot{
 const r=snapshotSchema.safeParse(raw);if(!r.success||!Number.isFinite(now.getTime())||!Number.isSafeInteger(maxAgeMs)||maxAgeMs<=0)return fail();
 const s=r.data,t=Date.parse(s.observedAt),until=Date.parse(s.validUntil),n=now.getTime();
 if(t>n||until<=n||until<=t||n-t>maxAgeMs)return fail();
 if(s.version===2){const e=s.managedOrigin!;const et=Date.parse(e.observedAt),eu=Date.parse(e.validUntil);if(et>n||eu<=n||eu<=et||n-et>maxAgeMs||until>eu)return fail();}
 return s;
}
export function bindRetailLine(raw:unknown,qty:number,now:Date,maxAgeMs:number):BoundRetailLine{
 const s=parse(raw,now,maxAgeMs);if(!Number.isSafeInteger(qty)||qty<=0||(s.version===2&&qty>s.managedOrigin!.confirmedAvailableQty)||qty>s.availableQty||qty>s.freightQuotedQty||!Number.isSafeInteger(s.retailUnitCents*qty))return fail();
 return {lineKey:lineKey(s),snapshotId:snapshotId(s),snapshot:s,qty};
}
/** The current persisted offer must be independently loaded by trusted server code.
 * Hashes detect identity changes, not authorship. Never authorize a client snapshot by itself. */
export function assertRetailLineCurrent(line:BoundRetailLine,current:unknown,context:{productId:string;variantId:string;destinationCountry:string;destinationPostal?:string;now:Date;maxAgeMs:number}):BoundRetailLine{
 const stored=bindRetailLine(line.snapshot,line.qty,context.now,context.maxAgeMs),fresh=bindRetailLine(current,line.qty,context.now,context.maxAgeMs);
 if(line.lineKey!==stored.lineKey||line.snapshotId!==stored.snapshotId||stored.lineKey!==fresh.lineKey||stored.snapshotId!==fresh.snapshotId||fresh.snapshot.productId!==context.productId||fresh.snapshot.variantId!==context.variantId||fresh.snapshot.destinationCountry!==context.destinationCountry||(context.destinationPostal!==undefined&&fresh.snapshot.destinationPostal!==context.destinationPostal))return fail();
 return fresh;
}
/** Copies only a revalidated persisted snapshot; downstream provider routing uses this exact tuple. */
export function retailFulfillmentBinding(line:BoundRetailLine){
 const {provider,providerProductId,providerVariantId,warehouseId,destinationCountry,destinationPostal,shippingMethod}=line.snapshot;
 if(line.lineKey!==lineKey(line.snapshot)||line.snapshotId!==snapshotId(line.snapshot))return fail();
 return {provider,providerProductId,providerVariantId,warehouseId,...(line.snapshot.version===2?{originCountry:line.snapshot.originCountry,cjShippingMode:2,managedOrigin:line.snapshot.managedOrigin}:{}),destinationCountry,destinationPostal,shippingMethod,snapshotId:line.snapshotId,lineKey:line.lineKey,qty:line.qty};
}

/** Full source-validation of an untrusted candidate snapshot (freshness, validity window, identity). */
export function parseRetailSnapshotShape(raw:unknown):RetailSnapshot|null{const r=snapshotSchema.safeParse(raw);return r.success?r.data:null}
export function parseRetailSnapshot(raw:unknown,now:Date,maxAgeMs:number):RetailSnapshot{return parse(raw,now,maxAgeMs)}
/** Deterministic offer identity for a validated snapshot. */
export function retailSnapshotIdentity(s:RetailSnapshot){return {lineKey:lineKey(s),snapshotId:snapshotId(s)}}
