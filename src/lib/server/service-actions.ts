"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserAction } from "./auth-actions";
import {
  upsertServiceSchema,
  SERVICE_CATEGORIES,
  type PublicCatalogServiceItem,
  type DetailedCatalogServiceItem,
} from "@/lib/validations/service-schemas";
import { en } from "@/translations/en";
import { ar } from "@/translations/ar";
import { getPublicToursAction, getPublicTourBySlugAction } from "./tour-actions";

/**
 * Ensures caller is an active admin or authenticated staff member.
 */
async function assertAdminAccess() {
  const session = await getCurrentUserAction();
  if (!session.success || !session.data || !session.data.isAdmin) {
    throw new Error("Unauthorized: Staff or administrator clearance required.");
  }
  return session.data;
}

/**
 * Helper to match category id/value across catalog filters.
 */
function matchesCategoryFilter(
  serviceId: string,
  serviceDbCat: string,
  filterCategory: string
): boolean {
  if (!filterCategory || filterCategory === "all") return true;

  if (serviceId === filterCategory) return true;
  if (serviceDbCat.toLowerCase() === filterCategory.toLowerCase()) return true;

  // Normalized matching
  const catConfig = SERVICE_CATEGORIES.find((c) => c.id === filterCategory);
  if (catConfig && "dbCat" in catConfig && catConfig.dbCat === serviceDbCat) {
    return true;
  }

  // Cross-category groupings
  if (filterCategory === "desert-safari" && (serviceId === "desert-safari" || serviceDbCat === "safari")) {
    return true;
  }
  if (filterCategory === "doha-city-tours" && (serviceId === "doha-city-tours" || serviceDbCat === "culture" || serviceDbCat === "city")) {
    return true;
  }
  if (filterCategory === "airport-hotel-transfers" && (serviceId === "airport-hotel-transfers" || serviceDbCat === "transfers" || serviceDbCat === "logistics")) {
    return true;
  }
  if (filterCategory === "resort-stays" && (serviceId === "resort-stays" || serviceDbCat === "luxury" || serviceDbCat === "resort")) {
    return true;
  }
  if (filterCategory === "celebrations-events" && (serviceId === "celebrations-events" || serviceDbCat === "events")) {
    return true;
  }
  if (filterCategory === "horse-riding" && serviceId === "horse-riding") {
    return true;
  }
  if (filterCategory === "gcc-travel" && (serviceId === "gcc-travel" || serviceDbCat === "transfers")) {
    return true;
  }
  if (
    filterCategory === "tent-desert-camp" &&
    (serviceId === "tent-desert-camp" || serviceId === "tent-desert-camps")
  ) {
    return true;
  }

  return false;
}

/**
 * Normalizes service ID to match between DB and translation dictionaries.
 */
function normalizeServiceId(id: string): string {
  if (id === "tent-desert-camps") return "tent-desert-camp";
  return id;
}

/**
 * Get category label based on locale.
 */
function getCategoryLabel(categoryId: string, locale: "en" | "ar"): string {
  const found = SERVICE_CATEGORIES.find(
    (c) => c.id === categoryId || ("dbCat" in c && c.dbCat === categoryId)
  );
  if (found) {
    return locale === "ar" ? found.labelAr : found.labelEn;
  }
  return categoryId.replace(/-/g, " ").toUpperCase();
}

/**
 * Fallback luxury image if a custom DB service does not have an entry in dict.
 */
const DEFAULT_LUXURY_IMAGE =
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80";

// =============================================================================
// PUBLIC ACTIONS
// =============================================================================

/**
 * Fetch all active services for the public catalog with optional category and search filters.
 */
export async function getPublicServicesAction(
  locale: "en" | "ar",
  filterCategory: string = "all",
  searchQuery: string = ""
): Promise<{ success: boolean; data: PublicCatalogServiceItem[]; error?: string }> {
  try {
    const supabase = await createClient();
    const dict = locale === "ar" ? ar : en;

    // Fetch published tours from Tour Management System
    const toursRes = await getPublicToursAction(locale, filterCategory, searchQuery);
    const publishedTours = toursRes.success ? toursRes.data : [];
    const tourSlugMap = new Map(publishedTours.map((t) => [t.slug, t]));

    const { data: dbRows, error: dbError } = await supabase
      .from("services")
      .select("id, title_en, title_ar, category, duration, indicative_price, is_active, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    let sourceRows: Array<{
      id: string;
      title_en: string;
      title_ar: string;
      category: string;
      duration: string;
      indicative_price: string;
      is_active: boolean;
      created_at: string;
    }> = [];

    if (dbError || !dbRows || dbRows.length === 0) {
      sourceRows = dict.services.map((s) => ({
        id: normalizeServiceId(s.id),
        title_en: en.services.find((e) => normalizeServiceId(e.id) === normalizeServiceId(s.id))?.title || s.title,
        title_ar: ar.services.find((a) => normalizeServiceId(a.id) === normalizeServiceId(s.id))?.title || s.title,
        category: s.category,
        duration: s.duration,
        indicative_price: s.indicativePrice,
        is_active: true,
        created_at: new Date().toISOString(),
      }));
    } else {
      sourceRows = dbRows;
    }

    // Merge DB rows with rich tour data
    const mergedList: PublicCatalogServiceItem[] = [];
    const seenIds = new Set<string>();

    for (const row of sourceRows) {
      const normId = normalizeServiceId(row.id);
      const tour = tourSlugMap.get(normId) || tourSlugMap.get(row.id);
      const dictItem = dict.services.find(
        (s) => normalizeServiceId(s.id) === normId || s.id === row.id
      );

      const title = tour
        ? locale === "ar"
          ? tour.titleAr
          : tour.titleEn
        : locale === "ar"
        ? row.title_ar
        : row.title_en;

      const categoryLabel = getCategoryLabel(tour?.category || row.category || row.id, locale);

      const indicativePrice = tour
        ? tour.pricingType === "per_person"
          ? `${tour.totalPrice.toLocaleString("en-US")} QAR / ${locale === "ar" ? "شخص" : "Guest"}`
          : `${tour.totalPrice.toLocaleString("en-US")} QAR / ${locale === "ar" ? "جولة خاصة" : "Private Tour"}`
        : row.indicative_price || dictItem?.indicativePrice || (locale === "ar" ? "حسب الطلب" : "Private Quote on Request");

      const priceNote = tour
        ? tour.depositType === "percentage"
          ? locale === "ar"
            ? `العربون المطلوب: %${tour.depositValue} (${Math.round((tour.totalPrice * tour.depositValue) / 100)} ر.ق)`
            : `Deposit required: ${tour.depositValue}% (${Math.round((tour.totalPrice * tour.depositValue) / 100)} QAR)`
          : locale === "ar"
          ? `العربون المطلوب: ${tour.depositValue} ر.ق`
          : `Deposit required: ${tour.depositValue} QAR`
        : dictItem?.priceNote || (locale === "ar" ? "[تسعير تقديري - خاضع لتأكيد الكونسيرج]" : "[Indicative rate - subject to concierge confirmation]");

      mergedList.push({
        id: row.id,
        title: title || dictItem?.title || "Signature Qatar Experience",
        subtitle:
          (tour ? (locale === "ar" ? tour.shortDescriptionAr : tour.shortDescriptionEn) : dictItem?.subtitle) ||
          (locale === "ar" ? "جولة وتجربة سياحية فاخرة" : "Exclusive Luxury Tour"),
        category: tour?.category || row.category,
        categoryLabel,
        duration: tour?.duration || row.duration || dictItem?.duration || "Custom Duration",
        indicativePrice,
        priceNote,
        description:
          (tour ? (locale === "ar" ? tour.descriptionAr : tour.descriptionEn) : dictItem?.description) ||
          (locale === "ar"
            ? "خدمة سياحية فاخرة مصممة خصيصاً وفق أعلى معايير الضيافة القطرية الأصيلة."
            : "Bespoke luxury tourism service crafted to the highest standards of Qatari hospitality."),
        image: tour?.featuredImage || dictItem?.image || DEFAULT_LUXURY_IMAGE,
        highlights:
          (tour
            ? locale === "ar"
              ? tour.inclusionsAr.slice(0, 3)
              : tour.inclusionsEn.slice(0, 3)
            : dictItem?.highlights) || [
            locale === "ar" ? "سيارة خاصة فاخرة" : "Private Luxury Vehicle",
            locale === "ar" ? "مرشد سياحي مرخص" : "Licensed Tourist Guide",
            locale === "ar" ? "خدمة كونسيرج 24/7" : "24/7 Concierge Support",
          ],
        inquiryMessage:
          dictItem?.inquiryMessage ||
          `Hello MZ Tourism Qatar. I would like to inquire about ${tour?.titleEn || row.title_en}. Please provide details and availability.`,
        vehicleType: dictItem?.vehicleType || (locale === "ar" ? "أسطول سيارات الدفع الرباعي الفاخرة" : "VIP Luxury Fleet / 4x4 Land Cruiser"),
        suitability: dictItem?.suitability || (locale === "ar" ? "مناسب للعائلات وكبار الشخصيات ورجال الأعمال" : "Suitable for families, executives, and VIP guests"),
        isActive: row.is_active,
        createdAt: row.created_at,
      });

      seenIds.add(row.id);
      seenIds.add(normId);
    }

    // Also include newly created published tours not yet in services table
    for (const tour of publishedTours) {
      if (!seenIds.has(tour.slug) && !seenIds.has(tour.id)) {
        const title = locale === "ar" ? tour.titleAr : tour.titleEn;
        const categoryLabel = getCategoryLabel(tour.category, locale);
        const indicativePrice =
          tour.pricingType === "per_person"
            ? `${tour.totalPrice.toLocaleString("en-US")} QAR / ${locale === "ar" ? "شخص" : "Guest"}`
            : `${tour.totalPrice.toLocaleString("en-US")} QAR / ${locale === "ar" ? "جولة خاصة" : "Private Tour"}`;
        const priceNote =
          tour.depositType === "percentage"
            ? locale === "ar"
              ? `العربون المطلوب: %${tour.depositValue} (${Math.round((tour.totalPrice * tour.depositValue) / 100)} ر.ق)`
              : `Deposit required: ${tour.depositValue}% (${Math.round((tour.totalPrice * tour.depositValue) / 100)} QAR)`
            : locale === "ar"
            ? `العربون المطلوب: ${tour.depositValue} ر.ق`
            : `Deposit required: ${tour.depositValue} QAR`;

        mergedList.push({
          id: tour.slug,
          title,
          subtitle: locale === "ar" ? tour.shortDescriptionAr : tour.shortDescriptionEn,
          category: tour.category,
          categoryLabel,
          duration: tour.duration,
          indicativePrice,
          priceNote,
          description: locale === "ar" ? tour.descriptionAr : tour.descriptionEn,
          image: tour.featuredImage || DEFAULT_LUXURY_IMAGE,
          highlights:
            (locale === "ar"
              ? tour.inclusionsAr.slice(0, 3)
              : tour.inclusionsEn.slice(0, 3)) || [
              locale === "ar" ? "سيارة خاصة فاخرة" : "Private Luxury Vehicle",
              locale === "ar" ? "مرشد سياحي مرخص" : "Licensed Tourist Guide",
              locale === "ar" ? "خدمة كونسيرج 24/7" : "24/7 Concierge Support",
            ],
          inquiryMessage: `Hello MZ Tourism Qatar. I would like to inquire about ${tour.titleEn}. Please provide details and availability.`,
          vehicleType: locale === "ar" ? "أسطول سيارات الدفع الرباعي الفاخرة" : "VIP Luxury Fleet / 4x4 Land Cruiser",
          suitability: locale === "ar" ? "مناسب للعائلات وكبار الشخصيات ورجال الأعمال" : "Suitable for families, executives, and VIP guests",
          isActive: true,
          createdAt: tour.createdAt || new Date().toISOString(),
        });
        seenIds.add(tour.slug);
      }
    }

    // Apply category filter
    let filtered = mergedList;
    if (filterCategory && filterCategory !== "all") {
      filtered = filtered.filter((s) => matchesCategoryFilter(s.id, s.category, filterCategory));
    }

    // Apply search query filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((s) => {
        return (
          s.title.toLowerCase().includes(query) ||
          s.subtitle.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.categoryLabel.toLowerCase().includes(query) ||
          s.highlights.some((h) => h.toLowerCase().includes(query))
        );
      });
    }

    return { success: true, data: filtered };
  } catch (err) {
    console.error("[Get Public Services Action Error]", err);
    return { success: false, data: [], error: (err as Error).message };
  }
}

/**
 * Fetch a single active service or tour by ID with complete itinerary, inclusions, and exclusions.
 * Draft and archived tours are hidden and return null.
 */
export async function getPublicServiceByIdAction(
  id: string,
  locale: "en" | "ar"
): Promise<{ success: boolean; data: DetailedCatalogServiceItem | null; error?: string }> {
  try {
    const normId = normalizeServiceId(id);

    // 1. First check Tour Management System for published tour
    const tourRes = await getPublicTourBySlugAction(normId, locale);
    if (tourRes.success && tourRes.data) {
      const tour = tourRes.data;
      const title = locale === "ar" ? tour.titleAr : tour.titleEn;
      const categoryLabel = getCategoryLabel(tour.category, locale);

      const indicativePrice =
        tour.pricingType === "per_person"
          ? `${tour.totalPrice.toLocaleString("en-US")} QAR / ${locale === "ar" ? "شخص" : "Guest"}`
          : `${tour.totalPrice.toLocaleString("en-US")} QAR / ${locale === "ar" ? "جولة خاصة" : "Private Tour"}`;

      const priceNote =
        tour.depositType === "percentage"
          ? locale === "ar"
            ? `العربون المطلوب: %${tour.depositValue} (${Math.round((tour.totalPrice * tour.depositValue) / 100)} ر.ق)`
            : `Deposit required: ${tour.depositValue}% (${Math.round((tour.totalPrice * tour.depositValue) / 100)} QAR)`
          : locale === "ar"
          ? `العربون المطلوب: ${tour.depositValue} ر.ق`
          : `Deposit required: ${tour.depositValue} QAR`;

      const detailedService: DetailedCatalogServiceItem = {
        id: tour.slug,
        title,
        subtitle: locale === "ar" ? tour.shortDescriptionAr : tour.shortDescriptionEn,
        category: tour.category,
        categoryLabel,
        duration: tour.duration,
        indicativePrice,
        priceNote,
        description: locale === "ar" ? tour.descriptionAr : tour.descriptionEn,
        image: tour.featuredImage || DEFAULT_LUXURY_IMAGE,
        galleryImages:
          tour.galleryImages && tour.galleryImages.length > 0
            ? tour.galleryImages
            : [tour.featuredImage || DEFAULT_LUXURY_IMAGE],
        difficultyLevel: tour.difficultyLevel || "easy",
        destinations: tour.destinations || [],
        minParticipants: tour.minParticipants || 1,
        maxParticipants: tour.maxParticipants || 6,
        pricingType: tour.pricingType || "per_person",
        totalPrice: tour.totalPrice,
        depositType: tour.depositType || "percentage",
        depositValue: tour.depositValue || 30,
        pickupInfo: locale === "ar" ? tour.pickupInfoAr : tour.pickupInfoEn,
        faqs: (tour.faqs || []).map((f) => ({
          question: locale === "ar" ? f.questionAr : f.questionEn,
          answer: locale === "ar" ? f.answerAr : f.answerEn,
        })),
        importantInfo: locale === "ar" ? tour.importantInfoAr : tour.importantInfoEn,
        cancellationPolicy: locale === "ar" ? tour.cancellationPolicyAr : tour.cancellationPolicyEn,
        departures: tour.departures || [],
        highlights:
          (locale === "ar"
            ? tour.inclusionsAr.slice(0, 4)
            : tour.inclusionsEn.slice(0, 4)) || [
            locale === "ar" ? "سيارة خاصة فاخرة" : "Private Luxury Vehicle",
            locale === "ar" ? "مرشد سياحي مرخص" : "Licensed Tourist Guide",
            locale === "ar" ? "خدمة كونسيرج 24/7" : "24/7 Concierge Support",
          ],
        inquiryMessage: `Hello MZ Tourism Qatar. I would like to inquire about ${tour.titleEn}. Please provide details and availability.`,
        vehicleType: locale === "ar" ? "أسطول سيارات الدفع الرباعي الفاخرة" : "VIP Luxury Fleet / 4x4 Land Cruiser",
        suitability: locale === "ar" ? "مناسب للعائلات وكبار الشخصيات ورجال الأعمال" : "Suitable for families, executives, and VIP guests",
        isActive: true,
        createdAt: tour.createdAt || new Date().toISOString(),
        inclusions: locale === "ar" ? tour.inclusionsAr : tour.inclusionsEn,
        exclusions: locale === "ar" ? tour.exclusionsAr : tour.exclusionsEn,
        itinerary: (tour.itinerary || []).map((stop) => ({
          day: stop.day || 1,
          time: stop.time,
          title: locale === "ar" ? stop.titleAr : stop.titleEn,
          desc: locale === "ar" ? stop.descAr : stop.descEn,
        })),
        whatToBring: (locale === "ar" ? tour.requiredGearAr : tour.requiredGearEn) || [],
      };

      return { success: true, data: detailedService };
    }

    // If tour is specifically marked draft/archived, do not reveal it
    if (tourRes.error && tourRes.error.includes("unavailable")) {
      return { success: false, data: null, error: "Tour not found or currently unavailable." };
    }

    // 2. Query DB for services table record
    const supabase = await createClient();
    const dict = locale === "ar" ? ar : en;

    const { data: row, error } = await supabase
      .from("services")
      .select("id, title_en, title_ar, category, duration, indicative_price, is_active, created_at")
      .or(`id.eq.${id},id.eq.${normId}`)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("[DB Query Service By ID Error]", error);
    }

    let matchedRow = row;
    if (!matchedRow) {
      const fallbackDict = dict.services.find(
        (s) => normalizeServiceId(s.id) === normId || s.id === id
      );
      if (fallbackDict) {
        matchedRow = {
          id: fallbackDict.id,
          title_en: en.services.find((e) => normalizeServiceId(e.id) === normId)?.title || fallbackDict.title,
          title_ar: ar.services.find((a) => normalizeServiceId(a.id) === normId)?.title || fallbackDict.title,
          category: fallbackDict.category,
          duration: fallbackDict.duration,
          indicative_price: fallbackDict.indicativePrice,
          is_active: true,
          created_at: new Date().toISOString(),
        };
      }
    }

    if (!matchedRow || !matchedRow.is_active) {
      return { success: false, data: null, error: "Service not found or unavailable." };
    }

    const dictItem = dict.services.find(
      (s) => normalizeServiceId(s.id) === normId || s.id === matchedRow!.id
    );

    const title = locale === "ar" ? matchedRow.title_ar : matchedRow.title_en;
    const categoryLabel = getCategoryLabel(matchedRow.category || matchedRow.id, locale);

    const detailedService: DetailedCatalogServiceItem = {
      id: matchedRow.id,
      title: title || dictItem?.title || "Signature Qatar Experience",
      subtitle: dictItem?.subtitle || (locale === "ar" ? "جولة وتجربة سياحية فاخرة" : "Exclusive Luxury Tour"),
      category: matchedRow.category,
      categoryLabel,
      duration: matchedRow.duration || dictItem?.duration || "Custom Duration",
      indicativePrice: matchedRow.indicative_price || dictItem?.indicativePrice || (locale === "ar" ? "حسب الطلب" : "Private Quote on Request"),
      priceNote: dictItem?.priceNote || (locale === "ar" ? "[تسعير تقديري - خاضع لتأكيد الكونسيرج]" : "[Indicative rate - subject to concierge confirmation]"),
      description: dictItem?.description || (locale === "ar" ? "خدمة سياحية فاخرة مصممة خصيصاً وفق أعلى معايير الضيافة القطرية الأصيلة." : "Bespoke luxury tourism service crafted to the highest standards of Qatari hospitality."),
      image: dictItem?.image || DEFAULT_LUXURY_IMAGE,
      highlights: dictItem?.highlights || [
        locale === "ar" ? "سيارة خاصة فاخرة" : "Private Luxury Vehicle",
        locale === "ar" ? "مرشد سياحي مرخص" : "Licensed Tourist Guide",
        locale === "ar" ? "خدمة كونسيرج 24/7" : "24/7 Concierge Support",
      ],
      inquiryMessage:
        dictItem?.inquiryMessage ||
        `Hello MZ Tourism Qatar. I would like to inquire about ${matchedRow.title_en}. Please provide details and availability.`,
      vehicleType: dictItem?.vehicleType || (locale === "ar" ? "أسطول سيارات الدفع الرباعي الفاخرة" : "VIP Luxury Fleet / 4x4 Land Cruiser"),
      suitability: dictItem?.suitability || (locale === "ar" ? "مناسب للعائلات وكبار الشخصيات ورجال الأعمال" : "Suitable for families, executives, and VIP guests"),
      isActive: matchedRow.is_active,
      createdAt: matchedRow.created_at,
      inclusions: dictItem?.inclusions || [
        locale === "ar" ? "مركبة خاصة فاخرة مع سائق محترف" : "Private luxury vehicle with professional chauffeur",
        locale === "ar" ? "مياه معدنية ومشروبات منعشة طوال الرحلة" : "Chilled mineral water and refreshments",
        locale === "ar" ? "خدمة الاستقبال والتوصيل من وإلى مقر الإقامة بالدوحة" : "Doorstep pick-up and drop-off across Doha",
      ],
      exclusions: dictItem?.exclusions || [
        locale === "ar" ? "المصاريف الشخصية والهدايا التذكارية" : "Personal expenses and discretionary gratuities",
      ],
      itinerary: dictItem?.itinerary || [
        {
          time: locale === "ar" ? "البداية" : "Departure",
          title: locale === "ar" ? "الاستقبال الخاص" : "Private Hotel Pickup",
          desc: locale === "ar" ? "الالتقاء بالسائق الخاص في الفندق أو المطار في سيارة فاخرة ومريحة." : "Meet your private chauffeur at your Doha hotel or Hamad Airport in a pristine luxury vehicle.",
        },
        {
          time: locale === "ar" ? "التجربة" : "Experience",
          title: locale === "ar" ? "بدء الجولة الحصرية" : "Signature Tour Program",
          desc: locale === "ar" ? "استكشاف المعالم مع إرشادات شاملة وأوقات تصوير مميزة." : "Explore signature landmarks with cultural guidance and tailored photography opportunities.",
        },
        {
          time: locale === "ar" ? "العودة" : "Return",
          title: locale === "ar" ? "العودة المريحة" : "Comfortable Return",
          desc: locale === "ar" ? "التوصيل إلى الفندق أو الوجهة المختارة في الدوحة." : "Chauffeured return directly to your doorstep in Doha.",
        },
      ],
      whatToBring: dictItem?.whatToBring || [
        locale === "ar" ? "ملابس مريحة" : "Comfortable attire",
        locale === "ar" ? "نظارات شمسية" : "Sunglasses",
        locale === "ar" ? "كاميرا للتصوير" : "Camera / smartphone",
      ],
      galleryImages: [dictItem?.image || DEFAULT_LUXURY_IMAGE],
      difficultyLevel: "easy",
      destinations: [locale === "ar" ? "الدوحة، دولة قطر" : "Doha, State of Qatar"],
      minParticipants: 1,
      maxParticipants: 6,
      pricingType: "per_person",
      totalPrice: 450,
      depositType: "percentage",
      depositValue: 30,
      pickupInfo: locale === "ar"
        ? "خدمة الاستقبال والتوصيل مجانية من أي فندق أو مقر إقامة بالدوحة أو مطار حمد الدولي."
        : "Complimentary private chauffeur pickup and drop-off from any hotel, residence, or Hamad International Airport in Doha.",
      faqs: [
        {
          question: locale === "ar" ? "كيف يتم تأكيد الحجز بعد تقديم الطلب؟" : "How is my booking confirmed after submitting?",
          answer: locale === "ar"
            ? "يقوم فريق الكونسيرج بمراجعة تفاصيل الرحلة وتأكيد توفر المركبة الخاصة، ثم يتم إرسال إرشادات إيداع العربون المطلوب لتأكيد الحجز."
            : "Our concierge verifies vehicle availability and coordinates your booking dossier, providing verified manual deposit instructions to lock in your reservation.",
        },
        {
          question: locale === "ar" ? "هل يمكن تعديل المواعيد أو المسار؟" : "Can pickup timings or itinerary be customized?",
          answer: locale === "ar"
            ? "نعم، كافة خدماتنا خاصة ويمكن تعديل مواعيد الانطلاق ونقاط التوقف بالتنسيق مع السائق الخاص."
            : "Yes, all experiences are private and departure timings can be tailored to your flight schedules or hotel preferences.",
        },
      ],
      importantInfo: locale === "ar"
        ? "يرجى اصطحاب جواز السفر أو البطاقة الشخصية القطرية، وإبلاغنا مسبقاً في حال وجود أي متطلبات خاصة."
        : "Please have your passport or Qatar ID available. Inform our concierge in advance of any dietary or accessibility preferences.",
      cancellationPolicy: locale === "ar"
        ? "إلغاء مجاني واسترداد كامل للعربون حتى 48 ساعة قبل موعد الانطلاق."
        : "Complimentary cancellation and full deposit refund up to 48 hours prior to scheduled departure.",
      departures: [],
    };

    return { success: true, data: detailedService };
  } catch (err) {
    console.error("[Get Public Service By ID Action Error]", err);
    return { success: false, data: null, error: (err as Error).message };
  }
}

// =============================================================================
// ADMIN ACTIONS
// =============================================================================

/**
 * Fetch all services for admin management (active and inactive).
 */
export async function getAdminServicesAction(): Promise<{
  success: boolean;
  data: Array<{
    id: string;
    titleEn: string;
    titleAr: string;
    category: string;
    duration: string;
    indicativePrice: string;
    isActive: boolean;
    createdAt: string;
  }>;
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("services")
      .select("id, title_en, title_ar, category, duration, indicative_price, is_active, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    const formatted = (data || []).map((row) => ({
      id: row.id,
      titleEn: row.title_en,
      titleAr: row.title_ar,
      category: row.category,
      duration: row.duration,
      indicativePrice: row.indicative_price,
      isActive: row.is_active,
      createdAt: row.created_at,
    }));

    return { success: true, data: formatted };
  } catch (err) {
    console.error("[Get Admin Services Error]", err);
    return { success: false, data: [], error: (err as Error).message };
  }
}

/**
 * Create or update a service in public.services.
 */
export async function upsertAdminServiceAction(rawInput: unknown): Promise<{
  success: boolean;
  data?: { id: string };
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const parsed = upsertServiceSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid service data" };
    }

    const { id, title_en, title_ar, category, duration, indicative_price, is_active } = parsed.data;
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("services")
      .upsert(
        {
          id,
          title_en,
          title_ar,
          category,
          duration,
          indicative_price,
          is_active,
        },
        { onConflict: "id" }
      )
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data: { id: data.id } };
  } catch (err) {
    console.error("[Upsert Admin Service Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Toggle active/published status of a service.
 */
export async function toggleServiceActiveAction(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminAccess();
    if (!id || typeof id !== "string") {
      return { success: false, error: "Valid service ID is required" };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("services")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (err) {
    console.error("[Toggle Service Active Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Delete a service row from public.services.
 */
export async function deleteAdminServiceAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminAccess();
    if (!id || typeof id !== "string") {
      return { success: false, error: "Valid service ID is required" };
    }

    const admin = createAdminClient();
    const { error } = await admin.from("services").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (err) {
    console.error("[Delete Admin Service Error]", err);
    return { success: false, error: (err as Error).message };
  }
}
