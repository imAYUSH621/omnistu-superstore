# Inactive Google identity integration

The Store uses its existing Auth.js Google provider and Prisma User/Account models. No second identity provider, company-customer database, migration or new Google project is introduced. This is one concrete identity-provider seam, not a completed company-wide membership or shared-billing layer.

Google remains absent from `/api/auth/providers` and the sign-in page unless `GOOGLE_SIGNIN_ENABLED=true` and BOTH server-only `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are configured. The callable server action checks the same gate. This release does not set those values, create an OAuth client/consent screen, activate Google sign-in, grant admin roles or send email.

Only the standard identity scopes `openid email profile` are requested. No refresh-token request, API access or forced repeat consent. Google must verify the email; profile emails are normalized. Provider data cannot set an admin role. Access/refresh/ID tokens are not retained in the Account row because this identity-only flow does not use Google APIs.

A pre-existing email is NOT automatically linked, including legacy case-insensitive matches. The Google subject must already be linked to that exact local user, or this must be a new identity with no local email collision. Ambiguous local matches, conflicts and database failures refuse sign-in. Auth.js's own dangerous linking remains disabled. Existing users should continue with their original sign-in method; explicit authenticated account-linking UX is not implemented. Standard Auth.js state/PKCE/CSRF and existing safe same-origin callback rules remain intact.

Successful Google authentication, first registration, account persistence and sign-out must still be tested against a real authorized client before activation. Dormant production/provider checks and mocked policy tests are NOT proof of that external exchange. Existing Google account/project/audience selection and public consent setup remain owner decisions; no repeated account creation or OTP request is implied.

Official references:
https://authjs.dev/getting-started/providers/google
https://authjs.dev/reference/core/providers
https://authjs.dev/reference/core/errors
