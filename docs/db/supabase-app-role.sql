-- Least-privilege app role for the Supabase dev DB. Run as the owner (postgres)
-- AFTER `prisma migrate deploy` and docs/db/supabase-lockdown.sql, via psql:
--   psql "<owner session url>" -v apppw="$(cat <file with the role password>)" -f docs/db/supabase-app-role.sql
-- The app then connects as omnistu_app.<project-ref> (pooler, transaction mode,
-- ?pgbouncer=true). It can read and write data but cannot run DDL or read
-- _prisma_migrations. RLS stays ON (lockdown); a policy lets only this role in.
-- Re-run this file after any migration that adds tables (new tables get RLS from
-- the lockdown script and a policy from here).
SELECT format('CREATE ROLE omnistu_app LOGIN PASSWORD %L NOINHERIT NOCREATEDB NOCREATEROLE', :'apppw')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'omnistu_app') \gexec
GRANT USAGE ON SCHEMA public TO omnistu_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO omnistu_app;
REVOKE ALL ON TABLE public._prisma_migrations FROM omnistu_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO omnistu_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO omnistu_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO omnistu_app;
DO $$ DECLARE t record; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' LOOP
    EXECUTE format('DROP POLICY IF EXISTS app_all ON public.%I', t.tablename);
    EXECUTE format('CREATE POLICY app_all ON public.%I FOR ALL TO omnistu_app USING (true) WITH CHECK (true)', t.tablename);
  END LOOP;
END $$;
