/**
 * MZ Tourism Qatar — Comprehensive Luxury Tour Definitions & Master Data
 *
 * All prices strictly in QAR (Qatari Riyal).
 * Timezone: Asia/Qatar (UTC+03:00).
 * Private fleet standard: Land Cruiser 4x4 (up to 6 pax), VIP Van (up to 12 pax), Arabian Dhow (up to 30 pax).
 */

export interface TourItineraryStop {
  day?: number;
  time: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
}

export interface TourFaqItem {
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
}

export interface TourDepartureSlot {
  id: string;
  tourId: string;
  departureDate: string; // YYYY-MM-DD in Asia/Qatar
  startTime: string;     // e.g. "05:00", "14:30"
  endTime?: string;
  capacity: number;
  reservedSeats: number;
  availableSeats: number;
  status: "open" | "closed" | "sold_out" | "cancelled";
  pricingOverride?: number | null;
}

export interface TourRecord {
  id: string; // Slug/Identifier (e.g. desert-safari)
  slug: string;
  titleEn: string;
  titleAr: string;
  shortDescriptionEn: string;
  shortDescriptionAr: string;
  descriptionEn: string;
  descriptionAr: string;
  category: "safari" | "culture" | "transfers" | "luxury" | "events" | "equestrian" | "gcc" | "glamping";
  destinations: string[];
  tourType: "private" | "group";
  difficultyLevel: "easy" | "moderate" | "challenging";
  duration: string;
  maxAltitude: string;
  minParticipants: number;
  maxParticipants: number;
  pricingType: "per_person" | "per_private_tour";
  totalPrice: number; // in QAR
  depositType: "percentage" | "fixed";
  depositValue: number; // e.g. 30% or 500 QAR
  currency: "QAR";
  pickupInfoEn: string;
  pickupInfoAr: string;
  itinerary: TourItineraryStop[];
  inclusionsEn: string[];
  inclusionsAr: string[];
  exclusionsEn: string[];
  exclusionsAr: string[];
  requiredGearEn: string[];
  requiredGearAr: string[];
  faqs: TourFaqItem[];
  importantInfoEn: string;
  importantInfoAr: string;
  cancellationPolicyEn: string;
  cancellationPolicyAr: string;
  seoTitleEn: string;
  seoTitleAr: string;
  seoDescriptionEn: string;
  seoDescriptionAr: string;
  featuredImage: string;
  galleryImages: string[];
  status: "draft" | "published" | "archived";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  departures?: TourDepartureSlot[];
}

export const QATAR_DESTINATIONS = [
  "Doha City",
  "Khor Al Adaid (Inland Sea)",
  "Souq Waqif & Heritage Quarter",
  "Katara Cultural Village",
  "The Pearl-Qatar & Lusail",
  "Al Zubarah UNESCO Archaeological Fort",
  "Banana Island & Coastal Waters",
  "Sealine Desert Gateway",
  "Al Shaqab Equestrian Center",
  "Zekreet & Film City (West Coast)",
  "Al Wakra Old Souq & Harbour",
  "Fuwairit Beach & Mangroves",
] as const;

export const TOUR_CATEGORIES = [
  { id: "safari", labelEn: "Desert Safaris & Inland Sea", labelAr: "سفاري الصحراء وخور العديد" },
  { id: "culture", labelEn: "Heritage & Cultural Expeditions", labelAr: "الجولات التراثية والثقافية" },
  { id: "transfers", labelEn: "VIP Hamad Airport Chauffeur", labelAr: "توصيل كبار الشخصيات ومطار حمد" },
  { id: "luxury", labelEn: "Ultra-Luxury Island & Coastal Retreats", labelAr: "المنتجعات والجزر الفاخرة" },
  { id: "events", labelEn: "Private Dhow Cruises & Desert Galas", labelAr: "حفلات اليخوت والبانكويت الخاص" },
  { id: "equestrian", labelEn: "Purebred Arabian Horse Riding", labelAr: "ركوب الخيل العربية الأصيلة" },
  { id: "glamping", labelEn: "Royal Majlis & Desert Glamping", labelAr: "التخييم الملكي الفاخر والخيام" },
  { id: "gcc", labelEn: "GCC Cross-Border VIP Travel", labelAr: "رحلات برية لدول الخليج العربي" },
] as const;

/**
 * Generates rolling departure slots for the next 45 days in Asia/Qatar timezone
 */
export function generateDefaultDepartures(tourId: string, tourType: "private" | "group", capacity: number = 6): TourDepartureSlot[] {
  const departures: TourDepartureSlot[] = [];
  const now = new Date();

  // Create departures for the next 45 days
  for (let i = 1; i <= 45; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];

    // Morning departure
    departures.push({
      id: `dep-${tourId}-${dateStr}-morning`,
      tourId,
      departureDate: dateStr,
      startTime: "08:30",
      endTime: "13:30",
      capacity,
      reservedSeats: 0,
      availableSeats: capacity,
      status: "open",
      pricingOverride: null,
    });

    // Afternoon / Sunset departure
    departures.push({
      id: `dep-${tourId}-${dateStr}-sunset`,
      tourId,
      departureDate: dateStr,
      startTime: "14:30",
      endTime: "20:30",
      capacity,
      reservedSeats: 0,
      availableSeats: capacity,
      status: "open",
      pricingOverride: null,
    });
  }

  return departures;
}

export const MASTER_TOUR_CATALOG: TourRecord[] = [
  {
    id: "desert-safari",
    slug: "desert-safari",
    titleEn: "Khor Al Adaid Inland Sea Private Desert Safari",
    titleAr: "رحلة سفاري صحراوية خاصة إلى خور العديد",
    shortDescriptionEn: "Conquer monumental dunes in a bespoke luxury 4x4 Land Cruiser where golden sands dramatically meet the Arabian Sea.",
    shortDescriptionAr: "استكشف كثبان خور العديد الشاهقة في سيارة دفع رباعي فاخرة خاصة حيث تعانق الرمال الذهبية مياه الخليج العربي الزرقاء.",
    descriptionEn: "Experience Qatar's supreme signature desert journey. Led by licensed veteran desert captains, you will embark on an exhilarating dune bashing expedition across the southern desert to UNESCO-recognized Khor Al Adaid (Inland Sea). Includes royal falconry demonstration, authentic Karak tea at golden hour, private beachfront majlis relaxation, and an optional candlelit Arabian barbecue feast prepared by your personal desert chef.",
    descriptionAr: "انطلق في تجربة قطر الصحراوية الأكثر تميزاً وفخامة. بصحبة قباطنة صحراء محترفين، ستخوض مغامرة تطعيس مشوقة عبر الكثبان الجنوبية وصولاً إلى خور العديد المعترف به من اليونسكو. تشمل الجولة عرض الصقارة الملكية، شاي كرك طازج عند الغروب، استراحة في مجلس شاطئي خاص، مع خيار عشاء مشاوي عربية فاخر على ضوء الشموع.",
    category: "safari",
    destinations: ["Sealine Desert Gateway", "Khor Al Adaid (Inland Sea)", "Singing Sand Dunes"],
    tourType: "private",
    difficultyLevel: "easy",
    duration: "6 - 8 Hours",
    maxAltitude: "Sea Level / High Sand Crests",
    minParticipants: 1,
    maxParticipants: 6,
    pricingType: "per_person",
    totalPrice: 450,
    depositType: "percentage",
    depositValue: 30, // 30% deposit = 135 QAR per person
    currency: "QAR",
    pickupInfoEn: "Complimentary VIP chauffeur pickup and drop-off from any hotel, residence, or Hamad International Airport in Doha.",
    pickupInfoAr: "خدمة التوصيل والاستقبال المجانية بكبار الشخصيات من أي فندق أو مقر إقامة بالدوحة أو مطار حمد الدولي.",
    itinerary: [
      {
        day: 1,
        time: "14:00",
        titleEn: "Executive Hotel Pickup",
        titleAr: "الاستقبال الفاخر من الفندق",
        descEn: "Private luxury Land Cruiser pickup at your residence with chilled mineral water and date refreshments.",
        descAr: "استقبال خاص بسيارة لاند كروزر حديثة ومجهزة مع مياه معدنية وتمور فاخرة.",
      },
      {
        day: 1,
        time: "14:45",
        titleEn: "Sealine Gateway & Camel Encounter",
        titleAr: "بوابة سيلين وركوب الإبل",
        descEn: "Arrival at Sealine; tire pressure adjustment, optional traditional camel ride, and fresh Karak tea.",
        descAr: "الوصول إلى سيلين لتعديل ضغط الإطارات، مع تجربة ركوب الإبل التقليدية وتناول شاي الكرك الأصيل.",
      },
      {
        day: 1,
        time: "15:30",
        titleEn: "Thrilling Dune Bashing & Sandboarding",
        titleAr: "مغامرة التطعيس والتزلج على الرمال",
        descEn: "Expert navigation across singing dunes with stops for panoramic photography and sandboarding.",
        descAr: "قيادة احترافية مشوقة فوق الكثبان الرملية الذهبية مع توقف لالتقاط أروع الصور والتزلج على الرمال.",
      },
      {
        day: 1,
        time: "17:00",
        titleEn: "Khor Al Adaid Inland Sea Sunset",
        titleAr: "غروب الشمس على خور العديد",
        descEn: "Marvel at the rare spectacle of turquoise ocean waters meeting towering sand dunes at the Saudi border.",
        descAr: "مشاهدة الظاهرة النادرة لتعانق مياه البحر الفيروزية مع الكثبان الرملية الشاهقة على الحدود القطرية السعودية.",
      },
      {
        day: 1,
        time: "18:15",
        titleEn: "Private Majlis Refreshments & Falconry",
        titleAr: "استراحة المجلس الخاص وعرض الصقور",
        descEn: "Exclusive beachfront majlis pavilion with royal falcon portrait session and Arabian hospitality.",
        descAr: "الاسترخاء في مجلس شاطئي خاص مع جلسة تصوير حصرية مع الصقور العربية الأصيلة.",
      },
      {
        day: 1,
        time: "20:30",
        titleEn: "Smooth Return to Doha",
        titleAr: "العودة المريحة إلى الدوحة",
        descEn: "Chauffeured return journey directly to your hotel or airport terminal in complete comfort.",
        descAr: "رحلة العودة المريحة مع السائق الخاص مباشرة إلى فندقك أو صالة المغادرة بالمطار.",
      },
    ],
    inclusionsEn: [
      "Exclusive private Land Cruiser 4x4 buyout (up to 6 guests)",
      "Certified English & Arabic speaking desert master chauffeur",
      "Door-to-door hotel transfers in Doha",
      "Unlimited chilled mineral water, juices, Arabic coffee & Karak",
      "Sandboarding equipment and safety briefing",
      "Royal falconry interaction and photo opportunity",
      "Comprehensive luxury passenger insurance",
    ],
    inclusionsAr: [
      "مركبة لاند كروزر دفع رباعي حديثة خاصة بالكامل (تتسع حتى 6 أشخاص)",
      "سائق وقبطان صحراء معتمد يتحدث العربية والإنجليزية",
      "خدمة التوصيل من وإلى الفندق من الباب إلى الباب",
      "مشروبات منعشة ومياه معدنية غير محدودة وقهوة عربية وكرك",
      "معدات التزلج على الرمال مع إرشادات السلامة",
      "عرض الصقارة الملكية وجلسة تصوير تذكارية",
      "تأمين شامل لكافة الركاب",
    ],
    exclusionsEn: [
      "Discretionary chauffeur gratuities",
      "Alcoholic beverages (strictly prohibited in protected desert reserves)",
      "Personal shopping souvenirs",
    ],
    exclusionsAr: [
      "الإكراميات الشخصية",
      "المصاريف الشخصية والهدايا التذكارية",
    ],
    requiredGearEn: [
      "Comfortable breathable casual clothing",
      "Sunglasses and sun protection",
      "Slip-on sandals or sports shoes for sandboarding",
      "Light jacket or shawl for cool desert evening breeze",
    ],
    requiredGearAr: [
      "ملابس مريحة ومناسبة للأجواء الدافئة",
      "نظارات شمسية وواقي شمس",
      "أحذية خفيفة أو رياضية للتزلج على الرمال",
      "سترة خفيفة لأمسيات الصحراء اللطيفة",
    ],
    faqs: [
      {
        questionEn: "Is this tour suitable for families with young children or seniors?",
        questionAr: "هل هذه الجولة مناسبة للعائلات بصحبة أطفال أو كبار السن؟",
        answerEn: "Absolutely. Because this is a 100% private charter, your chauffeur adjusts the dune driving style entirely to your comfort level, from a gentle scenic glide to thrilling dune bashing.",
        answerAr: "نعم بالتأكيد. نظراً لأن الرحلة خاصة بالكامل، يتحكم السائق في مستوى السرعة ونعومة القيادة فوق الكثبان وفق رغبتكم التامة، من الجولة الهادئة المريحة إلى التطعيس المشوق.",
      },
      {
        questionEn: "What is the deposit policy for the Inland Sea Safari?",
        questionAr: "ما هي سياسة العربون لحجز سفاري خور العديد؟",
        answerEn: "A 30% advance deposit (720 QAR) secures your private vehicle allocation. The remaining balance (1,680 QAR) is settled upon arrival or pre-departure.",
        answerAr: "عربون بنسبة 30% (720 ر.ق) يضمن تخصيص السيارة الخاصة لرحلتكم. يتم سداد الرصيد المتبقي (1,680 ر.ق) عند الانطلاق أو قبل موعد الرحلة.",
      },
    ],
    importantInfoEn: "Pregnant travelers and guests with severe back conditions are advised to notify their concierge in advance so a flat-route coastal itinerary can be assigned.",
    importantInfoAr: "يرجى من السيدات الحوامل والضيوف الذين يعانون من مشاكل في الظهر إبلاغ الكونسيرج مسبقاً لتخصيص مسار ساحلي مستوٍ ومريح بالكامل.",
    cancellationPolicyEn: "Complimentary cancellation and full deposit refund up to 48 hours prior to scheduled departure. Cancellations within 48 hours are eligible for credit reschedule.",
    cancellationPolicyAr: "إلغاء مجاني واسترداد كامل للعربون حتى 48 ساعة قبل موعد الانطلاق. للإلغاء خلال أقل من 48 ساعة يمكن إعادة جدولة الموعد كرصيد سفر.",
    seoTitleEn: "Private Khor Al Adaid Inland Sea Desert Safari | MZ Tourism Qatar",
    seoTitleAr: "رحلة سفاري خور العديد الخاصة | إم زد للسياحة قطر",
    seoDescriptionEn: "Book the ultimate private luxury desert safari to Khor Al Adaid Inland Sea with MZ Tourism Qatar. Premium 4x4 Land Cruiser, falconry, sunset majlis in Doha.",
    seoDescriptionAr: "احجز رحلة سفاري صحراوية خاصة وفخمة إلى خور العديد مع إم زد للسياحة قطر. لاند كروزر خاص، صقارة، ومجلس شاطئي في الدوحة.",
    featuredImage: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "published",
    isActive: true,
    createdAt: "2026-10-28T15:49:29.063Z",
    updatedAt: "2026-10-31T15:00:00.000Z",
  },
  {
    id: "doha-city-tours",
    slug: "doha-city-tours",
    titleEn: "Doha Heritage & Cultural Grand Excursion",
    titleAr: "جولة الدوحة الثقافية والتراثية الكبرى",
    shortDescriptionEn: "An architectural, historic, and sensory masterclass linking Souq Waqif, Katara, and the National Museum in private VIP comfort.",
    shortDescriptionAr: "جولة ثقافية وتاريخية حصرية تربط بين سوق واقف وكتارا ومتحف قطر الوطني في سيارة فاخرة مع مرشد خاص.",
    descriptionEn: "Immerse yourself in Qatar's rich cultural renaissance. Accompanied by a dedicated bilingual cultural historian, visit the iconic National Museum of Qatar designed by Jean Nouvel, explore the labyrinthine alleyways of Souq Waqif, inspect royal Arabian police stallions, admire the Falcon Souq, and stroll through the Katara Cultural Village and The Pearl-Qatar.",
    descriptionAr: "اكتشف النهضة الثقافية والمعمارية لدولة قطر. بصحبة مرشد سياحي معتمد، ستزور متحف قطر الوطني الرائع من تصميم جان نوفيل، وتتجول في أزقة سوق واقف التاريخية، وإسطبلات الخيول الملكية، وسوق الصقور، وقرية كتارا الثقافية وجزيرة اللؤلؤة قطر.",
    category: "culture",
    destinations: ["Souq Waqif & Heritage Quarter", "Katara Cultural Village", "The Pearl-Qatar & Lusail", "Doha City"],
    tourType: "private",
    difficultyLevel: "easy",
    duration: "4 - 6 Hours",
    maxAltitude: "Sea Level",
    minParticipants: 1,
    maxParticipants: 6,
    pricingType: "per_person",
    totalPrice: 350,
    depositType: "percentage",
    depositValue: 30, // 30% deposit = 105 QAR per person
    currency: "QAR",
    pickupInfoEn: "Chauffeured pickup from any hotel, residence, or cruise port terminal in Doha.",
    pickupInfoAr: "الاستقبال والتوصيل من أي فندق أو سكن أو ميناء الدوحة السياحي.",
    itinerary: [
      {
        day: 1,
        time: "09:30",
        titleEn: "National Museum of Qatar",
        titleAr: "متحف قطر الوطني (وردة الصحراء)",
        descEn: "Private guided walkthrough of the architectural marvel detailing Qatar's geological formation and history.",
        descAr: "جولة خاصة داخل التحفة المعمارية التي تروي حكاية قطر وتاريخها العريق.",
      },
      {
        day: 1,
        time: "11:30",
        titleEn: "Souq Waqif & Royal Stables",
        titleAr: "سوق واقف وإسطبلات الخيول",
        descEn: "Guided exploration of spice lanes, oud perfumeries, the falcon hospital, and Arabian police stallions.",
        descAr: "استكشاف أزقة البهارات والعطور الشرقية ومستشفى الصقور وإسطبلات خيول الشرطة الملكية.",
      },
      {
        day: 1,
        time: "13:00",
        titleEn: "Katara Cultural Village",
        titleAr: "الحي الثقافي كتارا",
        descEn: "Walk through Katara amphitheater, golden mosque, and waterfront promenades with dining options.",
        descAr: "التجول في مدرج كتارا والمسجد الذهبي وشاطئ كتارا مع خيارات مطاعم مميزة.",
      },
      {
        day: 1,
        time: "14:30",
        titleEn: "The Pearl-Qatar Marina",
        titleAr: "مرسى اللؤلؤة قطر",
        descEn: "Scenic drive through Porto Arabia and Qanat Quartier with photo stops.",
        descAr: "جولة بالسيارة في بورتو أرابيا وقناة كارتييه الشبيهة بالبندقية مع محطات للتصوير.",
      },
    ],
    inclusionsEn: [
      "Private Mercedes-Benz or luxury SUV with chauffeur",
      "Licensed bilingual tourist guide",
      "VIP museum entry arrangements",
      "Chilled artisanal refreshments & Karak tea",
      "Door-to-door transfers across Doha",
    ],
    inclusionsAr: [
      "سيارة مرسيدس أو مركبة دفع رباعي فاخرة مع سائق خاص",
      "مرشد سياحي معتمد ثنائي اللغة",
      "تنسيق تذاكر الدخول للمتاحف",
      "ضيافة ومشروبات باردة وشاي كرك",
      "التوصيل من الباب إلى الباب في كافة أنحاء الدوحة",
    ],
    exclusionsEn: [
      "Museum admission fees (settled at venue or complimentary with Qatar Pass)",
      "Lunch or personal purchases",
    ],
    exclusionsAr: [
      "رسوم دخول المتاحف الرسمية",
      "وجبة الغداء والمشتريات الشخصية",
    ],
    requiredGearEn: ["Modest respectful attire covering shoulders and knees", "Comfortable walking shoes", "Camera"],
    requiredGearAr: ["ملابس محتشمة ومريحة تغطي الكتفين والركبتين", "حذاء مريح للمشي", "كاميرا للتصوير"],
    faqs: [
      {
        questionEn: "Can the tour itinerary be customized to my specific interests?",
        questionAr: "هل يمكن تعديل مسار الجولة بما يناسب اهتماماتي؟",
        answerEn: "Yes, our cultural tours are entirely bespoke. If you prefer more time in art galleries, shopping, or architecture, your private guide adapts effortlessly.",
        answerAr: "نعم بالتأكيد، كافة رحلاتنا خاصة وقابلة للتخصيص وفق رغبتكم سواء في التركيز على الفنون أو التسوق أو المعمار.",
      },
    ],
    importantInfoEn: "Dress code in cultural institutions and traditional souqs is respectful (shoulders and knees covered).",
    importantInfoAr: "يرجى مراعاة الزي المحتشم والمحترم في المؤسسات الثقافية والأسواق التراثية.",
    cancellationPolicyEn: "Free cancellation up to 24 hours prior to departure.",
    cancellationPolicyAr: "إلغاء مجاني حتى 24 ساعة قبل موعد الجولة.",
    seoTitleEn: "Doha City & Cultural Heritage Private Tour | MZ Tourism Qatar",
    seoTitleAr: "جولة الدوحة التراثية والثقافية الخاصة | إم زد للسياحة قطر",
    seoDescriptionEn: "Discover Doha with MZ Tourism Qatar. Private guided excursion visiting Souq Waqif, National Museum, Katara, and The Pearl with luxury chauffeur.",
    seoDescriptionAr: "اكتشف معالم الدوحة مع إم زد للسياحة قطر. جولة سياحية خاصة تشمل سوق واقف ومتحف قطر وكتارا واللؤلؤة مع سيارة فاخرة ومرشد معتمد.",
    featuredImage: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "published",
    isActive: true,
    createdAt: "2026-10-28T15:49:29.063Z",
    updatedAt: "2026-10-31T15:00:00.000Z",
  },
  {
    id: "airport-hotel-transfers",
    slug: "airport-hotel-transfers",
    titleEn: "Hamad International VIP Chauffeur & Transfers",
    titleAr: "استقبال كبار الشخصيات وتوصيل مطار حمد الدولي",
    shortDescriptionEn: "Bespoke airport tarmac or terminal greeting with executive luxury fleet directly to Doha hotels.",
    shortDescriptionAr: "خدمات الاستقبال الفاخرة وتوصيل كبار الشخصيات من مطار حمد الدولي بأسطول سيارات تنفيذي فخم.",
    descriptionEn: "Flawless airport logistics tailored for dignitaries, executives, and luxury vacationers arriving at Hamad International Airport. Features private uniformed bilingual chauffeurs, real-time flight tracking, luggage porterage, and direct transfer in your choice of Mercedes-Maybach, Range Rover, or Cadillac Escalade.",
    descriptionAr: "خدمات نقل وتنقل راقية تليق بكبار الشخصيات ورجال الأعمال في مطار حمد الدولي. تشمل متابعة دقيقة لمواعيد الطيران، استقبال بيافطة خاصة، مساعدة في الأمتعة، ونقل مباشر إلى مقرك في أفخم سيارات مرسيدس أو رينج روفر.",
    category: "transfers",
    destinations: ["Doha City", "The Pearl-Qatar & Lusail"],
    tourType: "private",
    difficultyLevel: "easy",
    duration: "Custom Schedule",
    maxAltitude: "Sea Level",
    minParticipants: 1,
    maxParticipants: 4,
    pricingType: "per_person",
    totalPrice: 250,
    depositType: "percentage",
    depositValue: 30, // 30% deposit = 75 QAR per person
    currency: "QAR",
    pickupInfoEn: "Flight flight-tracking arrival hall greeting with personalized name board.",
    pickupInfoAr: "استقبال في صالة الوصول مع متابعة فورية لموعد هبوط الطائرة وحمل لوحة بالاسم.",
    itinerary: [
      {
        day: 1,
        time: "Flight Arrival",
        titleEn: "Meet & Greet at Hamad Airport",
        titleAr: "الاستقبال في مطار حمد",
        descEn: "Professional chauffeur greets you immediately after customs with luggage assistance.",
        descAr: "السائق الخاص يستقبلكم فور الخروج من منطقة الجمارك مع المساعدة الكاملة في حمل الحقائب.",
      },
      {
        day: 1,
        time: "In Transit",
        titleEn: "Executive Chauffeur Drive",
        titleAr: "التوصيل التنفيذي المريح",
        descEn: "Relax in air-conditioned luxury with Wi-Fi, bottled water, and device charging ports.",
        descAr: "الاسترخاء في سيارة فاخرة مجهزة بإنترنت ومياه معدنية وشواحن للهواتف.",
      },
    ],
    inclusionsEn: ["Flight arrival tracking with 90-minute complimentary waiting time", "Luggage handling", "Tolls and parking fees"],
    inclusionsAr: ["متابعة موعد الرحلة مع فترة انتظار مجانية 90 دقيقة", "مساعدة في الأمتعة", "رسوم المواقف والطرق"],
    exclusionsEn: ["Excess luggage vehicles unless booked in advance"],
    exclusionsAr: ["مركبات أمتعة إضافية ما لم تطلب مسبقاً"],
    requiredGearEn: ["Flight number and estimated arrival time"],
    requiredGearAr: ["رقم الرحلة وموعد الوصول"],
    faqs: [
      {
        questionEn: "What happens if my flight is delayed?",
        questionAr: "ماذا لو تأخرت رحلتي الجوية؟",
        answerEn: "Our operations desk monitors flight radars live. Your chauffeur will automatically adjust arrival time at zero extra cost.",
        answerAr: "نظامنا يتتبع حركة الطيران لحظياً. سيقوم السائق بتعديل موعد التواجد تلقائياً دون أي رسوم إضافية.",
      },
    ],
    importantInfoEn: "Please provide flight numbers during booking.",
    importantInfoAr: "يرجى تزويدنا برقم الرحلة الجوية عند إتمام الحجز.",
    cancellationPolicyEn: "Free cancellation up to 12 hours before arrival.",
    cancellationPolicyAr: "إلغاء مجاني حتى 12 ساعة قبل موعد الوصول.",
    seoTitleEn: "Hamad Airport VIP Chauffeur Transfer | MZ Tourism Qatar",
    seoTitleAr: "توصيل مطار حمد الدولي كبار الشخصيات | إم زد للسياحة قطر",
    seoDescriptionEn: "Book executive airport transfers in Doha with MZ Tourism Qatar. Premium fleet, flight tracking, and professional bilingual chauffeurs.",
    seoDescriptionAr: "احجز استقبال وتوصيل مطار حمد الدولي الفاخر في الدوحة مع إم زد للسياحة قطر. أسطول حديث وسائقون محترفون.",
    featuredImage: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "published",
    isActive: true,
    createdAt: "2026-10-28T15:49:29.063Z",
    updatedAt: "2026-10-31T15:00:00.000Z",
  },
  {
    id: "celebrations-events",
    slug: "celebrations-events",
    titleEn: "Private Dhow Banquets & Desert Galas",
    titleAr: "حفلات اليخوت والبانكويت الخاص في الصحراء",
    shortDescriptionEn: "Exclusive Arabian wooden dhow buyouts and bespoke desert banquets tailored for private celebrations.",
    shortDescriptionAr: "استئجار حصري لمحامل الدوحة الخشبية التراثية وحفلات العشاء الخاصة على شاطئ الخليج.",
    descriptionEn: "Celebrate momentous occasions aboard a handcrafted royal Arabian wooden dhow charter gliding past the illuminated West Bay skyline, or within a private candlelit desert banquet pavilion. Ideal for executive retreats, anniversaries, and family milestones with personalized catering and live traditional music.",
    descriptionAr: "احتفل بمناسباتك الخاصة على متن محمل خشبي تقليدي فاخر يبحر في مياه الخليج قبالة كورنيش الدوحة وأبراج الدفنة، أو في خيمة ملكية بالصحراء. تجربة استثنائية للمناسبات العائلية واجتماعات كبار التنفيذيين.",
    category: "events",
    destinations: ["Doha City", "The Pearl-Qatar & Lusail", "Banana Island & Coastal Waters"],
    tourType: "private",
    difficultyLevel: "easy",
    duration: "4 - 5 Hours",
    maxAltitude: "Sea Level",
    minParticipants: 2,
    maxParticipants: 30,
    pricingType: "per_person",
    totalPrice: 650,
    depositType: "percentage",
    depositValue: 30, // 30% deposit = 195 QAR per person
    currency: "QAR",
    pickupInfoEn: "Chauffeured arrival at Doha Corniche VIP Dhow Jetty or The Pearl marina.",
    pickupInfoAr: "الاستقبال والتوصيل إلى مرسى اليخوت والمحامل بكورنيش الدوحة أو مرسى اللؤلؤة.",
    itinerary: [
      {
        day: 1,
        time: "17:00",
        titleEn: "Welcome Boarding & Sunset Departure",
        titleAr: "الصعود والترحيب والانطلاق عند الغروب",
        descEn: "Traditional Arabic coffee, dates, and live acoustic oud performance as the dhow departs.",
        descAr: "ضيافة القهوة العربية والتمور مع عزف عود حي عند إبحار المحمل.",
      },
      {
        day: 1,
        time: "19:00",
        titleEn: "Gourmet Arabian Banquet",
        titleAr: "مأدبة العشاء الفاخرة",
        descEn: "Multi-course feast of fresh Gulf seafood, mixed grills, and artisanal desserts under the stars.",
        descAr: "وليمة عربية فاخرة تضم أشهى المأكولات البحرية والمشاوي والحلويات الشرقية.",
      },
    ],
    inclusionsEn: ["Exclusive full dhow vessel charter", "Gourmet catering and private chef", "Sound system and ambient lighting", "Full marine crew and safety staff"],
    inclusionsAr: ["استئجار المحمل الخشبي بالكامل", "طاهٍ خاص وبوفيه عشاء فاخر", "نظام صوتي وإضاءة دافئة", "طاقم بحري كامل وتجهيزات أمان"],
    exclusionsEn: ["Special fireworks or custom event branding unless requested"],
    exclusionsAr: ["عروض الألعاب النارية أو التصاميم المخصصة إلا بطلب مسبق"],
    requiredGearEn: ["Smart casual resort attire"],
    requiredGearAr: ["ملابس أنيقة ومريحة للمناسبات"],
    faqs: [
      {
        questionEn: "Can you accommodate dietary restrictions for banquets?",
        questionAr: "هل يمكن تلبية الأنظمة الغذائية الخاصة؟",
        answerEn: "Yes, our executive catering team caters to halal, vegetarian, vegan, and gluten-free dietary requirements.",
        answerAr: "نعم، يوفر فريق الضيافة خيارات نباتية وخالية من الجلوتين وكافة التفضيلات الغذائية.",
      },
    ],
    importantInfoEn: "Vessel capacity adheres to Qatar Ministry of Transport marine safety protocols.",
    importantInfoAr: "تلتزم الطاقة الاستيعابية ببروتوكولات السلامة البحرية لوزارة المواصلات القطرية.",
    cancellationPolicyEn: "Free cancellation up to 5 days prior to event.",
    cancellationPolicyAr: "إلغاء مجاني حتى 5 أيام قبل موعد الفعالية.",
    seoTitleEn: "Private Dhow Cruise Banquet & Events | MZ Tourism Qatar",
    seoTitleAr: "حفلات المحامل واليخوت الخاصة في الدوحة | إم زد للسياحة قطر",
    seoDescriptionEn: "Charter a private traditional wooden dhow in Doha for dinner cruises, corporate galas, and celebrations with MZ Tourism Qatar.",
    seoDescriptionAr: "استأجر محملاً تقليدياً خاصاً في الدوحة لحفلات العشاء والمناسبات العائلية الفاخرة مع إم زد للسياحة قطر.",
    featuredImage: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "published",
    isActive: true,
    createdAt: "2026-10-28T15:49:29.063Z",
    updatedAt: "2026-10-31T15:00:00.000Z",
  },
  {
    id: "horse-riding",
    slug: "horse-riding",
    titleEn: "Purebred Arabian Equestrian Beach & Dunes",
    titleAr: "ركوب الخيل العربية الأصيلة على الشاطئ والكثبان",
    shortDescriptionEn: "Ride champion purebred Arabian stallions through golden dunes and sea surf accompanied by master trainers.",
    shortDescriptionAr: "امتطِ صهوة الجياد العربية الأصيلة على شاطئ البحر ووسط الكثبان مع مدربين فروسية محترفين.",
    descriptionEn: "Ride the legendary horses of kings. Arabian horses are renowned for nobility, grace, and stamina. This dawn or sunset ride invites leisure and seasoned equestrians to gallop across singing dunes and serene beaches, followed by luxury majlis refreshments.",
    descriptionAr: "عش تجربة ركوب خيل الملوك. خيول عربية أصيلة تتميز بالنبالة والجمال. رحلة استثنائية عند شروق الشمس أو الغروب وسط الرمال الذهبية وعلى شاطئ البحر بمرافقة أمهر مدربي الفروسية.",
    category: "equestrian",
    destinations: ["Al Shaqab Equestrian Center", "Sealine Desert Gateway"],
    tourType: "private",
    difficultyLevel: "moderate",
    duration: "2 - 3 Hours",
    maxAltitude: "Sea Level",
    minParticipants: 1,
    maxParticipants: 4,
    pricingType: "per_person",
    totalPrice: 300,
    depositType: "percentage",
    depositValue: 30, // 30% of 300 = 90 QAR per person
    currency: "QAR",
    pickupInfoEn: "Chauffeur transfer from Doha to private equestrian dunes estate.",
    pickupInfoAr: "التوصيل بسيارة خاصة من الدوحة إلى مركز الفروسية والصحراء.",
    itinerary: [
      {
        day: 1,
        time: "05:30",
        titleEn: "Horse Matching & Briefing",
        titleAr: "اختيار الحصان والتعليمات",
        descEn: "Meet your Arabian mount with instructor guidance based on your equestrian experience.",
        descAr: "التعرف على الحصان المخصص لك مع توجيهات المدرب وفق مستوى مهارتك.",
      },
      {
        day: 1,
        time: "06:15",
        titleEn: "Sunrise Beach & Dune Gallop",
        titleAr: "الانطلاق مع شروق الشمس",
        descEn: "Trek along coastal dunes and shallow surf during the serene morning golden hour.",
        descAr: "ركوب الخيل على أطراف الشاطئ وبين الكثبان في هدوء الصباح وأشعة الشمس الذهبية.",
      },
    ],
    inclusionsEn: ["Champion Arabian horse mount", "Certified equestrian instructor", "Protective riding helmet and boots", "Private luxury transport"],
    inclusionsAr: ["خيل عربي أصيل مروض", "مدرب فروسية معتمد", "خوذة ومعدات الأمان لركوب الخيل", "توصيل خاص فاخر"],
    exclusionsEn: ["Specialized competition apparel"],
    exclusionsAr: ["الملابس الاحترافية الخاصة"],
    requiredGearEn: ["Long stretch trousers", "Closed-toe shoes or boots", "Sun protection"],
    requiredGearAr: ["بنطال طويل مريح", "حذاء مغلق", "واقي شمس"],
    faqs: [
      {
        questionEn: "Do I need previous riding experience?",
        questionAr: "هل أحتاج إلى خبرة سابقة في ركوب الخيل؟",
        answerEn: "No. We have calm, seasoned horses suitable for complete beginners, as well as spirited champion mounts for advanced riders.",
        answerAr: "لا تشترط الخبرة السابقة. نوفر خيولاً هادئة جداً تناسب المبتدئين تماماً، وخيولاً نشطة للفرسان المهرة.",
      },
    ],
    importantInfoEn: "Maximum rider weight limit: 95 kg for horse welfare.",
    importantInfoAr: "الحد الأقصى لوزن الفارس: 95 كغ حفاظاً على سلامة وراحة الخيل.",
    cancellationPolicyEn: "Free cancellation up to 48 hours before session.",
    cancellationPolicyAr: "إلغاء مجاني حتى 48 ساعة قبل موعد الحصة.",
    seoTitleEn: "Arabian Horse Riding in Qatar | MZ Tourism Qatar",
    seoTitleAr: "ركوب الخيل العربية الأصيلة في قطر | إم زد للسياحة قطر",
    seoDescriptionEn: "Experience private Arabian horse riding on dunes and beaches with MZ Tourism Qatar. Champion steeds, certified trainers in Doha.",
    seoDescriptionAr: "احجز تجربة ركوب الخيل العربية الأصيلة على الشاطئ والكثبان في قطر مع إم زد للسياحة قطر. مدربون معتمدون في الدوحة.",
    featuredImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "published",
    isActive: true,
    createdAt: "2026-10-28T15:49:29.063Z",
    updatedAt: "2026-10-31T15:00:00.000Z",
  },
  {
    id: "tent-desert-camp",
    slug: "tent-desert-camp",
    titleEn: "Royal Bedouin Majlis & Desert Glamping",
    titleAr: "خدمات الخيام الملكية والتخييم الفاخر",
    shortDescriptionEn: "Overnight luxury glamping in climate-controlled royal tents under the Arabian night sky.",
    shortDescriptionAr: "إقامة ليلية فاخرة في خيام ملكية مكيفة تجمع بين أصالة البادية وأرقى معايير الراحة الفندقية.",
    descriptionEn: "Unwind in true royal desert tranquility. Featuring spacious climate-controlled Bedouin suites with en-suite bathrooms, plush handwoven carpets, fine dining under the constellations, private telescope stargazing, and sunrise breakfast over the dunes.",
    descriptionAr: "استرخِ في هدوء الصحراء الملكي. خيام ملكية واسعة ومكيفة ومجهزة بحمامات داخلية وسجاد فاخر، مع عشاء فاخر تحت النجوم، ورصد فلكي بالتلسكوب، وإفطار عربي شهي عند شروق الشمس.",
    category: "glamping",
    destinations: ["Sealine Desert Gateway", "Khor Al Adaid (Inland Sea)"],
    tourType: "private",
    difficultyLevel: "easy",
    duration: "Overnight (18 Hours)",
    maxAltitude: "Sea Level / Dunes",
    minParticipants: 2,
    maxParticipants: 8,
    pricingType: "per_person",
    totalPrice: 850,
    depositType: "percentage",
    depositValue: 30, // 30% deposit = 255 QAR per person
    currency: "QAR",
    pickupInfoEn: "Chauffeur transfer in luxury 4x4 Land Cruiser to private desert camp.",
    pickupInfoAr: "التوصيل بسيارة دفع رباعي فاخرة خاصة إلى مخيم الصحراء الفخم.",
    itinerary: [
      {
        day: 1,
        time: "16:00",
        titleEn: "Camp Arrival & Sunset Welcome",
        titleAr: "الوصول للمخيم واستقبال الغروب",
        descEn: "Traditional Arabic coffee, dates, and check-in to your private air-conditioned royal tent.",
        descAr: "الترحيب بالقهوة العربية والتمور واستلام خيمتك الملكية المجهزة والمكيفة بالكامل.",
      },
      {
        day: 1,
        time: "19:30",
        titleEn: "Desert Barbecue & Stargazing",
        titleAr: "عشاء المشاوي ورصد النجوم",
        descEn: "Gourmet barbecue dinner by the campfire and astronomy telescope session.",
        descAr: "عشاء مشاوي فاخر حول نار المخيم وجلسة رصد للنجوم والكواكب عبر التلسكوب.",
      },
      {
        day: 2,
        time: "06:30",
        titleEn: "Sunrise Breakfast & Return",
        titleAr: "إفطار الشروق ورحلة العودة",
        descEn: "Freshly prepared Arabian breakfast as the sun illuminates the dunes, followed by smooth return to Doha.",
        descAr: "إفطار عربي طازج مع شروق الشمس على الكثبان ثم العودة المريحة إلى الدوحة.",
      },
    ],
    inclusionsEn: ["Private luxury tent accommodation", "Gourmet dinner & hot breakfast", "Dune transfer in 4x4", "Campfire setup and telescope access"],
    inclusionsAr: ["إقامة كاملة في خيمة ملكية فاخرة", "عشاء فاخر وإفطار ساخن طازج", "التوصيل بسيارات الدفع الرباعي", "جلسة نار المخيم ورصد النجوم"],
    exclusionsEn: ["Personal shopping items"],
    exclusionsAr: ["المشتريات الشخصية"],
    requiredGearEn: ["Warm clothing for evening", "Toiletries and personal essentials"],
    requiredGearAr: ["ملابس دافئة للمساء", "المستلزمات الشخصية"],
    faqs: [
      {
        questionEn: "Are the tents air-conditioned?",
        questionAr: "هل الخيام مكيفة ومجهزة؟",
        answerEn: "Yes, our luxury royal tents feature whisper-quiet split air-conditioning, electrical outlets, and en-suite facilities.",
        answerAr: "نعم، الخيام الملكية مكيفة بالكامل بأجهزة تبريد هادئة ومجهزة بمقابس كهرباء ومرافق خاصة.",
      },
    ],
    importantInfoEn: "Strictly quiet-hours policy observed past 23:00 to protect pristine desert tranquility.",
    importantInfoAr: "تطبق سياسة الهدوء التام بعد الساعة 11 مساءً للاستمتاع بسكينة الصحراء الفريدة.",
    cancellationPolicyEn: "Free cancellation up to 72 hours prior to check-in.",
    cancellationPolicyAr: "إلغاء مجاني حتى 72 ساعة قبل موعد الوصول.",
    seoTitleEn: "Royal Desert Glamping & Luxury Tents | MZ Tourism Qatar",
    seoTitleAr: "التخييم الملكي الفاخر في صحراء قطر | إم زد للسياحة قطر",
    seoDescriptionEn: "Experience premier luxury desert glamping in Qatar with MZ Tourism Qatar. Air-conditioned royal tents, stargazing, and fine dining.",
    seoDescriptionAr: "استمتع بأفخم تجارب التخييم الصحراوي الملكي في قطر مع إم زد للسياحة قطر. خيام مكيفة ورصد نجوم وعشاء فاخر.",
    featuredImage: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "published",
    isActive: true,
    createdAt: "2026-10-28T15:49:29.063Z",
    updatedAt: "2026-10-31T15:00:00.000Z",
  },
  {
    id: "resort-stays",
    slug: "resort-stays",
    titleEn: "Ultra-Luxury Island & Coastal Resort Retreats",
    titleAr: "إقامات المنتجعات الفاخرة والجزر الخاصة",
    shortDescriptionEn: "Bespoke overwater and coastal sanctuary retreats with private catamaran transfers.",
    shortDescriptionAr: "إقامات فندقية استثنائية في منتجعات الجزر الخاصة والفيلات العائمة في مياه الخليج.",
    descriptionEn: "Indulge in Qatar's finest coastal luxury. From private overwater villas at Banana Island Resort to secluded wellness sanctuaries along the pristine Arabian shoreline, our concierge curates exclusive island buyouts, private yacht transfers, and bespoke spa itineraries.",
    descriptionAr: "استمتع بأقصى درجات الرفاهية الساحلية في قطر. فيلات خاصة عائمة فوق الماء في منتجع جزيرة البنانا وملاذات الاستجمام الهادئة، مع نقل خاص باليخوت والكاتاماران وبرامج سبا مخصصة.",
    category: "luxury",
    destinations: ["Banana Island & Coastal Waters", "Doha City"],
    tourType: "private",
    difficultyLevel: "easy",
    duration: "2+ Days (Custom)",
    maxAltitude: "Sea Level",
    minParticipants: 1,
    maxParticipants: 6,
    pricingType: "per_person",
    totalPrice: 1200,
    depositType: "percentage",
    depositValue: 30,
    currency: "QAR",
    pickupInfoEn: "Luxury limousine transfer to Al Shyoukh Terminal for private boat departure.",
    pickupInfoAr: "التوصيل بسيارة ليموزين فاخرة إلى صالة الشيوخ البحرية لركوب القارب الخاص.",
    itinerary: [
      {
        day: 1,
        time: "14:00",
        titleEn: "Private Yacht Transfer",
        titleAr: "النقل باليخت الخاص",
        descEn: "Executive cruise across the bay to the private island retreat.",
        descAr: "رحلة بحرية خاصة عبر الخليج وصولاً إلى الجزيرة ومقر الإقامة.",
      },
    ],
    inclusionsEn: ["VIP boat transfers", "Concierge liaison", "Welcome amenities and sparkling dates"],
    inclusionsAr: ["النقل البحري السريع الخاص", "تنسيق الكونسيرج", "ضيافة ترحيبية فاخرة"],
    exclusionsEn: ["Incidental room charges"],
    exclusionsAr: ["الرسوم الإضافية للغرف"],
    requiredGearEn: ["Passports / Qatar ID for boat manifest"],
    requiredGearAr: ["جواز السفر أو البطاقة الشخصية القطرية"],
    faqs: [
      {
        questionEn: "Can you assist with special anniversary or romantic setups?",
        questionAr: "هل يمكن تجهيز ترتيبات خاصة للأزواج والمناسبات؟",
        answerEn: "Yes, our concierge orchestrates flower arrangements, personalized cakes, and private beachfront dinners.",
        answerAr: "نعم، يقدم فريق الكونسيرج باقات الورود والعشاء الرومانسي على الشاطئ.",
      },
    ],
    importantInfoEn: "Valid ID / Passport required for marine coast guard manifest.",
    importantInfoAr: "يلزم إبراز إثبات شخصية سارٍ لمانيفست خفر السواحل.",
    cancellationPolicyEn: "Subject to resort policy (up to 7 days prior).",
    cancellationPolicyAr: "تخضع لسياسة المنتجع (حتى 7 أيام قبل الموعد).",
    seoTitleEn: "Luxury Island Resort Retreats Qatar | MZ Tourism Qatar",
    seoTitleAr: "منتجعات الجزر الفاخرة في قطر | إم زد للسياحة قطر",
    seoDescriptionEn: "Book exclusive island getaways and overwater villa sanctuaries with MZ Tourism Qatar.",
    seoDescriptionAr: "احجز ملاذك الخاص في جزر ومنتجعات قطر الفاخرة مع إم زد للسياحة قطر.",
    featuredImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "published",
    isActive: true,
    createdAt: "2026-10-28T15:49:29.063Z",
    updatedAt: "2026-10-31T15:00:00.000Z",
  },
  {
    id: "gcc-travel",
    slug: "gcc-travel",
    titleEn: "GCC Overland VIP Chauffeur (KSA & Bahrain)",
    titleAr: "رحلات برية فاخرة إلى دول الخليج (السعودية والبحرين)",
    shortDescriptionEn: "Cross-border executive chauffeur journeys linking Doha with AlUla, Riyadh, and Manama.",
    shortDescriptionAr: "رحلات برية دولية فاخرة تربط الدوحة بالرياض والعلا والمنامة بسيارات مجهزة مع سائقين معتمدين.",
    descriptionEn: "Cross-border luxury road journeys across the Arabian Peninsula. Travel in supreme armored or executive SUVs with professional bilingual drivers who handle border clearance, customs logistics, and luxury roadside hospitality.",
    descriptionAr: "رحلات برية حصرية عبر دول مجلس التعاون الخليجي في سيارات دفع رباعي فاخرة ومجهزة، مع سائقين محترفين يتولون إجراءات الحدود وتسهيل العبور براحة وأمان تام.",
    category: "gcc",
    destinations: ["Doha City", "GCC Travel"],
    tourType: "private",
    difficultyLevel: "easy",
    duration: "Custom Multi-Day",
    maxAltitude: "Variable",
    minParticipants: 1,
    maxParticipants: 4,
    pricingType: "per_person",
    totalPrice: 1500,
    depositType: "percentage",
    depositValue: 30,
    currency: "QAR",
    pickupInfoEn: "Doorstep pickup in Doha with direct transit to Abu Samra border.",
    pickupInfoAr: "الاستقبال من باب المنزل في الدوحة والتوجه مباشرة إلى منفذ أبو سمرة الحدودي.",
    itinerary: [
      {
        day: 1,
        time: "06:00",
        titleEn: "Doha Departure to Border",
        titleAr: "الانطلاق من الدوحة للمنفذ",
        descEn: "Comfortable cruise to the border with expedited clearance support.",
        descAr: "رحلة مريحة نحو الحدود مع مساعدة في تسهيل إجراءات الدخول.",
      },
    ],
    inclusionsEn: ["Cross-border luxury vehicle with commercial transit permits", "Bilingual driver", "Road tolls and vehicle insurance"],
    inclusionsAr: ["سيارة فاخرة بتصاريح عبور نظامية", "سائق ثنائي اللغة", "التأمين ورسوم العبور"],
    exclusionsEn: ["Passenger visas to target country"],
    exclusionsAr: ["تأشيرات دخول الركاب إلى الدولة المقصودة"],
    requiredGearEn: ["Passports with valid GCC residency or visas"],
    requiredGearAr: ["جوازات سفر سارية مع تأشيرات الدخول"],
    faqs: [
      {
        questionEn: "Are vehicle cross-border papers provided?",
        questionAr: "هل أوراق السيارة والعبور مؤمنة بالكامل؟",
        answerEn: "Yes, our vehicles possess all authorized commercial permits and international road insurance.",
        answerAr: "نعم، كافة مركباتنا تحمل تصاريح تجارية رسمية وتأمين دولي شامل.",
      },
    ],
    importantInfoEn: "Passengers must hold valid entry visas for Saudi Arabia or destination country.",
    importantInfoAr: "يجب أن يحمل الركاب تأشيرة دخول سارية للمملكة العربية السعودية أو الوجهة المطلوبة.",
    cancellationPolicyEn: "Free cancellation up to 7 days before departure.",
    cancellationPolicyAr: "إلغاء مجاني حتى 7 أيام قبل موعد الرحلة.",
    seoTitleEn: "GCC Cross-Border VIP Chauffeur | MZ Tourism Qatar",
    seoTitleAr: "توصيل ورحلات برية لدول الخليج | إم زد للسياحة قطر",
    seoDescriptionEn: "Luxury cross-border chauffeur travel between Qatar, Saudi Arabia, and Bahrain with MZ Tourism Qatar.",
    seoDescriptionAr: "رحلات برية فاخرة وسائقون محترفون بين قطر والمملكة العربية السعودية والبحرين مع إم زد للسياحة قطر.",
    featuredImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "published",
    isActive: true,
    createdAt: "2026-10-28T15:49:29.063Z",
    updatedAt: "2026-10-31T15:00:00.000Z",
  },
];
