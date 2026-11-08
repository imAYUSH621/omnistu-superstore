# Existing-account activity adapters

The current Auth.js/Prisma account now has one read-only activity boundary at `/api/account/activity`, also consumed directly by the account overview server page. It resolves the existing User UUID through `currentCustomer` before reading either source. Fixed Store and support adapters select at most three recent own orders and three own signed-in support/service enquiries from the existing tables. Guest enquiries are not joined by email. Request-supplied customer IDs, email addresses and product names cannot select another identity or adapter.

Each source keeps its own available/unavailable state; empty is a successful read only. Output exposes stored USD, UTC ISO timestamps, the persisted test classification and the original enquiry message. It omits addresses, contact email, payment/provider payloads and internal payment notes. Responses are private/no-store and vary by Cookie. Nothing is sent externally.

This is a concrete same-app common API and shared account-history integration over the existing open-source Auth.js/Prisma setup. It does not issue company-wide customers, grant product memberships, create entitlements, provide cross-domain SSO, charge shared billing, publish Services, or notify a support team. Those remain separate unfinished requirements. No schema, role grant, new database, account, provider or activation flag is added.

Release gate: preserve the qualified per-deployment production transaction-pool override documented in current-environments.md. Qualify the exact candidate with two real isolated test accounts, own persisted Store and signed-in enquiry records, forged selector attempts, guest denial and independent cleanup. Local tests alone are not hosted qualification.
