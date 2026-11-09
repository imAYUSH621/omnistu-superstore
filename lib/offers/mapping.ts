import { Offer } from './types';

/**
 * Explicit cross-provider variant mapping table.
 *
 * Two provider rows are "the same variant" only when an owner-confirmed
 * mapping says so. Name, attribute or price similarity is never used. Each
 * mapping gives the members one canonical variantKey so the selector can
 * compare their quotes; unmapped offers keep their provider-namespaced key.
 */

export interface VariantMapping {
  canonicalVariantKey: string; // catalog-owned identity, e.g. 'cw15|us-plug'
  members: Array<{
    provider: string;
    providerProductId: string;   // pid
    providerVariantId: string;   // vid
  }>;
  confirmedBy: 'owner';          // only explicit owner confirmation may create one
  confirmedAt: string;           // ISO timestamp
}

export function validateMapping(m: VariantMapping): string[] {
  const errors: string[] = [];
  if (!m.canonicalVariantKey?.trim()) errors.push('canonicalVariantKey required');
  if (!Array.isArray(m.members) || m.members.length < 2) errors.push('at least two members required');
  const seen = new Set<string>();
  for (const mem of m.members ?? []) {
    if (!mem.provider || !mem.providerProductId || !mem.providerVariantId || [mem.provider,mem.providerProductId,mem.providerVariantId].some(v=>v.includes('|')||v.trim()!==v)) {
      errors.push('member needs provider, providerProductId and providerVariantId');
      continue;
    }
    const k = `${mem.provider}|${mem.providerProductId}|${mem.providerVariantId}`;
    if (seen.has(k)) errors.push(`duplicate member ${k}`);
    seen.add(k);
  }
  if (m.confirmedBy !== 'owner') errors.push('mapping must be owner-confirmed');
  if (Number.isNaN(new Date(m.confirmedAt).getTime())) errors.push('confirmedAt must be a valid timestamp');
  return errors;
}

export function applyMapping(offers: Offer[], mappings: VariantMapping[]): Offer[] {
  const byKey = new Map<string, string>();
  const valid=mappings.filter(m=>validateMapping(m).length===0);
  for (const m of valid) {
    for (const mem of m.members) {
      const key=`${mem.provider}|${mem.providerProductId}|${mem.providerVariantId}`;
      const previous=byKey.get(key);
      if(previous&&previous!==m.canonicalVariantKey)throw Error('AMBIGUOUS_VARIANT_MAPPING');
      byKey.set(key,m.canonicalVariantKey);
    }
  }
  // A canonical name cannot silently absorb an unrelated unmapped provider row.
  const canonical=new Set(valid.map(m=>m.canonicalVariantKey));
  if(offers.some(o=>canonical.has(o.variantKey)&&!byKey.has(o.variantKey)))throw Error('CANONICAL_PROVIDER_IDENTITY_COLLISION');
  return offers.map((o) => {
    // offer.variantKey is `${provider}|${pid}|${vid}` by adapter convention
    const canonical = byKey.get(o.variantKey);
    return canonical ? { ...o, variantKey: canonical } : o;
  });
}
