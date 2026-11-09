# Traffic analytics: prepared, not activated

This is a default-OFF adapter, not a configured analytics property and not proof of privacy or legal compliance. There is no real measurement ID in source. It uses the existing native Next.js Script component and Google's documented tag commands. No new package, account, property, database, billing, tracking activation or Services publication is included.

## Runtime boundary

All three server-side values must be set before the client adapter receives a config:

- `TRAFFIC_ANALYTICS_ENABLED=true`
- `TRAFFIC_ANALYTICS_PROPERTY_REVIEWED=true`
- `TRAFFIC_ANALYTICS_ID` matching a GA4 `G-...` measurement ID

These are mechanical gates, not permission. Production release overrides must remain `false`, `false`, and empty until owner authority and the checks below are complete. No consent UI, provider loader, analytics preference storage or tag queue is created with null config.

After those gates, explicit visitor consent is required before loading the tag. Unknown, denied, corrupt or inaccessible preference storage fails closed. The preference key is versioned separately from functional language/theme settings. Withdrawal sets Google's documented opt-out flag before changing state and reloads an initialized document. Cross-tab changes also stop manual events. Ads storage, ad user data, ad personalization and Google signals are not enabled.

Only three exact route families are in the manual-event allowlist: `/` and `/search` as `store`, `/services` as `services`. Every other route, including account, admin, cart, checkout, contact, product slugs and arbitrary dynamic URLs, is excluded. Queries, fragments, actual document title/referrer, search text, customer/order/product identifiers and form values are never passed by this adapter. Fixed canonical page labels are used. Classifying `/services` does not publish the held Services launch.

## Required before any activation

1. Confirm owner permission, intended existing Google identity, property, web stream and measurement ID. Do not create a new property because the first account lacks one.
2. Review final public privacy and consent wording, geography-specific requirements, retention, linked products, data sharing, granular location/device collection and authorized recipients. The prepared six-language wording is not legal approval.
3. Disable automatic/enhanced measurement, especially browser-history page views, search, form, scroll, outbound-link and other automatic collection, in the actual property. Check connected site tags and advertising destinations. `send_page_view:false` alone does not stop Enhanced Measurement history events.
4. Use an isolated authorized real stream and actual network inspection to verify consent-before-load, allow/deny/revoke/reload/cross-tab behavior, no sensitive-route leakage or duplicate pageviews, clean canonical fields, denied/no-network behavior, real Store/Services separation and property reporting. Local mock-tag tests do not verify any Google behavior or property setting.
5. Activate only under the owner's scope. Do not treat flags, a syntactically valid ID, a visitor's consent or this document as owner permission. Preserve a tested OFF rollback.

Google can collect network/device data once a real tag is loaded. No claim that this preparation makes Google anonymous, removes all personal data, clears every prior provider cookie, or guarantees no provider-side automatic collection is made. The current production OFF boundary is the verified safety state.

## Official references inspected 2026-11-09

- https://nextjs.org/docs/app/guides/third-party-libraries (experimental helper component; automatic page views)
- https://nextjs.org/docs/messages/next-script-for-ga (native next/script remains supported)
- https://nextjs.org/docs/app/api-reference/components/script (afterInteractive and ready lifecycle)
- https://developers.google.com/tag-platform/security/concepts/consent-mode (basic blocks loading; advanced denied can still send pings)
- https://developers.google.com/analytics/devguides/collection/ga4/views (manual views and independent Enhanced Measurement history collection)
- https://developers.google.com/analytics/devguides/collection/ga4/reference/config (configuration fields)
- https://developers.google.com/tag-platform/security/guides/privacy (opt-out flag and advertising controls)
- https://support.google.com/analytics/answer/6366371?hl=en (no PII in URLs, titles or user-entered data)
- https://support.google.com/analytics/answer/13544947?hl=en (redaction is best effort and does not cover HTTP headers)
