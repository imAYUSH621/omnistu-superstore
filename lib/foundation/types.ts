/**
 * Omnistu base-layer contracts (PROVISIONAL DRAFT).
 * Provider-neutral shared types for a future company-wide account/customer
 * layer. current-customer.ts now bridges the existing same-app User UUID.
 * Memberships, mappings and company billing below are still provisional.
 */

/** One person across all Omnistu products. Issued only by the identity layer. */
export type CustomerId = string & { readonly __brand: 'CustomerId' };

/** Product namespace. Known products today; open-ended by design. */
export type ProductScope = 'store' | (string & {});

/** Per-product access and role for a customer. Isolation rules key off this. */
export interface ProductMembership {
  customerId: CustomerId;
  product: ProductScope;
  role: 'customer' | 'admin' | 'support';
  status: 'active' | 'suspended' | 'closed';
}

/** Company-level account: one per person across all products. */
export interface FoundationCustomer {
  id: CustomerId;
  createdAt: string; // ISO 8601
  primaryEmail: string;
  status: 'active' | 'suspended' | 'closed';
}

/** Maps a product-local user row to the shared customer, for future migration. */
export interface LocalIdentityMapping {
  product: ProductScope;
  localUserId: string;
  customerId: CustomerId;
}

/** Composite scoping key used on every product-local row that belongs to a person. */
export function membershipKey(customerId: CustomerId, product: ProductScope): string {
  return `${product}:${customerId}`;
}

/** Look up the shared customer for a product-local identity. */
export function resolveCustomerId(
  mappings: readonly LocalIdentityMapping[],
  product: ProductScope,
  localUserId: string,
): CustomerId | undefined {
  const hit = mappings.find((m) => m.product === product && m.localUserId === localUserId);
  return hit?.customerId;
}
