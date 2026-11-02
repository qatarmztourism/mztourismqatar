-- =============================================================================
-- Migration: White-Label Customer Notifications & Welcome Email Idempotency
-- Project: MZ Tourism Qatar (gcc-tourism-platform)
-- =============================================================================

-- Add welcome_email_sent_at column to public.profiles if not present
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.profiles.welcome_email_sent_at IS
'Timestamp when the prestige text-only MZ Tourism Qatar VIP welcome email was dispatched. Enforces strict single-send idempotency.';
