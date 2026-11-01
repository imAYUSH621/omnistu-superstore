-- Auth abuse limits and session revocation. Both tables are used only through
-- guarded raw SQL (lib/auth-limits.ts, lib/session-version.ts), so code that
-- ships before this migration is applied keeps sign-in working (unthrottled,
-- no revocation) instead of failing. Re-run docs/db/supabase-lockdown.sql on
-- Supabase after applying so the new tables get RLS and no anon grants.

CREATE TABLE "AuthAttempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "auth_attempt_lookup_idx" ON "AuthAttempt"("kind", "keyHash", "createdAt");

CREATE TABLE "UserSessionVersion" (
    "userId" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSessionVersion_pkey" PRIMARY KEY ("userId")
);
