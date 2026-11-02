-- ==============================================================================
-- MZ Tourism Qatar — Migration 20261028000002: Service Role Privileges & Profile Safeguards
-- Non-destructive grant updates for server-side Next.js operations
-- ==============================================================================

-- 1. Ensure Supabase service_role has full table, sequence, and function access
-- This enables Next.js server actions using createAdminClient() to perform administrative checks
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- 2. Explicit grants on public tables for service_role
GRANT ALL ON public.services TO service_role;
GRANT ALL ON public.bookings TO service_role;
GRANT ALL ON public.booking_participants TO service_role;
GRANT ALL ON public.custom_trip_requests TO service_role;
GRANT ALL ON public.deposit_proofs TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.admin_users TO service_role;
GRANT ALL ON public.booking_reminders TO service_role;

-- 3. Profile Upsert Safeguard (Allows authenticated users to insert their own profile record)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
  CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR public.is_admin());
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;
