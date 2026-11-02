-- ==============================================================================
-- MZ Tourism Qatar — Phase 3: Complete Tour Management System Schema
-- Migration: 20261031000001_tour_management_system.sql
-- ==============================================================================

-- 1. Extend public.services table with comprehensive luxury tour fields
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS short_description_en TEXT,
  ADD COLUMN IF NOT EXISTS short_description_ar TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_ar TEXT,
  ADD COLUMN IF NOT EXISTS destinations TEXT[] DEFAULT ARRAY['Doha']::TEXT[],
  ADD COLUMN IF NOT EXISTS tour_type TEXT NOT NULL DEFAULT 'private' CHECK (tour_type IN ('private', 'group')),
  ADD COLUMN IF NOT EXISTS difficulty_level TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'moderate', 'challenging')),
  ADD COLUMN IF NOT EXISTS max_altitude TEXT DEFAULT 'Sea Level / Dunes',
  ADD COLUMN IF NOT EXISTS min_participants INTEGER NOT NULL DEFAULT 1 CHECK (min_participants > 0),
  ADD COLUMN IF NOT EXISTS max_participants INTEGER NOT NULL DEFAULT 6 CHECK (max_participants >= min_participants),
  ADD COLUMN IF NOT EXISTS pricing_type TEXT NOT NULL DEFAULT 'per_private_tour' CHECK (pricing_type IN ('per_person', 'per_private_tour')),
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_price >= 0),
  ADD COLUMN IF NOT EXISTS deposit_type TEXT NOT NULL DEFAULT 'percentage' CHECK (deposit_type IN ('percentage', 'fixed')),
  ADD COLUMN IF NOT EXISTS deposit_value NUMERIC(10, 2) NOT NULL DEFAULT 30.00 CHECK (deposit_value >= 0),
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'QAR',
  ADD COLUMN IF NOT EXISTS pickup_info_en TEXT,
  ADD COLUMN IF NOT EXISTS pickup_info_ar TEXT,
  ADD COLUMN IF NOT EXISTS itinerary JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS inclusions_en TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS inclusions_ar TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS exclusions_en TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS exclusions_ar TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS required_gear_en TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS required_gear_ar TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS important_info_en TEXT,
  ADD COLUMN IF NOT EXISTS important_info_ar TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_policy_en TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_policy_ar TEXT,
  ADD COLUMN IF NOT EXISTS seo_title_en TEXT,
  ADD COLUMN IF NOT EXISTS seo_title_ar TEXT,
  ADD COLUMN IF NOT EXISTS seo_description_en TEXT,
  ADD COLUMN IF NOT EXISTS seo_description_ar TEXT,
  ADD COLUMN IF NOT EXISTS featured_image TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Sync slug with id for legacy rows
UPDATE public.services SET slug = id WHERE slug IS NULL;

-- 2. Performance Indexes on Services / Tours
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status, is_active);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_tour_type ON public.services(tour_type);

-- 3. Create Tour Departures Table (Multiple departure slots per tour with capacity protection)
CREATE TABLE IF NOT EXISTS public.tour_departures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  departure_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  capacity INTEGER NOT NULL DEFAULT 6 CHECK (capacity > 0),
  reserved_seats INTEGER NOT NULL DEFAULT 0 CHECK (reserved_seats >= 0),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'sold_out', 'cancelled')),
  pricing_override NUMERIC(10, 2) CHECK (pricing_override IS NULL OR pricing_override >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_tour_departure UNIQUE (tour_id, departure_date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_tour_departures_lookup ON public.tour_departures(tour_id, departure_date, status);
CREATE INDEX IF NOT EXISTS idx_tour_departures_date ON public.tour_departures(departure_date);

-- 4. Link Bookings to Departures
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS departure_id UUID REFERENCES public.tour_departures(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_departure_id ON public.bookings(departure_id);

-- 5. Row Level Security on Tour Departures
ALTER TABLE public.tour_departures ENABLE ROW LEVEL SECURITY;

-- Anyone can view open departures for published tours
DROP POLICY IF EXISTS "Public can view open departures for published tours" ON public.tour_departures;
CREATE POLICY "Public can view open departures for published tours"
  ON public.tour_departures FOR SELECT
  USING (
    status = 'open'
    AND EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.id = tour_departures.tour_id
        AND s.status = 'published'
        AND s.is_active = true
    )
    OR public.is_admin()
  );

-- Only admins can manage departures
DROP POLICY IF EXISTS "Admins can manage tour departures" ON public.tour_departures;
CREATE POLICY "Admins can manage tour departures"
  ON public.tour_departures FOR ALL
  USING (public.is_admin());

-- 6. Unified Tours View (Alias view mapping to services)
CREATE OR REPLACE VIEW public.tours AS
  SELECT * FROM public.services;

-- 7. Public Storage Bucket for Tour Media
DO $$ BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'tour-media',
    'tour-media',
    true, -- Publicly readable for web catalog images
    10485760, -- Max file size: 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  )
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Tour Media Storage RLS: Public can view, Admins can upload/manage
DROP POLICY IF EXISTS "Public can view tour media" ON storage.objects;
CREATE POLICY "Public can view tour media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tour-media');

DROP POLICY IF EXISTS "Admins can manage tour media" ON storage.objects;
CREATE POLICY "Admins can manage tour media"
  ON storage.objects FOR ALL
  USING (bucket_id = 'tour-media' AND public.is_admin());
