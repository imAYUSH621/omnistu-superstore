/** Legacy product-only paths must refuse offer/variant identity, never Zod-strip it.
 * This does not enable v2; only its complete, versioned path may accept these fields. */
export const RETAIL_IDENTITY_FIELDS=['variants','variantId','variantSku','sku','supplierVariantId','referenceCost','lineKey','snapshotId','snapshot','offerId','offerVersion','retailSnapshot','providerProductId','providerVariantId','warehouseId','quoteId','quoteRevision']as const;
export function containsRetailIdentity(value:unknown):boolean{return !!value&&typeof value==='object'&&RETAIL_IDENTITY_FIELDS.some(key=>Object.prototype.hasOwnProperty.call(value,key))}
