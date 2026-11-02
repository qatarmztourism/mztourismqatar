-- ==============================================================================
-- MZ Tourism Qatar — Blog and Luxury Travel Guides Schema
-- Migration: 20261030000001_blog_system.sql
-- ==============================================================================

-- 1. Create articles table
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  excerpt_en TEXT NOT NULL,
  excerpt_ar TEXT NOT NULL,
  content_en TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'desert_expeditions',
    'culture_heritage',
    'vip_transfers',
    'luxury_stays',
    'travel_advisory'
  )),
  cover_image TEXT,
  author_name TEXT NOT NULL DEFAULT 'MZ Concierge Editorial',
  reading_time_minutes INTEGER NOT NULL DEFAULT 5 CHECK (reading_time_minutes > 0),
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published ON public.articles(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);

-- 3. Row Level Security
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public can view ONLY published articles
DROP POLICY IF EXISTS "Public can view published articles" ON public.articles;
CREATE POLICY "Public can view published articles"
  ON public.articles FOR SELECT
  USING (is_published = true OR public.is_admin());

-- Only authenticated administrators can manage (insert, update, delete) articles
DROP POLICY IF EXISTS "Admins can manage articles" ON public.articles;
CREATE POLICY "Admins can manage articles"
  ON public.articles FOR ALL
  USING (public.is_admin());

-- 4. Initial Verified Travel Guides (Curated Editorial Content)
INSERT INTO public.articles (
  slug,
  title_en,
  title_ar,
  excerpt_en,
  excerpt_ar,
  content_en,
  content_ar,
  category,
  cover_image,
  author_name,
  reading_time_minutes,
  is_published,
  published_at
) VALUES
(
  'khor-al-adaid-inland-sea-guide',
  'The Discerning Traveler Guide to Khor Al Adaid Inland Sea',
  'الدليل الشامل للرحالة المميز إلى خور العديد والبحر الداخلي',
  'An authoritative guide to experiencing Qatar UNESCO-recognized inland sea, where colossal desert dunes meet the azure Arabian Gulf.',
  'دليل شامل لزيارة البحر الداخلي المعترف به من اليونسكو في قطر، حيث تلتقي الكثبان الرملية الذهبية بمياه الخليج العربي الزرقاء.',
  'Khor Al Adaid, situated in the southeastern corner of Qatar, is one of the only places in the world where the sea encroaches deep into the heart of the desert. Recognized by UNESCO as a natural reserve of extraordinary scenic value, this aquatic marvel features its own distinct ecosystem.\n\nReaching Khor Al Adaid requires private 4x4 vehicles piloted by certified desert marshals. The expedition navigates the towering singing sands of Mesaieed, offering guests thrilling dune ascents followed by serene vantage points over the serene tidal waters.\n\nFor the ultimate luxury experience, departures are curated in late afternoon, allowing travelers to witness sunset over the dunes before enjoying an authentic royal majlis dinner under the constellation-rich night sky.',
  'يُعد خور العديد، الواقع في الركن الجنوبي الشرقي من دولة قطر، من الأماكن النادرة في العالم التي يتوغل فيها البحر عميقاً في قلب الصحراء. صُنّف الخور كمحمية طبيعية ذات قيمة استثنائية من قبل اليونسكو ويتميز بنظامه البيئي الفريد.\n\nيتطلب الوصول إلى خور العديد مركبات دفع رباعي فاخرة يقودها سائقون محترفون ومرخصون. تنطلق الرحلة عبر كثبان مسيعيد الرملية الشاهقة، مانحة الضيوف تجربة استثنائية تجمع بين الحماسة والإطلالات الهادئة على مياه البحر.\n\nولخوض تجربة متكاملة، يُنصح بالانطلاق في فترة ما بعد الظهيرة للاستمتاع بغروب الشمس الساحر فوق الكثبان الذهبية، تليها جلسة عربية ملكية في مجلس صحراوي خاص تحت سماء الصحراء الصافية.',
  'desert_expeditions',
  'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
  'MZ Concierge Editorial',
  6,
  true,
  timezone('utc'::text, now())
),
(
  'doha-cultural-landmarks-guide',
  'Curating Culture: The Essential Doha Heritage Tour',
  'جولة التراث والثقافة: استكشاف معالم الدوحة التاريخية والحديثة',
  'From the timeless corridors of Souq Waqif to the masterpieces of the Museum of Islamic Art and Katara Cultural Village.',
  'من أروقة سوق واقف العريقة إلى روائع متحف الفن الإسلامي والقرية الثقافية كتارا، دليل متكامل لتجربة التراث القطري الأصيل.',
  'Doha presents a striking harmony between ancestral Qatari heritage and world-class architectural innovation. A bespoke cultural excursion begins at the Museum of Islamic Art (MIA), designed by I.M. Pei, showcasing fourteen centuries of islamic artistic treasures.\n\nContinuing along the waterfront Corniche, visitors arrive at Souq Waqif, the historic trading heart of Qatar. Here, specialized falcons, purebred Arabian equestrian stables, and artisanal spice alleys create an intoxicating sensory journey.\n\nComplementing the historical core is Katara Cultural Village, featuring traditional Greco-Roman style amphitheatres, hand-crafted blue tiled mosques, and fine art galleries celebrating regional masters.',
  'تجسد الدوحة تناغماً فريداً بين التراث القطري الأصيل والابتكار المعماري العالمي. تبدأ الجولة الثقافية الخاصة بزيارة متحف الفن الإسلامي، التحفة المعمارية التي صممها المهندس العالمي آي إم بي، والتي تحتضن مقتنيات إسلامية تمتد لأربعة عشر قرناً.\n\nوعلى طول كورنيش الدوحة، ينتقل الضيوف إلى سوق واقف، القلب التجاري التاريخي لدولة قطر. تفوح في أزقته روائح البخور والتوابل العطرية، مع فرصة فريدة لزيارة سوق الصقور وإسطبلات الخيل العربية الأصيلة.\n\nوتكتمل الجولة في الحي الثقافي كتارا، الذي يضم مسرحاً مكشوفاً يمزج بين الطرازين الروماني والإسلامي، ومساجد مزخرفة بالقاشاني الأزرق، ومعارض فنية تستضيف نخبة المبدعين.',
  'culture_heritage',
  'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=1200&q=80',
  'MZ Concierge Editorial',
  5,
  true,
  timezone('utc'::text, now())
),
(
  'qatar-travel-advisory-customs-protocol',
  'Qatar Luxury Travel Advisory: Customs, Etiquette & VIP Protocols',
  'إرشادات السفر إلى قطر: العادات والتقاليد وبروتوكول كبار الشخصيات',
  'Essential protocol guidance for international discerning guests arriving at Hamad International Airport and staying at five-star residences.',
  'إرشادات هامة لضيوف دولة قطر الكرام والمسافرين الدوليين حول التقاليد المحلية، متطلبات الدخول، والضيافة الرفيعة.',
  'Qatar is globally renowned as one of the safest and most hospitable destinations in the world. To ensure a seamless stay, international visitors are advised to observe local cultural etiquette.\n\nDress codes in public cultural sites and shopping districts are modest and respectful, with shoulders and knees comfortably covered. Five-star private beach resorts and hotel pool terraces maintain standard international resort attire.\n\nVIP travelers arriving through Hamad International Airport (HIA) can enjoy specialized Al Maha Meet & Assist services, expedited immigration clearance, and dedicated chauffeur pickups to their chosen West Bay or Lusail hotel.',
  'تُعرف دولة قطر عالمياً بكونها إحدى أكثر الوجهات أماناً وضيافة في العالم. ولضمان إقامة مريحة وممتعة، يُنصح الزوار بمراعاة الآداب العامة والتقاليد القطرية الأصيلة.\n\nتتسم الملابس في الأماكن العامة والأسواق التراثية بالحشمة والاحترام، بينما تتوفر الحرية الكاملة في المنتجعات الشاطئية الخاصة والمسابح الفندقية الراقية.\n\nويحظى ضيوفنا الكرام القادمون عبر مطار حمد الدولي بخدمة استقبال وتوديع كبار الشخصيات (المها)، وتسهيل إجراءات الجوازات السريعة، ونقل فوري بسيارات الليموزين الخاصة إلى مقر إقامتهم في الخليج الغربي أو لوسيل.',
  'travel_advisory',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
  'MZ Concierge Editorial',
  4,
  true,
  timezone('utc'::text, now())
)
ON CONFLICT (slug) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  title_ar = EXCLUDED.title_ar,
  excerpt_en = EXCLUDED.excerpt_en,
  excerpt_ar = EXCLUDED.excerpt_ar,
  content_en = EXCLUDED.content_en,
  content_ar = EXCLUDED.content_ar,
  category = EXCLUDED.category,
  cover_image = EXCLUDED.cover_image,
  reading_time_minutes = EXCLUDED.reading_time_minutes,
  is_published = EXCLUDED.is_published,
  published_at = EXCLUDED.published_at;
