# Existing account bridge

The shared account adapter now resolves only the current Auth.js session's existing Prisma User UUID. It does not issue another ID or search by contact email. Store support intake and signed-in support/service enquiry history use this same adapter. The `/api/account` GET endpoint returns the resolved user's own basic identity with `private, no-store` and Cookie variance, never a requested ID or another user's row. Guests and missing users return401; auth/storage failures return503 rather than a fake empty identity.

Support behavior change: if current account/session verification fails, an enquiry is not silently saved as an unlinked guest message. It returns a clear retry response. Actual guests remain unlinked even when their submitted contact email matches a customer. Server identity remains separate from the caller-supplied reply address. Existing validation, honeypot, rate limiting and save-before-success remain.

This is the first runtime use of the provisional CustomerId type by existing Store/support paths, not a company-wide identity issuance, multi-domain SSO, membership/entitlement grant, customer merge, shared billing or Services launch. It adds no schema, migration, account, new role, external disclosure or commercial action. The existing Auth.js/Prisma foundation remains in place.
