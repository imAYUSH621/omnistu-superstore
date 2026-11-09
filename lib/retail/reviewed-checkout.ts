import type {RetailRawTx} from './transactions';
export type ReviewedTerms={id:string;itemsCents:number;shippingCents:number;taxCents:number;totalCents:number;approvalSource:string;policySource:string};
/** Only independently persisted immutable review evidence can set fees/terms.
 * Browser submits ID and full review token, never prices, rates or authority. */
export async function loadReviewedCheckoutTermsTx(tx:Pick<RetailRawTx,'$queryRaw'>,input:{userId:string;cartId:string;reviewToken:string;cartToken:string;itemsCents:number;now:Date;termsId?:string}):Promise<ReviewedTerms|null>{
 const rows=await tx.$queryRaw<{id:string;userId:string;cartToken:string;itemsCents:bigint;shippingCents:bigint;taxCents:bigint;totalCents:bigint;approvalSource:string;policySource:string;observedAt:Date;validUntil:Date}[]>`SELECT * FROM "ReviewedCheckoutTerms" WHERE "cartId"=${input.cartId}::uuid AND "userId"=${input.userId}::uuid AND "reviewToken"=${input.reviewToken} ORDER BY "observedAt" DESC,id DESC LIMIT 1`;
 if(rows.length!==1)return null;const r=rows[0];const values=[r.itemsCents,r.shippingCents,r.taxCents,r.totalCents].map(Number);
 if((input.termsId&&input.termsId!==r.id)||r.cartToken!==input.cartToken||values.some(v=>!Number.isSafeInteger(v)||v<0)||values[0]!==input.itemsCents||values[0]+values[1]+values[2]!==values[3]||!r.approvalSource.trim()||!r.policySource.trim()||r.observedAt>input.now||r.validUntil<=input.now||r.validUntil<=r.observedAt)return null;
 return{id:r.id,itemsCents:values[0],shippingCents:values[1],taxCents:values[2],totalCents:values[3],approvalSource:r.approvalSource,policySource:r.policySource};
}
