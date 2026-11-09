# Local billing qualification, not production billing

This branch adds a read-only local Store integration with Kill Bill. It does not activate company billing, issue customer invoices, start subscriptions, register payment methods, or take money. Existing Store Auth.js identity remains authoritative. There is no second customer login or email-based account linking.

## Implemented boundary

- `currentCustomer()` verifies the existing signed-in Store User UUID.
- Kill Bill lookup uses `externalKey=authjs:<verified UUID>`. No request identity parameter is accepted.
- A missing external account returns `not-linked`. Reading never creates an account.
- The adapter reads account balance/credit and invoice components. It projects only invoice reference/date/status/currency/amount/balance. Missing or mismatched upstream data is unavailable, not empty history.
- HTTP redirects are rejected. Errors never return raw provider payloads or credentials.
- `/user/billing` is a private local test page with explicit synthetic-record notices, no payment controls and no production navigation link. It is 404 before identity retrieval when local configuration is disabled.
- Any `VERCEL_ENV` value disables the adapter and page. Both database and upstream service must use loopback hosts, and the database name must start with `omnistu_test_`. These are deliberately local-only controls, not a production configuration interface.

## Required local environment

Use a disposable, fully migrated Store PostgreSQL database, never a hosted or production database:

```
OMNISTU_LOCAL_DB_TEST=true
SHARED_BILLING_LOCAL_TEST_ONLY=true
DATABASE_URL=postgresql://LOCAL_USER@127.0.0.1:LOCAL_PORT/omnistu_test_billing?schema=public
KILLBILL_LOCAL_URL=http://127.0.0.1:LOCAL_API_PORT
KILLBILL_LOCAL_USERNAME=LOCAL_TEST_USER
KILLBILL_LOCAL_PASSWORD=LOCAL_TEST_PASSWORD
KILLBILL_LOCAL_TENANT_KEY=LOCAL_TEST_TENANT
KILLBILL_LOCAL_TENANT_SECRET=LOCAL_TEST_TENANT_SECRET
```

Do not set `VERCEL_ENV`. Keep credentials in local environment, not tracked files. Keep the upstream API bound to loopback and prevent non-local provider calls. No payment plugins, gateway keys, customer emails or real customer data are needed.

## Upstream core used for qualification

- Kill Bill `0.24.22`, Apache-2.0: https://github.com/killbill/killbill/releases/
- WAR package: https://central.sonatype.com/artifact/org.kill-bill.billing/killbill-profiles-killbill/0.24.22
- Apache Tomcat `9.0.123`, Java 11, separate disposable PostgreSQL database.
- Check upstream SHA512 files before executing downloaded archives. Follow the upstream manual installation and PostgreSQL instructions. The generic upstream DDL is destructive; apply it only to the separate disposable billing database, never to the Store database.
- A local no-egress JVM policy blocked the upstream update checker. Local startup does not establish a production vulnerability or dependency review.

References:
- https://docs.killbill.io/latest/getting_started
- https://docs.killbill.io/latest/PostgreSQL
- https://docs.killbill.io/latest/userguide_platform
- https://apidocs.killbill.io/account
- https://apidocs.killbill.io/invoice

## Observed qualification

Actual compiled Store plus upstream core, not a mock server:

1. Normal Store signup and session produced a verified UUID.
2. The signed-in API returned not-linked before an explicit synthetic upstream fixture existed.
3. A synthetic account keyed by that UUID returned its own balance and credit.
4. A synthetic external charge with `autoCommit=false` created a DRAFT invoice for USD 12.34. It was not issued or paid. The core returned HTTP 200 in this run, despite the API reference describing 201. The persisted DRAFT and exact amount were checked directly.
5. Actual billing page at 320, 390 and 1280 pixels displayed that draft. Recorded zero balance was not interpreted as a payment.
6. A second actual signed-in Store customer could not read the first customer's billing account by supplying query parameters. A fresh guest received 401.
7. PostgreSQL 17 data fingerprints before and after populated reads were unchanged for invoices, invoice items, subscriptions, payments and payment methods. No subscriptions, payments or payment methods were created.
8. All owned local application processes and the disposable database cluster were stopped after qualification. Synthetic records remained only in the offline local databases.

29 focused tests, full local migrated Store suite 218 suites / 1904 tests with zero skips, TypeScript, lint and full Next build passed. These numbers describe this branch, not a hosted release or complete billing engine. The existing test suite can print an open-handle warning with exit 0.

## Not implemented or authorized by this branch

Hosted persistent core, production credentials and access control, real customer enrolment, commercial invoice issuance, tax, credits/refunds, paid subscriptions, service entitlements/provisioning, customer notifications and money movement. Test page is English only. No production deployment is part of this change. Hosting and operating the Java core require a separate persistent service; a successful Next build does not provide one.
