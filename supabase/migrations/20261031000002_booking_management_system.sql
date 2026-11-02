-- ==============================================================================
-- MZ Tourism Qatar — Phase 4: Complete Booking Management & Financial Ledger
-- Migration: 20261031000002_booking_management_system.sql
-- ==============================================================================

-- 1. Extend public.bookings with cancellation, completion and audit fields
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(10, 2) DEFAULT 0.00;

-- Backfill total_price for existing rows
UPDATE public.bookings
SET total_price = COALESCE(deposit_required, 0) + COALESCE(balance_due, 0)
WHERE total_price IS NULL OR total_price = 0;

-- 2. Create Payment Ledger Table (Single Source of Truth for verified payments)
CREATE TABLE IF NOT EXISTS public.booking_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit', 'balance', 'full', 'refund')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'QAR',
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'cash', 'credit_card', 'pos_terminal', 'cheque', 'other')),
  transaction_reference TEXT,
  proof_id UUID REFERENCES public.deposit_proofs(id) ON DELETE SET NULL,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_booking_payments_booking_id ON public.booking_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_payments_recorded_at ON public.booking_payments(recorded_at);

-- 3. Create Booking Timeline & Status History Table (Audit Trail)
CREATE TABLE IF NOT EXISTS public.booking_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_booking_timeline_booking_id ON public.booking_timeline(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_timeline_created_at ON public.booking_timeline(created_at);

-- 4. Create Customer Notifications Log Table (Idempotent Notification Dispatch)
CREATE TABLE IF NOT EXISTS public.customer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp', 'sms')),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('staged', 'sent', 'failed', 'skipped')),
  subject TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customer_notifications_booking ON public.customer_notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_key ON public.customer_notifications(idempotency_key);

-- 5. Row Level Security for New Tables
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;

-- Payments: Staff can read and insert
CREATE POLICY "Staff can manage all booking payments"
  ON public.booking_payments
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Payments: Customers can view their own booking payments
CREATE POLICY "Customers can view own booking payments"
  ON public.booking_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_payments.booking_id
        AND (b.customer_id = auth.uid() OR b.customer_email = auth.jwt()->>'email')
    )
  );

-- Timeline: Staff can manage all timeline events
CREATE POLICY "Staff can manage all booking timeline events"
  ON public.booking_timeline
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Timeline: Customers can view their own booking timeline
CREATE POLICY "Customers can view own booking timeline"
  ON public.booking_timeline
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_timeline.booking_id
        AND (b.customer_id = auth.uid() OR b.customer_email = auth.jwt()->>'email')
    )
  );

-- Notifications: Staff only
CREATE POLICY "Staff can view customer notifications log"
  ON public.customer_notifications
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
