export type ArticleCategory =
  | "desert_expeditions"
  | "culture_heritage"
  | "vip_transfers"
  | "luxury_stays"
  | "travel_advisory";

export interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: ArticleCategory;
  coverImage: string | null;
  authorName: string;
  readingTimeMinutes: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminArticleItem {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  contentEn: string;
  contentAr: string;
  category: ArticleCategory;
  coverImage: string | null;
  authorName: string;
  readingTimeMinutes: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetArticlesOptions {
  category?: string;
  search?: string;
}

// =============================================================================
// CURATED EDITORIAL CONTENT (FALLBACK & SEED DATA)
// =============================================================================

export const CURATED_ARTICLES: AdminArticleItem[] = [
  {
    id: "art-1-khor-al-adaid",
    slug: "khor-al-adaid-inland-sea-guide",
    titleEn: "The Discerning Traveler Guide to Khor Al Adaid Inland Sea",
    titleAr: "الدليل الشامل للرحالة المميز إلى خور العديد والبحر الداخلي",
    excerptEn:
      "An authoritative guide to experiencing Qatar UNESCO-recognized inland sea, where colossal desert dunes meet the azure Arabian Gulf.",
    excerptAr:
      "دليل شامل لزيارة البحر الداخلي المعترف به من اليونسكو في قطر، حيث تلتقي الكثبان الرملية الذهبية بمياه الخليج العربي الزرقاء.",
    contentEn: `Khor Al Adaid, situated in the southeastern corner of Qatar, is one of the only places in the world where the sea encroaches deep into the heart of the desert. Recognized by UNESCO as a natural reserve of extraordinary scenic value, this aquatic marvel features its own distinct ecosystem.

Reaching Khor Al Adaid requires private 4x4 vehicles piloted by certified desert marshals. The expedition navigates the towering singing sands of Mesaieed, offering guests thrilling dune ascents followed by serene vantage points over the serene tidal waters.

For the ultimate luxury experience, departures are curated in late afternoon, allowing travelers to witness sunset over the dunes before enjoying an authentic royal majlis dinner under the constellation-rich night sky.`,
    contentAr: `يُعد خور العديد، الواقع في الركن الجنوبي الشرقي من دولة قطر، من الأماكن النادرة في العالم التي يتوغل فيها البحر عميقاً في قلب الصحراء. صُنّف الخور كمحمية طبيعية ذات قيمة استثنائية من قبل اليونسكو ويتميز بنظامه البيئي الفريد.

يتطلب الوصول إلى خور العديد مركبات دفع رباعي فاخرة يقودها سائقون محترفون ومرخصون. تنطلق الرحلة عبر كثبان مسيعيد الرملية الشاهقة، مانحة الضيوف تجربة استثنائية تجمع بين الحماسة والإطلالات الهادئة على مياه البحر.

ولخوض تجربة متكاملة، يُنصح بالانطلاق في فترة ما بعد الظهيرة للاستمتاع بغروب الشمس الساحر فوق الكثبان الذهبية، تليها جلسة عربية ملكية في مجلس صحراوي خاص تحت سماء الصحراء الصافية.`,
    category: "desert_expeditions",
    coverImage:
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
    authorName: "MZ Concierge Editorial",
    readingTimeMinutes: 6,
    isPublished: true,
    publishedAt: "2026-10-25T10:00:00Z",
    createdAt: "2026-10-25T10:00:00Z",
    updatedAt: "2026-10-25T10:00:00Z",
  },
  {
    id: "art-2-doha-culture",
    slug: "doha-cultural-landmarks-guide",
    titleEn: "Curating Culture: The Essential Doha Heritage Tour",
    titleAr: "جولة التراث والثقافة: استكشاف معالم الدوحة التاريخية والحديثة",
    excerptEn:
      "From the timeless corridors of Souq Waqif to the masterpieces of the Museum of Islamic Art and Katara Cultural Village.",
    excerptAr:
      "من أروقة سوق واقف العريقة إلى روائع متحف الفن الإسلامي والقرية الثقافية كتارا، دليل متكامل لتجربة التراث القطري الأصيل.",
    contentEn: `Doha presents a striking harmony between ancestral Qatari heritage and world-class architectural innovation. A bespoke cultural excursion begins at the Museum of Islamic Art (MIA), designed by I.M. Pei, showcasing fourteen centuries of islamic artistic treasures.

Continuing along the waterfront Corniche, visitors arrive at Souq Waqif, the historic trading heart of Qatar. Here, specialized falcons, purebred Arabian equestrian stables, and artisanal spice alleys create an intoxicating sensory journey.

Complementing the historical core is Katara Cultural Village, featuring traditional Greco-Roman style amphitheatres, hand-crafted blue tiled mosques, and fine art galleries celebrating regional masters.`,
    contentAr: `تجسد الدوحة تناغماً فريداً بين التراث القطري الأصيل والابتكار المعماري العالمي. تبدأ الجولة الثقافية الخاصة بزيارة متحف الفن الإسلامي، التحفة المعمارية التي صممها المهندس العالمي آي إم بي، والتي تحتضن مقتنيات إسلامية تمتد لأربعة عشر قرناً.

وعلى طول كورنيش الدوحة، ينتقل الضيوف إلى سوق واقف، القلب التجاري التاريخي لدولة قطر. تفوح في أزقته روائح البخور والتوابل العطرية، مع فرصة فريدة لزيارة سوق الصقور وإسطبلات الخيل العربية الأصيلة.

وتكتمل الجولة في الحي الثقافي كتارا، الذي يضم مسرحاً مكشوفاً يمزج بين الطرازين الروماني والإسلامي، ومساجد مزخرفة بالقاشاني الأزرق، ومعارض فنية تستضيف نخبة المبدعين.`,
    category: "culture_heritage",
    coverImage:
      "https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=1200&q=80",
    authorName: "MZ Concierge Editorial",
    readingTimeMinutes: 5,
    isPublished: true,
    publishedAt: "2026-10-26T12:00:00Z",
    createdAt: "2026-10-26T12:00:00Z",
    updatedAt: "2026-10-26T12:00:00Z",
  },
  {
    id: "art-3-travel-advisory",
    slug: "qatar-travel-advisory-customs-protocol",
    titleEn: "Qatar Luxury Travel Advisory: Customs, Etiquette & VIP Protocols",
    titleAr: "إرشادات السفر إلى قطر: العادات والتقاليد وبروتوكول كبار الشخصيات",
    excerptEn:
      "Essential protocol guidance for international discerning guests arriving at Hamad International Airport and staying at five-star residences.",
    excerptAr:
      "إرشادات هامة لضيوف دولة قطر الكرام والمسافرين الدوليين حول التقاليد المحلية، متطلبات الدخول، والضيافة الرفيعة.",
    contentEn: `Qatar is globally renowned as one of the safest and most hospitable destinations in the world. To ensure a seamless stay, international visitors are advised to observe local cultural etiquette.

Dress codes in public cultural sites and shopping districts are modest and respectful, with shoulders and knees comfortably covered. Five-star private beach resorts and hotel pool terraces maintain standard international resort attire.

VIP travelers arriving through Hamad International Airport (HIA) can enjoy specialized Al Maha Meet & Assist services, expedited immigration clearance, and dedicated chauffeur pickups to their chosen West Bay or Lusail hotel.`,
    contentAr: `تُعرف دولة قطر عالمياً بكونها إحدى أكثر الوجهات أماناً وضيافة في العالم. ولضمان إقامة مريحة وممتعة، يُنصح الزوار بمراعاة الآداب العامة والتقاليد القطرية الأصيلة.

تتسم الملابس في الأماكن العامة والأسواق التراثية بالحشمة والاحترام، بينما تتوفر الحرية الكاملة في المنتجعات الشاطئية الخاصة والمسابح الفندقية الراقية.

ويحظى ضيوفنا الكرام القادمون عبر مطار حمد الدولي بخدمة استقبال وتوديع كبار الشخصيات (المها)، وتسهيل إجراءات الجوازات السريعة، ونقل فوري بسيارات الليموزين الخاصة إلى مقر إقامتهم في الخليج الغربي أو لوسيل.`,
    category: "travel_advisory",
    coverImage:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    authorName: "MZ Concierge Editorial",
    readingTimeMinutes: 4,
    isPublished: true,
    publishedAt: "2026-10-27T09:00:00Z",
    createdAt: "2026-10-27T09:00:00Z",
    updatedAt: "2026-10-27T09:00:00Z",
  },
];
