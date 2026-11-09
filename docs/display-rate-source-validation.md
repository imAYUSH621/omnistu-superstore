# Display-rate source validation

Conversion remains reference-only. Cart, checkout, orders and settlement stay USD. No provider, paid service, merchant price or payment flow changes.

The existing public provider documents daily data updates, permits hourly checks/cache, and requires attribution: https://www.exchangerate-api.com/docs/free . Current direct endpoint checks on November 9 returned fresh November 9 USD tables. This correction does not claim that production had a stale-feed incident.

The previous engine accepted arbitrary rates objects, merged missing live currencies with bundled reference values and labelled the mixture live. It also used fetch time as source time. The browser's shared request promise never expired. Those paths could display wrong-base, stale, incomplete or invalid numeric data with live wording.

Now:
- Require USD base, USD=1, all seven supported display rates positive and finite, successful provider status when present, and a source observation time. Only the seven supported display currencies are returned.
- Reject provider observations older than 36 hours or more than five minutes in the future. This is an application freshness limit for a daily provider, not a provider guarantee. Keep source observation time separate from the one-hour fetch cache age.
- Invalid primary data tries the existing secondary endpoint. Invalid/absent provider data becomes explicit reference fallback, never a live mixture. Partial valid environment rates remain reference overrides; malformed/nonpositive overrides are rejected.
- Cache concurrent server/browser requests, return independent server result objects, and expire browser requests after an hour. Recheck on hourly timers and window focus; clean up listeners/timers. Ignore superseded currency requests.
- Validate the browser response too. Remove the extra 24-hour stale-while-revalidate allowance. Keep USD settlement disclosure, daily-provider wording and provider attribution on the page.

Qualification: 53 focused tests and 219 suites / 1909 tests with zero skips pass on a disposable loopback-only Store database. TypeScript and lint pass. Local full build remains unqualified after compiler memory/timeout failures. No hosted deployment or visual-price conversion completion is implied by these tests. A draft review and exact-source cloud CI are the next checks.


Follow-up visual/runtime checkpoint: actual local development Store HTTP returned a fresh daily provider observation and exactly seven USD-based display rates. Actual 320px and 1280px footer selector/provider-credit pixels were inspected. Inspection found the inherited footer panel clipped on small viewports; it now uses viewport margins and bounded scroll on mobile and opens upward for lower-half desktop anchors. Both widths showed readable daily-provider/USD-settlement copy, selection saved INR preference, Escape closed the panel, and no document horizontal overflow. This is development-runtime UI evidence, not hosted or populated-product-price proof. Provider credit is visible. All owned dev/database processes were stopped. Updated qualification:56focused/220suites1912tests0skip,TypeScript/lint pass. Previous exact source cloud CI passed the full build; latest panel correction still needs its own exact-source CI.
