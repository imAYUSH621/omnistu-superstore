/** Offline exact-origin/variant comparison preparation. Never an offer writer or
 * approval authority. A comparable supplier subtotal is not a retail/landed cost. */
import {cjCachedOffers,type CjStagingItem}from'./cj';
import{applyFreightEvidence,type FreightEvidence,type FreightContext}from'./freight';
import{applyMapping,type VariantMapping}from'./mapping';
import{selectOffer}from'./select';
import type{OfferDecision}from'./types';
export type SupplierPreparationInput={items:CjStagingItem[];freight:FreightEvidence[];mappings:VariantMapping[];targetVariantKey:string;context:FreightContext&{originCountry:string;method:string};now:Date;maxAgeMs:number};
export function prepareSupplierComparison(input:SupplierPreparationInput):{status:'HOLD';writes:false;publish:false;comparison:OfferDecision|null;reasons:string[]}{
 const hold=(reasons:string[],comparison:OfferDecision|null=null)=>({status:'HOLD' as const,writes:false as const,publish:false as const,comparison,reasons});
 if(!input.context.method?.trim()||!input.targetVariantKey?.trim()||!/^[A-Z]{2}$/.test(input.context.originCountry)||!/^[A-Z]{2}$/.test(input.context.destinationCountry)||!input.context.destinationPostal.trim()||!Number.isSafeInteger(input.context.quantity)||input.context.quantity<1||!Number.isFinite(input.now.getTime())||!Number.isFinite(input.maxAgeMs)||input.maxAgeMs<=0)return hold(['INVALID_EXACT_COMPARISON_CONTEXT']);
 const identities=new Set<string>();
 for(const item of input.items){for(const v of item.variants){const key=`${item.pid}|${v.vid}`;if(identities.has(key))return hold(['DUPLICATE_EXACT_SOURCE_VARIANT']);identities.add(key)}}
 const raw=input.items.flatMap(item=>cjCachedOffers({...item,warehouseCountry:input.context.originCountry}));
 const freight=applyFreightEvidence(raw,input.freight,input.context,input.now,{maxAgeMs:input.maxAgeMs});
 let mapped;
 try{mapped=applyMapping(freight,input.mappings)}catch{return hold(['AMBIGUOUS_VARIANT_MAPPING'])}
 const comparison=selectOffer(mapped,input.now,{maxAgeMs:input.maxAgeMs,variantKey:input.targetVariantKey,quantity:input.context.quantity});
 return hold([...(comparison.selected?[]:['NO_COMPARABLE_EXACT_VARIANT']),'FULL_MERCHANT_LANDED_COST_REQUIRED','RETAIL_AND_PUBLICATION_APPROVAL_REQUIRED'],comparison);
}
