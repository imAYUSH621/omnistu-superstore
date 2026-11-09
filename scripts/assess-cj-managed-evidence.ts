import {createHash} from 'node:crypto';
import {parseRetailSnapshot,type RetailSnapshot} from '../lib/retail/snapshot';

/** OFFLINE ONLY. Operator-supplied, independently reviewed extraction from retained
 * provider records. This interface does not authenticate an author or reviewer.
 * Never populate this from customer input or treat a passing assessment as approval.
 * No database, network, offer writer or checkout integration is present here. */
export type ReviewedCJRecord={
 ref:string;kind:'availability'|'stock'|'freight'|'terms';
 retainedBody:string;retainedSha256:string;
 providerProductId:string;providerVariantId:string;originCountry:string;
 destinationCountry:string;destinationPostal:string;shippingMethod:string;
 quantity:number;supplierUnitCents:number;shippingQuoteCents:number;
 handlingMaxDays:number;observedAt:string;validUntil:string;
};
export function assessCJManagedEvidence(raw:unknown,records:ReviewedCJRecord[],now:Date,maxAgeMs:number){
 const findings:string[]=[];
 let s:RetailSnapshot;
 try{s=parseRetailSnapshot(raw,now,maxAgeMs)}catch{return {commercialApproval:false as const,findings:['Snapshot invalid or stale'],readyForIndependentReview:false};}
 if(s.version!==2||!s.managedOrigin)return {commercialApproval:false as const,findings:['Explicit managed-origin snapshot required'],readyForIndependentReview:false};
 const e=s.managedOrigin;
 const expected:[ReviewedCJRecord['kind'],string][]=[['availability',e.availabilityConfirmationRef],['stock',e.stockEvidenceRef],['freight',e.freightEvidenceRef],['terms',e.fulfillmentTermsRef]];
 for(const[kind,ref]of expected){
  const matches=records.filter(r=>r.ref===ref);
  if(matches.length!==1){findings.push(`${kind}: missing or ambiguous retained record`);continue;}
  const r=matches[0];
  if(r.kind!==kind||!r.retainedBody.trim()||!/^[a-f0-9]{64}$/.test(r.retainedSha256)||createHash('sha256').update(r.retainedBody).digest('hex')!==r.retainedSha256)findings.push(`${kind}: invalid retained record digest or kind`);
  const observed=Date.parse(r.observedAt),until=Date.parse(r.validUntil),n=now.getTime();
  if(!Number.isFinite(observed)||!Number.isFinite(until)||observed>n||until<=n||until<=observed||n-observed>maxAgeMs||Date.parse(s.validUntil)>until||Date.parse(e.validUntil)>until)findings.push(`${kind}: stale record or unsupported expiry`);
  if(r.providerProductId!==s.providerProductId||r.providerVariantId!==s.providerVariantId||r.originCountry!==s.originCountry||r.destinationCountry!==s.destinationCountry||r.destinationPostal!==s.destinationPostal||r.shippingMethod!==s.shippingMethod)findings.push(`${kind}: exact option or route mismatch`);
  if(!Number.isSafeInteger(r.quantity)||r.quantity<e.confirmedAvailableQty||r.quantity<s.availableQty||r.quantity<s.freightQuotedQty||(kind==='freight'&&r.quantity!==s.freightQuotedQty)||!Number.isSafeInteger(r.handlingMaxDays)||r.handlingMaxDays<0||r.handlingMaxDays>e.handlingMaxDays||r.supplierUnitCents!==s.supplierUnitCents||r.shippingQuoteCents!==s.shippingQuoteCents)findings.push(`${kind}: quantity, amount or handling mismatch`);
 }
 return {commercialApproval:false as const,readyForIndependentReview:findings.length===0,findings};
}
