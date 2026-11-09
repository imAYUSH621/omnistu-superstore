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

## Dependency audit checkpoint

The downloaded 0.24.22 WAR contained 194 Maven package/version records. An OSV batch lookup matched 17 packages to 62 unique advisory IDs. This is a version match, not proof that all affected features are reachable or that 62 vulnerabilities can be exploited in this integration.

Examples from the actual WAR:

- `org.apache.shiro:shiro-core` 1.13.0 and `shiro-web` 1.13.0. Apache's security page describes affected-version session fixation and conditional LDAP DN injection. LDAP risk requires `DefaultLdapRealm`; local tests did not configure LDAP. Basic-auth local success does not qualify all Shiro sessions or configurations.
- `com.fasterxml.jackson.core:jackson-databind` 2.13.4.2. The cited polymorphic type-validator bypass requires polymorphic typing and attacker-controlled type identifiers. Reachability in the billing API still needs source/configuration analysis.
- `ch.qos.logback:logback-core` 1.3.14. The Janino evaluator issue requires an attacker-controlled configuration file or environment variable, not merely an arbitrary network request. This still needs a compatible upstream fix and configuration review before shared use.

Keep the core loopback-only and do not activate it in a shared or production environment on the strength of these local tests. Do not replace individual JARs blindly: upstream binary compatibility and full regressions must be checked. There is no deployed billing incident established by this audit.

Sources:
- https://google.github.io/osv.dev/post-v1-querybatch/
- https://shiro.apache.org/security-reports.html
- https://github.com/FasterXML/jackson-databind/security/advisories/GHSA-j3rv-43j4-c7qm
- https://logback.qos.ch/news.html

### Bounded upstream authorization check

With the local synthetic core's root role replaced by a non-mutating test role, seven direct upstream checks passed: existing account retrieval, exact external-key/balance retrieval, invoice component retrieval, denied account creation, denied draft charge, denied account update, and unchanged fingerprints across six account/financial tables. The three denied operations return 401 with an explicit missing-permission response, not 403. No new record or invoice was created by this check. The local config was restored and the owned core/database stopped afterward.

These are seven direct core checks, separate from the thirteen compiled Store HTTP checks. They do not prove all endpoints deny writes. The upstream API has no account-read/invoice-read enum boundaries that enforce end-customer ownership; the Store's UUID-only lookup and tenant authentication are still necessary. Do not expose tenant credentials or forward browser cookies to the core. Production must use a verified restricted service principal, not the upstream demo root user.

Source inspection at upstream tag `killbill-0.24.22`, commit `4f3fa45dbb044ed5d65cccebb0beadbc5d1b2899`, found that `KillBillSessionStorageEvaluator` creates new sessions only through `/security/permissions` and accepts existing sessions elsewhere. The Store adapter does not call that endpoint or forward cookies. This narrows session-advisory reachability for this adapter; it does not establish that the engine's other endpoints or a shared deployment are safe.

## Local subscription-state increment

`/api/account/entitlements` is a second local-only read endpoint with the same disabled-on-hosted-environments gate. It uses the existing verified Store UUID, not caller-provided account selectors. It projects only bundle/subscription IDs, product, plan and upstream state. It validates account/bundle binding, IDs, known states and bounded result counts, rejecting duplicate, malformed or mismatched data. It never enrols customers, changes a subscription, maps a product permission, or provisions a service. `ACTIVE` is not evidence of payment or permission to use a real service. Every ready response explicitly includes `serviceProvisioned: false`.

Before a synthetic lifecycle test, a separate local tenant was given an all-zero-price catalog with no trial or paid phase. The synthetic account had both `AUTO_PAY_OFF` and `AUTO_INVOICING_OFF` confirmed before subscription creation. Network access remained loopback-only and no provider/payment method was configured. Six direct-core preflight checks covered these guards, ACTIVE -> BLOCKED -> ACTIVE state changes, correct account/bundle/subscription linkage, and unchanged invoice/item/payment/payment-method counts.

Nine actual compiled Store HTTP checks then covered normal signup/current UUID, missing link without auto-enrolment, explicit synthetic zero-price fixture ACTIVE projection, ignored caller selectors and read immutability across six account/financial tables, upstream pause reflected as BLOCKED, resume reflected as ACTIVE, guest denial, second-user isolation, and unchanged invoice/item/payment/payment-method counts (4/4/0/0). These are separate from the earlier thirteen billing HTTP checks and seven direct-core restricted-role checks. No additional invoice or payment was created. There are now two synthetic zero-price subscriptions retained locally, not zero subscriptions across the entire lab. No real service was provisioned.

Updated qualification: 54 focused tests, 220 suites / 1929 tests with zero skips, TypeScript, lint and full Next build pass. The full suite initially lacked the paired disposable-database variable and skipped database tests; it was corrected and rerun with zero skips. The existing Jest open-handle warning remains despite exit 0. The owned local Store/core/database were stopped afterward. No hosted state or deployment is implied.

## Bounded transport and authorization checkpoint

Both local read adapters now cap the response at 262,144 original bytes before JSON parsing. Declared oversized/invalid lengths fail before reading; chunked bodies are counted, including multibyte UTF-8, and canceled when they exceed the cap. Invalid UTF-8, JSON, missing bodies, stream errors and aborts fail closed. Existing four-second fetch signals cover body consumption. Record-count checks, UUID binding, GET-only requests, redirect rejection, field projection and disabled-on-hosted gates remain. A large discarded provider field cannot bypass the byte cap.

Thirteen new tests include actual loopback HTTP valid/declared-oversize/chunked-oversize/stalled-body responses. Both actual adapters were also called from revised source against the unchanged isolated Kill Bill core: four successful GETs covered account, invoices (legitimately empty for the zero-price fixture) and bundle/subscription state; hosted flags still disabled the adapter. This is revised-source-to-core proof, not a newly compiled Store HTTP test. Existing thirteen billing and nine entitlement Store HTTP checks remain earlier-source evidence, not silently relabelled as this revision.

Separately, twenty-five read-only actual core checks covered a synthetic authorized account control and twelve representative URL forms with missing and invalid Basic credentials. Unauthenticated forms returned 400/401/404 without account fields. Six account/financial table data fingerprints remained unchanged; owned Java/database processes stopped. These probes do not cover every servlet dispatch, normalization or advisory condition and do not establish that an affected dependency is safe.

Current Shiro source review found the custom Guice filter-chain resolver remains part of the application; it cannot be dismissed merely because web.xml names ShiroFilter. The current upstream security page lists the Guice web authentication-bypass advisory through Shiro 2.x. A separate Shiro 2.2.1 resolver-only probe matched the application's wildcard chains on representative paths, but that is not an HTTP exploitability test. Shiro 3.0.1 source changes trailing-slash chain matching and uses Jakarta; its migration guide requires Java 17 and Jakarta EE 10+. The existing Java 11/javax servlet runtime is not a drop-in target. No Shiro 2.x package experiment, partial import port or these bounded reads qualify a production core. The previously separate private source-port experiment remains unqualified.

Latest local tests: 67 focused checks including the 13 new transport tests; full 221 suites / 1942 tests, zero skipped, TypeScript and lint pass. The non-Git working directory cannot qualify the tracked-tree Node test; exact published-checkout Node checks and cloud CI/full build must be checked separately. Previous full-build results belong to the earlier source revision. No production or hosted activation is included.

Additional sources:
- https://shiro.apache.org/security-reports.html
- https://shiro.apache.org/migration-guide.html
- https://repo.maven.apache.org/maven2/org/apache/shiro/shiro-guice/2.2.1/shiro-guice-2.2.1-sources.jar
- https://repo.maven.apache.org/maven2/org/apache/shiro/shiro-guice/3.0.1/shiro-guice-3.0.1-sources.jar

### Real Store transport timeout correction

A subsequent real development-Store HTTP fault test found that a stalled response body could exceed 30 seconds despite the fetch AbortSignal. The raw-fetch test was insufficient: the framework's response stream wrapper did not provide the assumed body deadline. The parser now has its own total four-second body deadline and never waits for upstream cancellation to settle. It does not reset the budget per chunk. Three additional tests cover hung cancellation and slow-drip bodies, bringing transport tests to sixteen. The earlier statement that fetch signals alone cover body consumption is superseded by this independent deadline.

Thirteen actual revised development-Store checks now pass with the existing restricted local core role. A directly provisioned isolated synthetic Store user signs in through normal credential/session HTTP endpoints and reads the existing same-UUID core account. Both account endpoints return ready/private results, guests are rejected, and the core rejects an account mutation with permission-denied 401. A loopback proxy then injects declared oversized, chunked oversized, invalid UTF-8 and stalled account responses, plus oversized invoice/bundle responses. Both authenticated Store endpoints return only unavailable/503, including the independent stalled-body deadline. Six core table fingerprints stay unchanged throughout the reads and denied probe; the core receives no successful writes, and retained synthetic financial counts remain four DRAFT invoices/four items/zero payments/zero methods/two zero-price subscriptions. The temporary Store login is disabled and all owned processes stop. This does not claim signup UI or production-build runtime testing. Local role permission checks do not prove tenant/customer isolation of every core endpoint; Store UUID binding remains required.

### Reproducible compiled-Store HTTP regression gate

The existing CI job now runs `scripts/verify-local-billing-built.mjs` after its successful Next production build. The gate refuses non-loopback/non-disposable databases and Vercel environments. It uses only CI's existing disposable PostgreSQL plus an in-process synthetic loopback billing responder, starts the actual compiled Store in production runtime mode, signs in two throwaway users through normal credential/session HTTP endpoints and removes them afterward. It checks UUID isolation, private/no-store projections, positive synthetic DRAFT amounts, subscription state without a service grant, GET-only upstream requests, oversize responses and stalled bodies. Each failure response must be only unavailable/503 within its budget. Owned processes stop in cleanup.

This is synthetic-upstream regression coverage for the compiled Store, not actual Kill Bill core, hosted production, payment or dependency-security qualification. Actual-core evidence remains the separate development-Store tests. A subsequent bounded API-only check read all four retained actual-core synthetic USD12.34 DRAFT fixtures through the latest Store source, using controlled signed synthetic sessions rather than claiming credential-login proof. Six core table fingerprints stayed unchanged. Their known throwaway local fixture passwords were disabled. Latest positive UI rendering remains unverified after development compilation resource stalls; no earlier screenshots are relabelled as current.
