-- Auth abuse limits and session revocation. Both tables are used only through
-- guarded raw SQL (lib/auth-limits.ts, lib/session-version.ts), so code that
-- ships before this migration is applied keeps sign-in working (unthrottled,
-- no revocation) instead of failing. The same migration also enables RLS and
-- removes anon/authenticated access on the new tables (where those Supabase
-- roles exist), so the tables are never exposed between this migration and a
-- manual lockdown run.

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

-- Lock the new tables down in the same migration.
ALTER TABLE "AuthAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSessionVersion" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON TABLE "AuthAttempt", "UserSessionVersion" FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON TABLE "AuthAttempt", "UserSessionVersion" FROM authenticated';
  END IF;
  -- Least-privilege app role (docs/db/supabase-app-role.sql), when it exists.
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'omnistu_app') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "AuthAttempt", "UserSessionVersion" TO omnistu_app';
    EXECUTE 'DROP POLICY IF EXISTS app_all ON "AuthAttempt"';
    EXECUTE 'CREATE POLICY app_all ON "AuthAttempt" FOR ALL TO omnistu_app USING (true) WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS app_all ON "UserSessionVersion"';
    EXECUTE 'CREATE POLICY app_all ON "UserSessionVersion" FOR ALL TO omnistu_app USING (true) WITH CHECK (true)';
  END IF;
END $$;
