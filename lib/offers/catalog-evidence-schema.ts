/** Pure input schemas from the previously qualified preparation workflow. No persistence or authority. */
import {z}from 'zod';
const idStr=z.string().min(1).max(200).refine(v=>v===v.trim());
const iso=z.string().datetime();
const cents=z.number().int().nonnegative().safe();
export const stockEvidencePayload=z.object({provider:idStr,providerProductId:idStr,providerVariantId:idStr,warehouseId:idStr,warehouseReadyQty:z.number().int().positive().safe(),observedAt:iso,routeQualified:z.literal(true),routeEvidence:idStr}).strict();
export const freightEvidencePayload=z.object({provider:idStr,providerProductId:idStr,providerVariantId:idStr,warehouseId:idStr,destinationCountry:z.string().regex(/^[A-Z]{2}$/),destinationPostal:idStr,shippingMethod:idStr,freightQuotedQty:z.number().int().positive().safe(),shippingQuoteCents:cents,currency:z.literal('USD'),observedAt:iso}).strict();
export const retailApprovalPayload=z.object({productId:z.string().uuid(),variantId:z.string().uuid(),retailUnitCents:cents.refine(v=>v>0),currency:z.literal('USD'),approvedBy:idStr,approvalRef:idStr,observedAt:iso}).strict();
