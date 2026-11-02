import { z } from "zod";

/**
 * Valid categories for MZ Tourism Qatar services catalog.
 */
export const SERVICE_CATEGORIES = [
  { id: "all", labelEn: "All Services", labelAr: "كافة الخدمات" },
  { id: "desert-safari", labelEn: "Desert Safari", labelAr: "سفاري صحراوي", dbCat: "safari" },
  { id: "doha-city-tours", labelEn: "Doha City Tours", labelAr: "جولات الدوحة الثقافية", dbCat: "culture" },
  { id: "airport-hotel-transfers", labelEn: "Airport & Hotel Transfers", labelAr: "مواصلات المطار والفنادق", dbCat: "transfers" },
  { id: "resort-stays", labelEn: "Resort & Hotel Stays", labelAr: "منتجعات وإقامات فاخرة", dbCat: "luxury" },
  { id: "celebrations-events", labelEn: "Celebrations & Special Occasions", labelAr: "احتفالات ومناسبات خاصة", dbCat: "luxury" },
  { id: "horse-riding", labelEn: "Horse Riding", labelAr: "فروسية وركوب الخيل العربي", dbCat: "safari" },
  { id: "gcc-travel", labelEn: "GCC Travel", labelAr: "رحلات دول مجلس التعاون", dbCat: "transfers" },
  { id: "tent-desert-camp", labelEn: "Desert Camps & Tents", labelAr: "مخيمات وتخييم صحراوي", dbCat: "safari" },
] as const;

export type ServiceCategoryId = (typeof SERVICE_CATEGORIES)[number]["id"];

/**
 * Validation schema for creating or updating a service row in public.services.
 */
export const upsertServiceSchema = z.object({
  id: z
    .string()
    .min(2, "ID / slug must be at least 2 characters")
    .max(64, "ID / slug cannot exceed 64 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with single hyphens (e.g. desert-safari)"
    ),
  title_en: z.string().trim().min(3, "English title must be at least 3 characters"),
  title_ar: z.string().trim().min(3, "Arabic title must be at least 3 characters"),
  category: z.string().trim().min(2, "Category is required"),
  duration: z.string().trim().min(1, "Duration is required (e.g. '4 - 6 Hours')"),
  indicative_price: z
    .string()
    .trim()
    .min(1, "Indicative price is required (e.g. '450 QAR / person' or 'Private Quote')"),
  is_active: z.boolean().default(true),
});

export type UpsertServiceInput = z.infer<typeof upsertServiceSchema>;

/**
 * Interface representing a service card item in the public catalog.
 */
export interface PublicCatalogServiceItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  categoryLabel: string;
  duration: string;
  indicativePrice: string;
  priceNote: string;
  description: string;
  image: string;
  highlights: string[];
  inquiryMessage: string;
  vehicleType: string;
  suitability: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * Interface representing a detailed single service with itinerary, departure dates, and inclusions.
 */
export interface DetailedCatalogServiceItem extends PublicCatalogServiceItem {
  inclusions: string[];
  exclusions: string[];
  itinerary: Array<{ day?: number; time: string; title: string; desc: string }>;
  whatToBring: string[];
  galleryImages?: string[];
  difficultyLevel?: "easy" | "moderate" | "challenging";
  destinations?: string[];
  minParticipants?: number;
  maxParticipants?: number;
  pricingType?: "per_person" | "per_private_tour";
  totalPrice?: number;
  depositType?: "percentage" | "fixed";
  depositValue?: number;
  pickupInfo?: string;
  faqs?: Array<{ question: string; answer: string }>;
  importantInfo?: string;
  cancellationPolicy?: string;
  departures?: Array<{
    id: string;
    tourId: string;
    departureDate: string;
    startTime: string;
    endTime?: string;
    capacity: number;
    reservedSeats: number;
    availableSeats: number;
    status: "open" | "closed" | "sold_out" | "cancelled";
    pricingOverride?: number | null;
  }>;
}
