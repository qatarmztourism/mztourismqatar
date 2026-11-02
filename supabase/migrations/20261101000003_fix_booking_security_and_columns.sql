-- ==============================================================================
-- MZ Tourism Qatar — Migration 20261101000003: Booking Security & Column Resolution
-- Fixes trigger_enforce_booking_security search_path and adds missing booking columns
-- ==============================================================================

-- 1. Ensure extensions schema is present
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Extend public.bookings with total_price and lifecycle audit fields
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Backfill total_price for existing reservations
UPDATE public.bookings
SET total_price = COALESCE(deposit_required, 0) + COALESCE(balance_due, 0)
WHERE total_price IS NULL OR total_price = 0;

-- 4. Update public.is_admin() to recognize service_role in addition to active staff admins
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
STABLE
AS $$
BEGIN
  -- Service role always has administrative clearance
  IF auth.role() = 'service_role' 
     OR coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
    RETURN true;
  END IF;

  -- Verify active membership in admin_users
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = auth.uid()
      AND is_active = true
  );
END;
$$;

-- 5. Fix enforce_booking_security to include extensions in search_path
-- and correctly reference gen_random_bytes
CREATE OR REPLACE FUNCTION public.enforce_booking_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Active admins and server service role bypass restriction
  IF public.is_admin() THEN
    RETURN new;
  END IF;

  -- Customer or Guest INSERT:
  IF TG_OP = 'INSERT' THEN
    new.booking_status := 'awaiting_deposit';
    new.payment_status := 'deposit_pending';
    new.admin_notes := NULL;

    -- Ensure upload_token is always generated server-side
    new.upload_token := gen_random_uuid();

    -- Ensure customer_id matches caller's authenticated UID, or force NULL for guest
    IF auth.uid() IS NOT NULL THEN
      new.customer_id := auth.uid();
    ELSE
      new.customer_id := NULL;
    END IF;

    -- Cryptographically secure random booking reference with schema-qualified pgcrypto
    new.booking_ref := 'MZ-' || upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 8));

    RETURN new;
  END IF;

  -- Customer or Guest UPDATE:
  IF TG_OP = 'UPDATE' THEN
    new.booking_status := old.booking_status;
    new.payment_status := old.payment_status;
    new.deposit_required := old.deposit_required;
    new.deposit_paid := old.deposit_paid;
    new.balance_due := old.balance_due;
    new.admin_notes := old.admin_notes;
    new.upload_token := old.upload_token;
    new.booking_ref := old.booking_ref;
    new.customer_id := old.customer_id;
    new.service_id := old.service_id;

    RETURN new;
  END IF;

  RETURN new;
END;
$$;
