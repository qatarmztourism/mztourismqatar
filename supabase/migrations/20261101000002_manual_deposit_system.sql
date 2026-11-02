-- =============================================================================
-- MZ Tourism Qatar — Phase 8: Manual Deposit & Booking Confirmation System
-- Migration: 20261101000002_manual_deposit_system.sql
-- Description:
--   1. Configures private Supabase Storage bucket 'payment-proofs' (public: false, 10MB limit)
--   2. Enforces strict RLS policies on storage.objects for 'payment-proofs'
--   3. Extends public.deposit_proofs with manual payment method, submitted amount,
--      admin confirmed amount, transaction ref, payment date, and customer notes
--   4. Extends public.booking_payments ledger to support all manual payment methods
--   5. Updates server-side protection trigger enforce_deposit_proof_integrity()
--   6. Extends public.cms_site_settings with manual payment instructions & deposit policy
-- =============================================================================

-- 1. Private Storage Bucket Configuration (payment-proofs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 2. Storage Row Level Security Policies for payment-proofs
-- INSERT: Permitted uploaders (admins or guests with matching active upload_token)
DROP POLICY IF EXISTS "Permitted uploaders can insert payment proofs" ON storage.objects;
CREATE POLICY "Permitted uploaders can insert payment proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.upload_token::text = (storage.foldername(name))[1]
          AND b.booking_status IN ('awaiting_deposit', 'deposit_under_review')
      )
    )
  );

-- SELECT: Admins and authenticated booking owners (or short-lived server signed URLs)
DROP POLICY IF EXISTS "Admins and booking owners can view payment proofs" ON storage.objects;
CREATE POLICY "Admins and booking owners can view payment proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
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

-- UPDATE: Admins only (prevent overwriting or tampering with uploaded proofs)
DROP POLICY IF EXISTS "Only admins can update payment proofs in storage" ON storage.objects;
CREATE POLICY "Only admins can update payment proofs in storage"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'payment-proofs' AND public.is_admin())
  WITH CHECK (bucket_id = 'payment-proofs' AND public.is_admin());

-- DELETE: Admins only
DROP POLICY IF EXISTS "Only admins can delete payment proofs from storage" ON storage.objects;
CREATE POLICY "Only admins can delete payment proofs from storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'payment-proofs' AND public.is_admin());

-- 3. Extend public.deposit_proofs Table
ALTER TABLE public.deposit_proofs
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  ADD COLUMN IF NOT EXISTS custom_payment_method TEXT,
  ADD COLUMN IF NOT EXISTS amount_submitted NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS admin_confirmed_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS transaction_ref TEXT,
  ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS customer_notes TEXT,
  ADD COLUMN IF NOT EXISTS bucket_id TEXT NOT NULL DEFAULT 'payment-proofs';

CREATE INDEX IF NOT EXISTS idx_deposit_proofs_payment_method ON public.deposit_proofs(payment_method);
CREATE INDEX IF NOT EXISTS idx_deposit_proofs_payment_date ON public.deposit_proofs(payment_date);

-- 4. Extend public.booking_payments Ledger Table
ALTER TABLE public.booking_payments
  DROP CONSTRAINT IF EXISTS booking_payments_payment_method_check;

ALTER TABLE public.booking_payments
  ADD CONSTRAINT booking_payments_payment_method_check
  CHECK (payment_method IN ('bank_transfer', 'jazzcash', 'easypaisa', 'cash_office', 'cash', 'credit_card', 'pos_terminal', 'cheque', 'other'));

ALTER TABLE public.booking_payments
  ADD COLUMN IF NOT EXISTS custom_payment_method TEXT,
  ADD COLUMN IF NOT EXISTS amount_submitted NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (verification_status IN ('pending', 'confirmed', 'rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 5. Extend public.cms_site_settings Table with Manual Payment Instructions & Deposit Rules
ALTER TABLE public.cms_site_settings
  ADD COLUMN IF NOT EXISTS deposit_default_percentage INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS payment_bank_transfer_instructions_en TEXT DEFAULT 'Please initiate your manual bank transfer using the coordinates provided by our concierge. Quote your booking reference in the transfer remarks and upload your official transfer receipt.',
  ADD COLUMN IF NOT EXISTS payment_bank_transfer_instructions_ar TEXT DEFAULT 'يرجى تحويل مبلغ العربون عبر التحويل المصرفي المباشر. يرجى تدوين رمز الحجز في خانة ملاحظات التحويل ورفع إيصال التحويل البنكي.',
  ADD COLUMN IF NOT EXISTS payment_jazzcash_instructions_en TEXT DEFAULT 'Transfer to our verified JazzCash business coordinates provided by concierge. Enter your transaction ID (TID) and attach your payment confirmation screenshot.',
  ADD COLUMN IF NOT EXISTS payment_jazzcash_instructions_ar TEXT DEFAULT 'التحويل عبر حساب جاز كاش المعتمد من قبل الكونسيرج. يرجى إدخال رقم المعاملة (TID) وإرفاق لقطة شاشة لعملية التحويل.',
  ADD COLUMN IF NOT EXISTS payment_easypaisa_instructions_en TEXT DEFAULT 'Send remittance to our verified Easypaisa business account provided by concierge. Provide your TRX ID and receipt screenshot.',
  ADD COLUMN IF NOT EXISTS payment_easypaisa_instructions_ar TEXT DEFAULT 'إرسال الحوالة إلى حساب إيزي بيسا المعتمد من الكونسيرج. يرجى كتابة رقم المعاملة (TRX ID) وإرفاق إشعار السداد.',
  ADD COLUMN IF NOT EXISTS payment_cash_office_instructions_en TEXT DEFAULT 'Cash settlements are welcomed at our concierge headquarters in West Bay Diplomatic District, Doha. Our finance officer will issue a stamped official voucher upon receipt.',
  ADD COLUMN IF NOT EXISTS payment_cash_office_instructions_ar TEXT DEFAULT 'نرحب بالسداد النقدي في مقر الكونسيرج بمنطقة الخليج الغربي الدبلوماسية بالدوحة. سيقوم موظف المالية بتسليمكم سند قبض معتمد ومختوم.',
  ADD COLUMN IF NOT EXISTS payment_other_instructions_en TEXT DEFAULT 'For custom, corporate or third-party payment arrangements, coordinate directly with our operations desk and provide full settlement documentation.',
  ADD COLUMN IF NOT EXISTS payment_other_instructions_ar TEXT DEFAULT 'لترتيبات الدفع الخاصة أو المؤسسية أو عبر أطراف أخرى، يرجى التنسيق مع إدارة العمليات وتقديم كافة وثائق السداد المعتمدة.';

-- 6. Update Server-Side Protection Trigger on Deposit Proofs (Integrity & Replacement Validation)
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
  -- (awaiting_deposit covers initial submission and replacement submissions after rejection)
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
  IF new.storage_path LIKE '%..%' OR new.storage_path LIKE '%//%' THEN
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

  -- Abuse prevention: Limit max 10 deposit proofs per booking (supports replacement proofs)
  SELECT count(*) INTO v_proof_count
  FROM public.deposit_proofs
  WHERE booking_id = new.booking_id;

  IF v_proof_count >= 10 THEN
    RAISE EXCEPTION 'Maximum upload limit reached for this booking.';
  END IF;

  -- Enforce initial review state (customers cannot self-confirm or bypass admin approval)
  new.review_status := 'pending';
  new.rejection_reason := NULL;
  new.reviewed_by := NULL;
  new.reviewed_at := NULL;
  new.admin_confirmed_amount := NULL;
  new.uploaded_at := timezone('utc'::text, now());
  new.bucket_id := COALESCE(new.bucket_id, 'payment-proofs');

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_deposit_proof_integrity ON public.deposit_proofs;
CREATE TRIGGER trigger_enforce_deposit_proof_integrity
  BEFORE INSERT OR UPDATE ON public.deposit_proofs
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_deposit_proof_integrity();
