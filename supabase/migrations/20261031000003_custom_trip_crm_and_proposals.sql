-- =============================================================================
-- Migration: 20261031000003_custom_trip_crm_and_proposals.sql
-- Description: Phase 5: Custom Tour Request CRM, Itinerary Builder & Proposals
-- =============================================================================

-- 1. Extend custom_trip_status enum with Phase 5 lifecycle states
DO $$ BEGIN
  ALTER TYPE public.custom_trip_status ADD VALUE IF NOT EXISTS 'under_review';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.custom_trip_status ADD VALUE IF NOT EXISTS 'itinerary_in_progress';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.custom_trip_status ADD VALUE IF NOT EXISTS 'proposal_sent';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.custom_trip_status ADD VALUE IF NOT EXISTS 'revision_requested';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.custom_trip_status ADD VALUE IF NOT EXISTS 'accepted';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.custom_trip_status ADD VALUE IF NOT EXISTS 'lost';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Extend custom_trip_requests table with CRM fields
ALTER TABLE public.custom_trip_requests
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS preferred_locale TEXT NOT NULL DEFAULT 'en' CHECK (preferred_locale IN ('en', 'ar')),
  ADD COLUMN IF NOT EXISTS adults INTEGER NOT NULL DEFAULT 2 CHECK (adults >= 1),
  ADD COLUMN IF NOT EXISTS children INTEGER NOT NULL DEFAULT 0 CHECK (children >= 0),
  ADD COLUMN IF NOT EXISTS accommodation_preference TEXT,
  ADD COLUMN IF NOT EXISTS transport_preference TEXT,
  ADD COLUMN IF NOT EXISTS converted_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS converted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lost_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_custom_trip_requests_priority ON public.custom_trip_requests(priority);
CREATE INDEX IF NOT EXISTS idx_custom_trip_requests_assigned ON public.custom_trip_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_custom_trip_requests_follow_up ON public.custom_trip_requests(follow_up_date);

-- 3. Custom Trip Activity Timeline Table (Audit trail for status changes and CRM notes)
CREATE TABLE IF NOT EXISTS public.custom_trip_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.custom_trip_requests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT,
  actor_role TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_custom_trip_timeline_inquiry ON public.custom_trip_timeline(inquiry_id, created_at DESC);

-- 4. Custom Trip Communication Messages & Internal Notes
CREATE TABLE IF NOT EXISTS public.custom_trip_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.custom_trip_requests(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'customer', 'concierge', 'system')),
  sender_name TEXT NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'portal' CHECK (channel IN ('portal', 'email', 'whatsapp', 'internal_note')),
  message TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_custom_trip_messages_inquiry ON public.custom_trip_messages(inquiry_id, created_at ASC);

-- 5. Custom Proposals & Quotation Engine Table
CREATE TABLE IF NOT EXISTS public.custom_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_ref TEXT NOT NULL UNIQUE,
  inquiry_id UUID NOT NULL REFERENCES public.custom_trip_requests(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '30 days'),
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'revision_requested', 'accepted', 'declined', 'converted', 'superseded')),
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  summary_en TEXT,
  summary_ar TEXT,
  valid_until DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'QAR' CHECK (currency = 'QAR'),
  pricing_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  deposit_required NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (deposit_required >= 0),
  balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (balance_due >= 0),
  itinerary_days JSONB NOT NULL DEFAULT '[]'::jsonb,
  inclusions_en TEXT[] NOT NULL DEFAULT '{}',
  inclusions_ar TEXT[] NOT NULL DEFAULT '{}',
  exclusions_en TEXT[] NOT NULL DEFAULT '{}',
  exclusions_ar TEXT[] NOT NULL DEFAULT '{}',
  terms_en TEXT,
  terms_ar TEXT,
  customer_notes TEXT,
  internal_notes TEXT,
  customer_feedback TEXT,
  customer_action_at TIMESTAMPTZ,
  converted_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_custom_proposals_inquiry ON public.custom_proposals(inquiry_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_custom_proposals_ref ON public.custom_proposals(proposal_ref);
CREATE INDEX IF NOT EXISTS idx_custom_proposals_guest_token ON public.custom_proposals(guest_token);
CREATE INDEX IF NOT EXISTS idx_custom_proposals_customer ON public.custom_proposals(customer_id);

-- 6. Configure Row Level Security (RLS)
ALTER TABLE public.custom_trip_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_trip_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_proposals ENABLE ROW LEVEL SECURITY;

-- Staff clearance policies:
DROP POLICY IF EXISTS "Staff manage custom trip timeline" ON public.custom_trip_timeline;
CREATE POLICY "Staff manage custom trip timeline"
  ON public.custom_trip_timeline FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid() AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Staff manage custom trip messages" ON public.custom_trip_messages;
CREATE POLICY "Staff manage custom trip messages"
  ON public.custom_trip_messages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid() AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Staff manage custom proposals" ON public.custom_proposals;
CREATE POLICY "Staff manage custom proposals"
  ON public.custom_proposals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid() AND admin_users.is_active = true
    )
  );

-- Customer self-ownership policies:
DROP POLICY IF EXISTS "Customers view own trip messages" ON public.custom_trip_messages;
CREATE POLICY "Customers view own trip messages"
  ON public.custom_trip_messages FOR SELECT
  TO authenticated
  USING (
    is_internal = false AND
    EXISTS (
      SELECT 1 FROM public.custom_trip_requests
      WHERE custom_trip_requests.id = custom_trip_messages.inquiry_id
        AND custom_trip_requests.customer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Customers view own proposals" ON public.custom_proposals;
CREATE POLICY "Customers view own proposals"
  ON public.custom_proposals FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.custom_trip_requests
      WHERE custom_trip_requests.id = custom_proposals.inquiry_id
        AND custom_trip_requests.customer_id = auth.uid()
    )
  );

-- Grants
REVOKE ALL ON public.custom_trip_timeline FROM PUBLIC, anon;
REVOKE ALL ON public.custom_trip_messages FROM PUBLIC, anon;
REVOKE ALL ON public.custom_proposals FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_trip_timeline TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_trip_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_proposals TO authenticated;

GRANT ALL ON public.custom_trip_timeline TO service_role;
GRANT ALL ON public.custom_trip_messages TO service_role;
GRANT ALL ON public.custom_proposals TO service_role;
