-- =============================================================================
-- Migration: 20261101000001_cms_system.sql
-- Description: Phase 6 Content Management System (CMS) for MZ Tourism Qatar
-- Tables: cms_site_settings, cms_homepage_sections, cms_pages, cms_faqs,
--         cms_testimonials, cms_navigation, cms_media
-- Storage: cms-media (public bucket, admin-gated upload)
-- =============================================================================

-- 1. Site-wide Settings & Global SEO
CREATE TABLE IF NOT EXISTS public.cms_site_settings (
  id text PRIMARY KEY DEFAULT 'default',
  site_title_en text NOT NULL DEFAULT 'MZ Tourism Qatar | Luxury Tours & Concierge',
  site_title_ar text NOT NULL DEFAULT 'إم زد للسياحة قطر | جولات فاخرة وخدمات كونسيرج راقية',
  site_tagline_en text NOT NULL DEFAULT 'Luxury Tours & Bespoke Arabian Concierge',
  site_tagline_ar text NOT NULL DEFAULT 'جولات فاخرة وخدمات الضيافة العربية الراقية',
  site_description_en text NOT NULL DEFAULT 'Curated luxury desert safaris, private royal dhow charters, and bespoke VIP cultural concierge in Doha, State of Qatar.',
  site_description_ar text NOT NULL DEFAULT 'رحلات سفاري صحراوية فاخرة، يخوت ومحامل ملكية خاصة، وخدمات كونسيرج سياحية مخصصة لكبار الشخصيات في الدوحة، دولة قطر.',
  contact_email text NOT NULL DEFAULT 'qatarmztourism@gmail.com',
  contact_phone text NOT NULL DEFAULT '+974 7038 6705',
  contact_whatsapp text NOT NULL DEFAULT '97470386705',
  contact_address_en text NOT NULL DEFAULT 'West Bay Diplomatic District, Doha, State of Qatar',
  contact_address_ar text NOT NULL DEFAULT 'منطقة الخليج الغربي الدبلوماسية، الدوحة، دولة قطر',
  social_instagram text DEFAULT 'https://instagram.com/mztourismqatar',
  social_facebook text DEFAULT 'https://facebook.com/mztourismqatar',
  social_twitter text DEFAULT 'https://twitter.com/mztourismqatar',
  social_linkedin text DEFAULT '',
  seo_og_image text DEFAULT 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  seo_canonical_url text DEFAULT 'https://mztourismqatar.qa',
  footer_about_en text DEFAULT 'Specialized luxury tour operator in Doha, Qatar. Dedicated to uncompromising Arabian hospitality, private fleet expeditions, and bespoke concierge journeys.',
  footer_about_ar text DEFAULT 'مشغل سياحي فاخر متخصص في الدوحة، قطر. ملتزمون بتقديم الضيافة العربية الأصيلة، رحلات الأسطول الخاص، والتجارب الاستثنائية المصممة حسب الطلب.',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL
);

-- 2. Homepage Section Builder
CREATE TABLE IF NOT EXISTS public.cms_homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  title_en text,
  title_ar text,
  subtitle_en text,
  subtitle_ar text,
  content_en text,
  content_ar text,
  media_url text,
  cta_primary_label_en text,
  cta_primary_label_ar text,
  cta_primary_url text,
  cta_secondary_label_en text,
  cta_secondary_label_ar text,
  cta_secondary_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  display_order int NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL
);

-- 3. Static Pages (About, Contact, Privacy, Terms, Cancellation)
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title_en text NOT NULL,
  title_ar text NOT NULL,
  excerpt_en text,
  excerpt_ar text,
  content_en text NOT NULL,
  content_ar text NOT NULL,
  hero_image text,
  meta_title_en text,
  meta_title_ar text,
  meta_description_en text,
  meta_description_ar text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL
);

-- 4. Frequently Asked Questions (FAQ)
CREATE TABLE IF NOT EXISTS public.cms_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'general',
  question_en text NOT NULL,
  question_ar text NOT NULL,
  answer_en text NOT NULL,
  answer_ar text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Customer Testimonials (Authentic, manual approval only)
CREATE TABLE IF NOT EXISTS public.cms_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_title_en text,
  customer_title_ar text,
  content_en text NOT NULL,
  content_ar text NOT NULL,
  rating int NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  avatar_url text,
  display_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false, -- New reviews are unpublished by default
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Navigation and Footer Links
CREATE TABLE IF NOT EXISTS public.cms_navigation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL DEFAULT 'header' CHECK (location IN ('header', 'footer_quick_links', 'footer_experiences', 'footer_legal')),
  label_en text NOT NULL,
  label_ar text NOT NULL,
  url text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Media Library Records
CREATE TABLE IF NOT EXISTS public.cms_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  storage_path text UNIQUE NOT NULL,
  public_url text NOT NULL,
  mime_type text NOT NULL,
  file_size int NOT NULL,
  title_en text,
  title_ar text,
  alt_en text,
  alt_ar text,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('hero', 'destinations', 'experiences', 'editorial', 'banners', 'general')),
  uploaded_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 8. Storage Bucket for CMS Media
DO $$ BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'cms-media',
    'cms-media',
    true, -- Publicly readable for website assets
    10485760, -- Max file size: 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
  )
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'];
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- 9. Row Level Security (RLS) Configuration

-- Enable RLS on all CMS tables
ALTER TABLE public.cms_site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;

-- A. Public Read Policies
DROP POLICY IF EXISTS "Public can view site settings" ON public.cms_site_settings;
CREATE POLICY "Public can view site settings"
  ON public.cms_site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can view enabled homepage sections" ON public.cms_homepage_sections;
CREATE POLICY "Public can view enabled homepage sections"
  ON public.cms_homepage_sections FOR SELECT
  USING (is_enabled = true);

DROP POLICY IF EXISTS "Public can view published pages" ON public.cms_pages;
CREATE POLICY "Public can view published pages"
  ON public.cms_pages FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Public can view published faqs" ON public.cms_faqs;
CREATE POLICY "Public can view published faqs"
  ON public.cms_faqs FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Public can view published testimonials" ON public.cms_testimonials;
CREATE POLICY "Public can view published testimonials"
  ON public.cms_testimonials FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Public can view visible navigation" ON public.cms_navigation;
CREATE POLICY "Public can view visible navigation"
  ON public.cms_navigation FOR SELECT
  USING (is_visible = true);

DROP POLICY IF EXISTS "Public can view cms media records" ON public.cms_media;
CREATE POLICY "Public can view cms media records"
  ON public.cms_media FOR SELECT
  USING (true);

-- B. Staff Operational Policies
DROP POLICY IF EXISTS "Staff can manage site settings" ON public.cms_site_settings;
CREATE POLICY "Staff can manage site settings"
  ON public.cms_site_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid() AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Staff can manage homepage sections" ON public.cms_homepage_sections;
CREATE POLICY "Staff can manage homepage sections"
  ON public.cms_homepage_sections FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid() AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Staff can manage pages" ON public.cms_pages;
CREATE POLICY "Staff can manage pages"
  ON public.cms_pages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid() AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Staff can manage faqs" ON public.cms_faqs;
CREATE POLICY "Staff can manage faqs"
  ON public.cms_faqs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid() AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Staff can manage testimonials" ON public.cms_testimonials;
CREATE POLICY "Staff can manage testimonials"
  ON public.cms_testimonials FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid() AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Staff can manage navigation" ON public.cms_navigation;
CREATE POLICY "Staff can manage navigation"
  ON public.cms_navigation FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid() AND admin_users.is_active = true));

DROP POLICY IF EXISTS "Staff can manage cms media" ON public.cms_media;
CREATE POLICY "Staff can manage cms media"
  ON public.cms_media FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid() AND admin_users.is_active = true));

-- C. Storage RLS for cms-media
DROP POLICY IF EXISTS "Public can read cms media bucket" ON storage.objects;
CREATE POLICY "Public can read cms media bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cms-media');

DROP POLICY IF EXISTS "Staff can upload to cms media bucket" ON storage.objects;
CREATE POLICY "Staff can upload to cms media bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cms-media' AND
    EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid() AND admin_users.is_active = true)
  );

DROP POLICY IF EXISTS "Staff can delete from cms media bucket" ON storage.objects;
CREATE POLICY "Staff can delete from cms media bucket"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cms-media' AND
    EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.id = auth.uid() AND admin_users.is_active = true)
  );

-- 10. Seed Initial Verified Content

-- Default Site Settings
INSERT INTO public.cms_site_settings (id, site_title_en, site_title_ar)
VALUES ('default', 'MZ Tourism Qatar | Luxury Tours & Concierge', 'إم زد للسياحة قطر | جولات فاخرة وخدمات كونسيرج راقية')
ON CONFLICT (id) DO NOTHING;

-- Initial Homepage Sections
INSERT INTO public.cms_homepage_sections (section_key, title_en, title_ar, subtitle_en, subtitle_ar, content_en, content_ar, media_url, cta_primary_label_en, cta_primary_label_ar, cta_primary_url, cta_secondary_label_en, cta_secondary_label_ar, cta_secondary_url, display_order)
VALUES
(
  'hero',
  'Experience the Soul of Qatar in Uncompromising Luxury',
  'اكتشف أصالة قطر في قمة الفخامة والخصوصية',
  'Bespoke Concierge & Private Expeditions',
  'كونسيرج خاص ورحلات استكشافية حصرية',
  'Curated desert safaris to the singing sands of Khor Al Adaid, private royal dhow cruises across West Bay, and elite VIP cultural access through Doha’s iconic sanctuaries.',
  'رحلات سفاري صحراوية خاصة إلى رمال خور العديد الساحرة، جولات بحرية على متن محامل ويخوت ملكية خاصة في الخليج الغربي، وتجارب ثقافية حصرية في معالم الدوحة التراثية.',
  'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1920&q=80',
  'Explore Signature Tours',
  'استكشف الجولات المميزة',
  '#experiences',
  'Chat with Private Concierge',
  'تواصل مع الكونسيرج الخاص',
  'https://wa.me/97470386705',
  0
),
(
  'why_us',
  'The Standards of Royal Qatari Hospitality',
  'معايير الضيافة القطرية الملكية',
  'Why MZ Tourism Qatar',
  'لماذا تختار إم زد للسياحة',
  'Built upon genuine Arabian hospitality, executive precision, and uncompromised privacy for world travelers and dignitaries.',
  'مرتكزون على أصالة كرم الضيافة العربية، الدقة التنفيذية، والخصوصية التامة للمسافرين المميزين والدبلوماسيين.',
  NULL,
  'Reserve VIP Experience',
  'احجز تجربة كبار الشخصيات',
  '#booking-engine',
  NULL,
  NULL,
  NULL,
  1
)
ON CONFLICT (section_key) DO NOTHING;

-- Initial Core Pages
INSERT INTO public.cms_pages (slug, title_en, title_ar, excerpt_en, excerpt_ar, content_en, content_ar, meta_title_en, meta_title_ar, meta_description_en, meta_description_ar, status)
VALUES
(
  'about',
  'About MZ Tourism Qatar',
  'عن إم زد للسياحة قطر',
  'Discover the heritage, leadership, and operational standards behind Qatar’s premier bespoke tourism agency.',
  'تعرف على رؤية وريادة ومعايير كونسيرج السياحة الفاخرة الأرقى في دولة قطر.',
  'At MZ Tourism Qatar, we believe that true luxury lies in privacy, seamless precision, and genuine cultural reverence. Operating from the diplomatic heart of Doha, we craft tailor-made journeys for discerning travelers, diplomats, and international families who seek unforgettable Arabian experiences without compromise. Every vehicle in our fleet is private, air-conditioned, and maintained to the highest safety and hospitality benchmarks.',
  'في إم زد للسياحة قطر، نؤمن بأن الفخامة الحقيقية تكمن في الخصوصية، الدقة المتناهية، والاحتفاء الصادق بالثقافة القطرية الأصيلة. انطلاقاً من الحي الدبلوماسي في قلب الدوحة، نصمم رحلات استثنائية للمسافرين النخبويين والدبلوماسيين والعائلات الذين ينشدون تجارب خليجية فريدة دون أي مساومة. أسطولنا خاص بالكامل، مجهز بأعلى درجات الراحة والأمان، ويقوده مرشدون وسائقون معتمدون.',
  'About Us | MZ Tourism Qatar Luxury Expeditions',
  'من نحن | إم زد للسياحة قطر للرحلات الفاخرة',
  'Learn about MZ Tourism Qatar, Doha’s premier luxury tourism provider specializing in private desert expeditions, dhow charters, and VIP concierge.',
  'تعرف على شركة إم زد للسياحة قطر، الرائدة في تقديم أرقى الرحلات السياحية والجولات الخاصة في الدوحة ودولة قطر.',
  'published'
),
(
  'contact',
  'Connect with Private Concierge',
  'تواصل مع مكتب الكونسيرج الخاص',
  'Our dedicated luxury travel advisors in Doha are at your disposal 24/7 for tailored itineraries and corporate requests.',
  'مستشارو السفر الفاخر في الدوحة في خدمتكم على مدار الساعة لتصميم برامجكم السياحية وتلبية طلباتكم الخاصة.',
  'Whether you are planning an intimate desert retreat to Khor Al Adaid, a VIP corporate delegation transit, or a private island yacht charter, our Doha Operations Desk provides direct, confidential concierge coordination.',
  'سواء كنتم تخططون لرحلة صحراوية خاصة إلى خور العديد، أو استقبال وفد رسمي، أو رحلة بحرية فاخرة، يوفر مكتب عمليات الدوحة تنسيقاً مباشراً وسرياً يلبي كافة تطلعاتكم.',
  'Contact Concierge | MZ Tourism Qatar',
  'اتصل بنا | إم زد للسياحة قطر',
  'Reach MZ Tourism Qatar in Doha. WhatsApp, email, or telephone concierge booking for private tours and VIP charters.',
  'تواصل مع إم زد للسياحة قطر في الدوحة عبر الواتساب أو الهاتف أو البريد الإلكتروني لحجز الجولات الخاصة.',
  'published'
),
(
  'privacy-policy',
  'Privacy & Confidentiality Policy',
  'سياسة الخصوصية وسرية البيانات',
  'Official privacy commitment and data handling standards for MZ Tourism Qatar guests.',
  'التزامنا الرسمي بحماية بيانات وخصوصية ضيوف إم زد للسياحة قطر.',
  'MZ Tourism Qatar is committed to the highest standards of discretion and client confidentiality. Personal information collected through our reservation and inquiry forms—including names, contact numbers, travel dates, and payment transfer receipts—is used strictly for concierge coordination, security clearance, and official expedition manifests. We never sell, lease, or share client data with third-party advertisers.',
  'تلتزم إم زد للسياحة قطر بأعلى معايير السرية والخصوصية لضيوفها الكرام. تُستخدم البيانات الشخصية المجمعة من خلال نماذج الحجز والاستفسار حصرياً لأغراض التنسيق السياحي، إصدار التصاريح الأمنية، وتنظيم الرحلات. لا نقوم على الإطلاق ببيع أو مشاركة بيانات العملاء مع أي أطراف تسويقية أو تجارية خارجية.',
  'Privacy Policy | MZ Tourism Qatar',
  'سياسة الخصوصية | إم زد للسياحة قطر',
  'Read the official privacy and confidentiality policy of MZ Tourism Qatar.',
  'اطلع على سياسة الخصوصية وسرية البيانات الرسمية لشركة إم زد للسياحة قطر.',
  'published'
),
(
  'terms-conditions',
  'Terms of Service & Booking Conditions',
  'الشروط والأحكام واتفاقية الحجز',
  'Standard conditions governing bespoke bookings, vehicle dispatches, and guest conduct.',
  'الشروط المنظمة للحجوزات الخاصة وتخصيص الأسطول والالتزامات الميدانية.',
  'All reservations with MZ Tourism Qatar are subject to direct confirmation by our operations desk. Due to desert climate and tidal conditions at Khor Al Adaid (Inland Sea), expedition schedules may be subject to minor operational adjustments to guarantee maximum guest safety and comfort. Private fleet charters require verified deposit remittal before dispatch.',
  'تخضع كافة الحجوزات مع إم زد للسياحة قطر لتأكيد مباشر من مكتب العمليات. نظراً لطبيعة المناخ الصحراوي وظروف المد والجزر في خور العديد، قد تخضع مواعيد الانطلاق لتعديلات طفيفة لضمان أقصى درجات السلامة والراحة. يتطلب تخصيص الأسطول الخاص إيداع العربون المعتمد مسبقاً.',
  'Terms & Conditions | MZ Tourism Qatar',
  'الشروط والأحكام | إم زد للسياحة قطر',
  'Official terms of service and reservation conditions for MZ Tourism Qatar.',
  'الشروط والأحكام الرسمية لحجوزات وخدمات إم زد للسياحة قطر.',
  'published'
),
(
  'cancellation-policy',
  'Cancellation & Refund Policy',
  'سياسة الإلغاء والاسترجاع',
  'Transparent refund guidelines for weather advisories, schedule changes, and guest cancellations.',
  'إرشادات واضحة للاسترجاع وتعديل المواعيد والظروف الجوية الطارئة.',
  'MZ Tourism Qatar provides generous, transparent cancellation terms: Cancellations submitted at least 24 hours prior to scheduled departure are eligible for a full refund or complimentary rescheduling. In the rare event of severe weather advisories issued by Qatar Civil Aviation or Qatar Coast Guard, expeditions will be rescheduled without penalty.',
  'توفر إم زد للسياحة قطر سياسة مرنة وشفافة: يحق للعميل الإلغاء أو إعادة الجدولة مجاناً عند الإخطار قبل 24 ساعة من موعد الانطلاق. في حال صدور تحذيرات جوية رسمية من الأرصاد الجوية أو خفر السواحل القطري، تتم إعادة جدولة الرحلة دون أي رسوم إضافية.',
  'Cancellation Policy | MZ Tourism Qatar',
  'سياسة الإلغاء | إم زد للسياحة قطر',
  'Official cancellation and refund policy for MZ Tourism Qatar luxury expeditions.',
  'سياسة الإلغاء والاسترجاع الرسمية لرحلات وجولات إم زد للسياحة قطر.',
  'published'
)
ON CONFLICT (slug) DO NOTHING;

-- Initial Navigation Links
INSERT INTO public.cms_navigation (location, label_en, label_ar, url, display_order)
VALUES
('header', 'Home', 'الرئيسية', '/', 0),
('header', 'Experiences', 'التجارب السياحية', '/services', 1),
('header', 'About Us', 'من نحن', '/about', 2),
('header', 'Editorial Guides', 'دليل السفر', '/blog', 3),
('header', 'FAQs', 'الأسئلة الشائعة', '/faq', 4),
('header', 'Contact', 'اتصل بنا', '/contact', 5),
('footer_quick_links', 'Explore Tours', 'استكشف الجولات', '/services', 0),
('footer_quick_links', 'Editorial Guides', 'دليل السفر', '/blog', 1),
('footer_quick_links', 'About MZ Tourism', 'عن إم زد للسياحة', '/about', 2),
('footer_quick_links', 'Frequently Asked Questions', 'الأسئلة الشائعة', '/faq', 3),
('footer_quick_links', 'Contact Concierge', 'تواصل مع الكونسيرج', '/contact', 4),
('footer_legal', 'Privacy & Confidentiality', 'سياسة الخصوصية', '/privacy-policy', 0),
('footer_legal', 'Terms & Conditions', 'الشروط والأحكام', '/terms-conditions', 1),
('footer_legal', 'Cancellation Policy', 'سياسة الإلغاء', '/cancellation-policy', 2)
ON CONFLICT DO NOTHING;
