-- ==============================================================================
-- MZ Tourism Qatar — Initial Platform Database Schema & RLS Policies (Secured)
-- Migration: 20261028000001_initial_schema.sql
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Enumerated Types
DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM (
    'awaiting_deposit',
    'deposit_under_review',
    'confirmed',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'deposit_pending',
    'deposit_submitted',
    'deposit_confirmed',
    'deposit_rejected',
    'fully_paid'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.admin_role AS ENUM (
    'super_admin',
    'tour_manager',
    'concierge_agent',
    'finance'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.custom_trip_status AS ENUM (
    'new',
    'contacted',
    'quoted',
    'converted',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.deposit_proof_review_status AS ENUM (
    'pending',
    'accepted',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.reminder_channel AS ENUM (
    'whatsapp',
    'email',
    'sms'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Profiles Table (Extends auth.users for customer accounts)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  preferred_locale TEXT NOT NULL DEFAULT 'en' CHECK (preferred_locale IN ('en', 'ar')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Admin Users Table (Authorized staff members)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.admin_role NOT NULL DEFAULT 'concierge_agent',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Helper Functions: Check If Caller Is An Active Admin or Super-Admin
-- SECURITY NOTE: Configured with `SECURITY DEFINER`, fixed `search_path = public`,
-- and `row_security = off` to completely prevent recursive RLS evaluations on admin_users.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = auth.uid()
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
  );
$$;

-- 6. Services Table (Master catalog of signature Qatar tourism experiences)
-- Note: Indicative pricing is set to non-price placeholder representations until confirmed by the owner.
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  category TEXT NOT NULL,
  duration TEXT NOT NULL,
  indicative_price TEXT NOT NULL DEFAULT 'Private Quote on Request',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed the 8 signature Qatar tourism experiences with verified non-price representations
INSERT INTO public.services (id, title_en, title_ar, category, duration, indicative_price, is_active)
VALUES
  ('desert-safari', 'Khor Al Adaid Inland Sea Private Desert Safari', 'رحلة سفاري صحراوية خاصة إلى خور العديد', 'safari', '6-8 Hours', 'Private Quote on Request', true),
  ('doha-city-tours', 'Doha Heritage & Cultural Grand Excursion', 'جولة الدوحة الثقافية والتراثية الكبرى', 'culture', '4-6 Hours', 'Private Quote on Request', true),
  ('airport-hotel-transfers', 'Hamad International VIP Chauffeur & Transfers', 'استقبال كبار الشخصيات وتوصيل مطار حمد الدولي', 'transfers', 'Custom Schedule', 'Private Quote on Request', true),
  ('resort-stays', 'Ultra-Luxury Island & Coastal Resort Retreats', 'إقامات المنتجعات الفاخرة والجزر الخاصة', 'luxury', '2+ Days', 'Private Quote on Request', true),
  ('celebrations-events', 'Private Dhow Banquets & Desert Galas', 'حفلات اليخوت والبانكويت الخاص في الصحراء', 'luxury', 'Custom Duration', 'Private Quote on Request', true),
  ('horse-riding', 'Purebred Arabian Equestrian Beach & Dunes', 'ركوب الخيل العربية الأصيلة على الشاطئ والكثبان', 'safari', '2 Hours', 'Private Quote on Request', true),
  ('gcc-travel', 'GCC Overland VIP Chauffeur (KSA & Bahrain)', 'رحلات برية فاخرة إلى دول الخليج (السعودية والبحرين)', 'transfers', 'Custom Multi-Day', 'Private Quote on Request', true),
  ('tent-desert-camp', 'Royal Bedouin Majlis & Desert Glamping', 'خدمات الخيام الملكية والتخييم الفاخر', 'safari', 'Overnight / Full Day', 'Private Quote on Request', true)
ON CONFLICT (id) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  title_ar = EXCLUDED.title_ar,
  category = EXCLUDED.category,
  duration = EXCLUDED.duration,
  indicative_price = EXCLUDED.indicative_price;

-- 7. Bookings Table (Customer reservations and fast inquiries)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  departure_date DATE,
  time_window TEXT,
  pax_count INTEGER NOT NULL DEFAULT 2 CHECK (pax_count > 0),
  pickup_location TEXT,
  booking_status public.booking_status NOT NULL DEFAULT 'awaiting_deposit',
  payment_status public.payment_status NOT NULL DEFAULT 'deposit_pending',
  deposit_required NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (deposit_required >= 0),
  deposit_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (deposit_paid >= 0),
  balance_due NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (balance_due >= 0),
  currency TEXT NOT NULL DEFAULT 'QAR',
  upload_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Booking Participants Table (Individual traveler details)
-- Token-verified: Guests must provide the matching booking upload_token to add participants
CREATE TABLE IF NOT EXISTS public.booking_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  upload_token UUID,
  full_name TEXT NOT NULL,
  passport_or_qatar_id TEXT,
  special_dietary TEXT,
  is_child BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Custom Trip Requests Table (Bespoke itinerary requests from modal & contact desk)
CREATE TABLE IF NOT EXISTS public.custom_trip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_ref TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  destinations TEXT[],
  experiences TEXT[],
  party_size TEXT,
  timeframe TEXT,
  budget_range TEXT,
  special_requests TEXT,
  status public.custom_trip_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Deposit Proofs Table (Receipt screenshots uploaded for manual bank verification)
-- Token-verified: uploader must possess the unguessable upload_token or be the authenticated booking owner
CREATE TABLE IF NOT EXISTS public.deposit_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  upload_token UUID,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  review_status public.deposit_proof_review_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ
);

-- 11. Booking Reminders Table (Audit log of WhatsApp/Email reminders sent by staff)
CREATE TABLE IF NOT EXISTS public.booking_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  channel public.reminder_channel NOT NULL,
  recipient TEXT NOT NULL,
  message_snapshot TEXT NOT NULL,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Indexes for Query Performance & Lookups
CREATE INDEX IF NOT EXISTS idx_bookings_booking_ref ON public.bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_upload_token ON public.bookings(upload_token);
CREATE INDEX IF NOT EXISTS idx_bookings_departure_date ON public.bookings(departure_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_booking_participants_booking ON public.booking_participants(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_participants_upload_token ON public.booking_participants(upload_token);
CREATE INDEX IF NOT EXISTS idx_custom_trip_requests_ref ON public.custom_trip_requests(request_ref);
CREATE INDEX IF NOT EXISTS idx_custom_trip_requests_customer ON public.custom_trip_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_custom_trip_requests_status ON public.custom_trip_requests(status);
CREATE INDEX IF NOT EXISTS idx_deposit_proofs_booking ON public.deposit_proofs(booking_id);
CREATE INDEX IF NOT EXISTS idx_deposit_proofs_upload_token ON public.deposit_proofs(upload_token);
CREATE INDEX IF NOT EXISTS idx_deposit_proofs_review_status ON public.deposit_proofs(review_status);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_booking ON public.booking_reminders(booking_id);

-- 13. Auto-update Trigger Function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_bookings_updated_at ON public.bookings;
CREATE TRIGGER trigger_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_custom_trip_requests_updated_at ON public.custom_trip_requests;
CREATE TRIGGER trigger_custom_trip_requests_updated_at
  BEFORE UPDATE ON public.custom_trip_requests
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 14. Server-Side Protection Trigger on Bookings
-- Defense-in-depth: Guarantees non-admins cannot set protected statuses, amounts, or notes
CREATE OR REPLACE FUNCTION public.enforce_booking_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Active admins bypass restriction for staff workflows
  IF public.is_admin() THEN
    RETURN new;
  END IF;

  -- Customer or Guest INSERT:
  IF TG_OP = 'INSERT' THEN
    -- Enforce safe initial defaults
    new.booking_status := 'awaiting_deposit';
    new.payment_status := 'deposit_pending';
    new.deposit_required := 0.00;
    new.deposit_paid := 0.00;
    new.balance_due := 0.00;
    new.admin_notes := NULL;

    -- Ensure upload_token is always generated server-side
    new.upload_token := gen_random_uuid();

    -- Ensure customer_id matches caller's authenticated UID, or force NULL for guest
    IF auth.uid() IS NOT NULL THEN
      new.customer_id := auth.uid();
    ELSE
      new.customer_id := NULL;
    END IF;

    -- Unconditionally generate booking reference server-side with cryptographic randomness.
    -- Never trust client-supplied or forged reference codes.
    new.booking_ref := 'MZ-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));

    RETURN new;
  END IF;

  -- Customer or Guest UPDATE:
  IF TG_OP = 'UPDATE' THEN
    -- Non-admins cannot mutate status, finances, admin notes, or tokens
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

DROP TRIGGER IF EXISTS trigger_enforce_booking_security ON public.bookings;
CREATE TRIGGER trigger_enforce_booking_security
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_booking_security();

-- 15. Server-Side Protection Trigger on Booking Participants
-- Guarantees participants can only be added with a verified upload_token or owner authentication
CREATE OR REPLACE FUNCTION public.enforce_booking_participant_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
BEGIN
  IF public.is_admin() THEN
    RETURN new;
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = new.booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referenced booking does not exist.';
  END IF;

  -- Block adding participants to cancelled or completed bookings
  IF v_booking.booking_status IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'Cannot add participants to a cancelled or completed booking.';
  END IF;

  -- Verify authorization
  IF auth.uid() IS NOT NULL AND v_booking.customer_id = auth.uid() THEN
    new.upload_token := v_booking.upload_token;
  ELSIF new.upload_token IS NOT NULL AND new.upload_token = v_booking.upload_token THEN
    -- Valid guest token
    NULL;
  ELSE
    RAISE EXCEPTION 'Unauthorized: valid booking upload token or owner authentication required.';
  END IF;

  -- Non-admins cannot modify existing participants
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Only authorized administrators can modify existing booking participants.';
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_booking_participant_security ON public.booking_participants;
CREATE TRIGGER trigger_enforce_booking_participant_security
  BEFORE INSERT OR UPDATE ON public.booking_participants
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_booking_participant_security();

-- 16. Server-Side Protection Trigger on Deposit Proofs (Integrity Validation)
-- Ensures proof records strictly reference valid bookings, match storage paths, and adhere to size/type constraints
CREATE OR REPLACE FUNCTION public.enforce_deposit_proof_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_proof_count INTEGER;
BEGIN
  -- Admin bypass for staff corrections or reviews
  IF public.is_admin() THEN
    RETURN new;
  END IF;

  -- Non-admins cannot UPDATE or DELETE deposit proofs
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Only authorized administrators can modify or remove deposit proofs.';
  END IF;

  -- Retrieve parent booking
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = new.booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referenced booking does not exist.';
  END IF;

  -- Verify booking is in an active deposit-accepting state
  IF v_booking.booking_status NOT IN ('awaiting_deposit', 'deposit_under_review') THEN
    RAISE EXCEPTION 'Deposit proofs cannot be submitted for bookings that are cancelled or completed.';
  END IF;

  -- Verify caller authorization: must be authenticated owner OR supply matching upload_token
  IF (auth.uid() IS NOT NULL AND v_booking.customer_id = auth.uid()) THEN
    new.upload_token := v_booking.upload_token;
  ELSIF (new.upload_token IS NOT NULL AND new.upload_token = v_booking.upload_token) THEN
    -- Guest with verified token
    NULL;
  ELSE
    RAISE EXCEPTION 'Unauthorized: valid booking upload token or owner authentication required.';
  END IF;

  -- Validate storage_path strictly: must begin with <upload_token>/
  IF new.storage_path NOT LIKE (v_booking.upload_token::text || '/%') THEN
    RAISE EXCEPTION 'Invalid storage path: must reside in the booking upload directory.';
  END IF;

  -- Prevent path traversal attempts
  IF new.storage_path LIKE '%..%' THEN
    RAISE EXCEPTION 'Invalid storage path: directory traversal is prohibited.';
  END IF;

  -- Validate file size (1 Byte to 10MB)
  IF new.file_size < 1 OR new.file_size > 10485760 THEN
    RAISE EXCEPTION 'File size must be between 1 byte and 10MB.';
  END IF;

  -- Validate MIME type
  IF new.mime_type NOT IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf') THEN
    RAISE EXCEPTION 'Unsupported file type. Permitted formats: JPEG, PNG, WebP, PDF.';
  END IF;

  -- Abuse prevention: Limit max 5 deposit proofs per booking
  SELECT count(*) INTO v_proof_count
  FROM public.deposit_proofs
  WHERE booking_id = new.booking_id;

  IF v_proof_count >= 5 THEN
    RAISE EXCEPTION 'Maximum upload limit reached for this booking.';
  END IF;

  -- Enforce initial review state
  new.review_status := 'pending';
  new.rejection_reason := NULL;
  new.reviewed_by := NULL;
  new.reviewed_at := NULL;
  new.uploaded_at := timezone('utc'::text, now());

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_deposit_proof_integrity ON public.deposit_proofs;
CREATE TRIGGER trigger_enforce_deposit_proof_integrity
  BEFORE INSERT OR UPDATE ON public.deposit_proofs
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_deposit_proof_integrity();

-- 17. Automatic Profile Creation on User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 18. Secure Lookup Helper: Get Booking Details by Verified Upload Token
-- Allows guests holding the unguessable token to check booking status without logging in.
-- Strictly exposes ONLY non-sensitive operational fields (ZERO PII: no customer_name, customer_email,
-- customer_phone, pickup_location, notes, or admin_notes).
CREATE OR REPLACE FUNCTION public.get_booking_by_token(p_upload_token UUID)
RETURNS TABLE (
  id UUID,
  booking_ref TEXT,
  service_id TEXT,
  departure_date DATE,
  booking_status public.booking_status,
  payment_status public.payment_status,
  deposit_required NUMERIC,
  deposit_paid NUMERIC,
  balance_due NUMERIC,
  currency TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
STABLE
AS $$
  SELECT
    b.id,
    b.booking_ref,
    b.service_id,
    b.departure_date,
    b.booking_status,
    b.payment_status,
    b.deposit_required,
    b.deposit_paid,
    b.balance_due,
    b.currency,
    b.created_at
  FROM public.bookings b
  WHERE b.upload_token = p_upload_token;
$$;

-- ==============================================================================
-- 19. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_trip_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_reminders ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS: admin_users (Non-Recursive, Super-Admin Restricted)
-- Customers cannot view or promote themselves to admin.
-- Only active super-admins can insert, update, or delete admin memberships.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view admin_users list" ON public.admin_users;
CREATE POLICY "Admins can view admin_users list"
  ON public.admin_users FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Super admins can insert admin_users" ON public.admin_users;
CREATE POLICY "Super admins can insert admin_users"
  ON public.admin_users FOR INSERT
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can update admin_users" ON public.admin_users;
CREATE POLICY "Super admins can update admin_users"
  ON public.admin_users FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete admin_users" ON public.admin_users;
CREATE POLICY "Super admins can delete admin_users"
  ON public.admin_users FOR DELETE
  USING (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- RLS: profiles
-- Customers access own profile only; Admins can view all profiles
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admins view all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS: services
-- Public catalog read access for active items; Admins manage all items
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services"
  ON public.services FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS: bookings
-- - Customers can view ONLY their own bookings (auth.uid() = customer_id)
-- - Admins can view and filter all bookings
-- - Customers/Guests can INSERT bookings (protected fields enforced by WITH CHECK & trigger)
-- - ONLY admins can UPDATE booking records (status, amounts, confirmation)
-- - Anonymous direct SELECT returns 0 rows
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers view own bookings, admins view all" ON public.bookings;
CREATE POLICY "Customers view own bookings, admins view all"
  ON public.bookings FOR SELECT
  USING (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Customers and guests can create bookings" ON public.bookings;
CREATE POLICY "Customers and guests can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    (customer_id IS NULL OR customer_id = auth.uid())
    AND (
      public.is_admin()
      OR (
        booking_status = 'awaiting_deposit'
        AND payment_status = 'deposit_pending'
        AND deposit_paid = 0.00
        AND deposit_required = 0.00
        AND balance_due = 0.00
        AND admin_notes IS NULL
      )
    )
  );

DROP POLICY IF EXISTS "Only admins can update bookings" ON public.bookings;
CREATE POLICY "Only admins can update bookings"
  ON public.bookings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can delete bookings" ON public.bookings;
CREATE POLICY "Only admins can delete bookings"
  ON public.bookings FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS: booking_participants
-- SECURED: Removed insecure `b.customer_id IS NULL` condition.
-- Adding participants requires either active admin status, authenticated booking
-- ownership, OR possession of the booking's secret unguessable upload_token.
-- Viewing participants is strictly restricted to authenticated owners and admins.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "View participants of permitted bookings" ON public.booking_participants;
CREATE POLICY "View participants of permitted bookings"
  ON public.booking_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_participants.booking_id
        AND (
          public.is_admin()
          OR (auth.uid() IS NOT NULL AND b.customer_id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "Add participants to permitted bookings" ON public.booking_participants;
CREATE POLICY "Add participants to permitted bookings"
  ON public.booking_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_participants.booking_id
        AND (
          public.is_admin()
          OR (auth.uid() IS NOT NULL AND b.customer_id = auth.uid())
          OR (
            booking_participants.upload_token IS NOT NULL
            AND b.upload_token = booking_participants.upload_token
          )
        )
    )
  );

DROP POLICY IF EXISTS "Admins manage booking participants" ON public.booking_participants;
CREATE POLICY "Admins manage booking participants"
  ON public.booking_participants FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete booking participants" ON public.booking_participants;
CREATE POLICY "Admins delete booking participants"
  ON public.booking_participants FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS: custom_trip_requests
-- Customers view own requests; Admins view and manage all
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers view own custom trip requests" ON public.custom_trip_requests;
CREATE POLICY "Customers view own custom trip requests"
  ON public.custom_trip_requests FOR SELECT
  USING (customer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Anyone can submit a custom trip request" ON public.custom_trip_requests;
CREATE POLICY "Anyone can submit a custom trip request"
  ON public.custom_trip_requests FOR INSERT
  WITH CHECK (
    (customer_id IS NULL OR customer_id = auth.uid())
    AND (
      public.is_admin()
      OR (
        status = 'new'
        AND admin_notes IS NULL
      )
    )
  );

DROP POLICY IF EXISTS "Admins can manage custom trip requests" ON public.custom_trip_requests;
CREATE POLICY "Admins can manage custom trip requests"
  ON public.custom_trip_requests FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS: deposit_proofs
-- Redesigned Token-Verified Authorization & Path Integrity:
-- - Uploading requires admin status, authenticated booking ownership, OR possession
--   of the booking's unguessable upload_token.
-- - Storage path must strictly match `<upload_token>/%`.
-- - Direct SELECT restricted to authenticated booking owners and admins.
-- - Only admins can review/update/delete deposit proofs.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "View proofs of permitted bookings" ON public.deposit_proofs;
CREATE POLICY "View proofs of permitted bookings"
  ON public.deposit_proofs FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = deposit_proofs.booking_id
        AND auth.uid() IS NOT NULL
        AND b.customer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Upload deposit proof with verified token or ownership" ON public.deposit_proofs;
CREATE POLICY "Upload deposit proof with verified token or ownership"
  ON public.deposit_proofs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = deposit_proofs.booking_id
        AND (
          public.is_admin()
          OR (auth.uid() IS NOT NULL AND b.customer_id = auth.uid())
          OR (
            deposit_proofs.upload_token IS NOT NULL
            AND b.upload_token = deposit_proofs.upload_token
          )
        )
    )
    AND review_status = 'pending'
    AND rejection_reason IS NULL
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
  );

DROP POLICY IF EXISTS "Admins review and manage deposit proofs" ON public.deposit_proofs;
CREATE POLICY "Admins review and manage deposit proofs"
  ON public.deposit_proofs FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete deposit proofs" ON public.deposit_proofs;
CREATE POLICY "Admins delete deposit proofs"
  ON public.deposit_proofs FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS: booking_reminders
-- Strictly internal audit log: Only admins can view or record reminders
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Only admins can view booking reminders" ON public.booking_reminders;
CREATE POLICY "Only admins can view booking reminders"
  ON public.booking_reminders FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can insert booking reminders" ON public.booking_reminders;
CREATE POLICY "Only admins can insert booking reminders"
  ON public.booking_reminders FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage booking reminders" ON public.booking_reminders;
CREATE POLICY "Only admins can manage booking reminders"
  ON public.booking_reminders FOR ALL
  USING (public.is_admin());

-- ==============================================================================
-- 20. STORAGE BUCKET CONFIGURATION & POLICIES (deposit-proofs)
-- ==============================================================================
-- Configures the private storage bucket and enforces storage.objects RLS policies
-- Path convention: <upload_token>/<filename>
DO $$ BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'deposit-proofs',
    'deposit-proofs',
    false, -- Strictly Private: direct public URL access is disabled
    10485760, -- Max file size: 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
  ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Supabase manages RLS on storage.objects; do not ALTER TABLE ownership/RLS here.

-- Storage Policy: INSERT
-- Allows upload ONLY if target folder matches a verified, unguessable upload_token of an active booking
DROP POLICY IF EXISTS "Permitted uploaders can insert deposit proofs" ON storage.objects;
CREATE POLICY "Permitted uploaders can insert deposit proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'deposit-proofs'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.upload_token::text = (storage.foldername(name))[1]
          AND b.booking_status IN ('awaiting_deposit', 'deposit_under_review')
      )
    )
  );

-- Storage Policy: SELECT
-- Download/read restricted to active admins and authenticated booking owners (via signed URLs)
DROP POLICY IF EXISTS "Admins and booking owners can view deposit proofs" ON storage.objects;
CREATE POLICY "Admins and booking owners can view deposit proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'deposit-proofs'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.upload_token::text = (storage.foldername(name))[1]
          AND auth.uid() IS NOT NULL
          AND b.customer_id = auth.uid()
      )
    )
  );

-- Storage Policy: UPDATE
-- Strictly admins only (prevent overwriting or tampering with uploaded proofs)
DROP POLICY IF EXISTS "Only admins can update deposit proofs in storage" ON storage.objects;
CREATE POLICY "Only admins can update deposit proofs in storage"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'deposit-proofs' AND public.is_admin())
  WITH CHECK (bucket_id = 'deposit-proofs' AND public.is_admin());

-- Storage Policy: DELETE
-- Strictly admins only
DROP POLICY IF EXISTS "Only admins can delete deposit proofs from storage" ON storage.objects;
CREATE POLICY "Only admins can delete deposit proofs from storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'deposit-proofs' AND public.is_admin());

-- ==============================================================================
-- 21. EXPLICIT TABLE & FUNCTION PRIVILEGES (Defense-in-depth)
-- ==============================================================================
-- Revoke public access to sensitive administrative and customer tables
REVOKE ALL ON public.admin_users FROM PUBLIC, anon;
REVOKE ALL ON public.booking_reminders FROM PUBLIC, anon;
REVOKE ALL ON public.profiles FROM PUBLIC, anon;

-- Catalog: Services
-- Anon and Authenticated can read catalog.
-- Authenticated role is granted INSERT, UPDATE, DELETE at table level, but
-- Row Level Security strictly enforces that ONLY active admins (public.is_admin()) can execute mutations.
REVOKE ALL ON public.services FROM PUBLIC;
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;

-- Bookings
-- Anon can insert new guest bookings (fields sanitized by trigger and RLS WITH CHECK).
-- Direct SELECT on bookings returns 0 rows for anon.
-- Authenticated role has table-level CRUD; RLS restricts customers to own rows and blocks customer updates.
REVOKE ALL ON public.bookings FROM PUBLIC;
GRANT INSERT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;

-- Booking Participants
REVOKE ALL ON public.booking_participants FROM PUBLIC;
GRANT INSERT ON public.booking_participants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_participants TO authenticated;

-- Custom Trip Requests
REVOKE ALL ON public.custom_trip_requests FROM PUBLIC;
GRANT INSERT ON public.custom_trip_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_trip_requests TO authenticated;

-- Deposit Proofs
REVOKE ALL ON public.deposit_proofs FROM PUBLIC;
GRANT INSERT ON public.deposit_proofs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deposit_proofs TO authenticated;

-- Customer Profiles
REVOKE ALL ON public.profiles FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Staff Admin Users (RLS enforces super_admin only for mutations, is_admin() for SELECT)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_users TO authenticated;

-- Internal Staff Reminders Log (RLS enforces is_admin() only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_reminders TO authenticated;

-- Function Execution Permissions
-- Only public helper functions are callable by client roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_by_token(UUID) TO anon, authenticated;

-- Service Role (Full administrative access for server-only background actions & admin operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Revoke direct RPC execution on internal trigger procedures from PUBLIC
REVOKE ALL ON FUNCTION public.enforce_booking_security() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_booking_participant_security() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_deposit_proof_integrity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
