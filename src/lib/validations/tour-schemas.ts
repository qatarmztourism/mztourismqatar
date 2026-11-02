import { z } from "zod";

export const TOUR_CATEGORIES_LIST = [
  "safari",
  "culture",
  "transfers",
  "luxury",
  "events",
  "equestrian",
  "glamping",
  "gcc",
] as const;

export const TOUR_DIFFICULTY_LIST = ["easy", "moderate", "challenging"] as const;
export const TOUR_TYPE_LIST = ["private", "group"] as const;
export const PRICING_TYPE_LIST = ["per_person", "per_private_tour"] as const;
export const DEPOSIT_TYPE_LIST = ["percentage", "fixed"] as const;
export const TOUR_STATUS_LIST = ["draft", "published", "archived"] as const;
export const DEPARTURE_STATUS_LIST = ["open", "closed", "sold_out", "cancelled"] as const;

export const itineraryStopSchema = z.object({
  day: z.number().int().min(1).optional(),
  time: z.string().trim().min(1, "Time is required"),
  titleEn: z.string().trim().min(1, "English title is required"),
  titleAr: z.string().trim().min(1, "Arabic title is required"),
  descEn: z.string().trim().min(1, "English description is required"),
  descAr: z.string().trim().min(1, "Arabic description is required"),
});

export const tourFaqSchema = z.object({
  questionEn: z.string().trim().min(1, "English question is required"),
  questionAr: z.string().trim().min(1, "Arabic question is required"),
  answerEn: z.string().trim().min(1, "English answer is required"),
  answerAr: z.string().trim().min(1, "Arabic answer is required"),
});

export const upsertTourSchema = z.object({
  id: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(80, "Slug must not exceed 80 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must only contain lowercase alphanumeric characters and single hyphens"),
  titleEn: z.string().trim().min(3, "English title must be at least 3 characters").max(160),
  titleAr: z.string().trim().min(3, "Arabic title must be at least 3 characters").max(160),
  shortDescriptionEn: z.string().trim().max(300).optional().default(""),
  shortDescriptionAr: z.string().trim().max(300).optional().default(""),
  descriptionEn: z.string().trim().min(10, "English description must be at least 10 characters"),
  descriptionAr: z.string().trim().min(10, "Arabic description must be at least 10 characters"),
  category: z.enum(TOUR_CATEGORIES_LIST),
  destinations: z.array(z.string().trim()).min(1, "At least one destination is required"),
  tourType: z.enum(TOUR_TYPE_LIST).default("private"),
  difficultyLevel: z.enum(TOUR_DIFFICULTY_LIST).default("easy"),
  duration: z.string().trim().min(2, "Duration is required").max(60),
  maxAltitude: z.string().trim().max(60).optional().default("Sea Level"),
  minParticipants: z.number().int().min(1, "Minimum participants must be at least 1").default(1),
  maxParticipants: z.number().int().min(1, "Maximum participants must be at least 1").default(6),
  pricingType: z.enum(PRICING_TYPE_LIST).default("per_private_tour"),
  totalPrice: z.number().min(50, "Total price must be at least 50 QAR"),
  depositType: z.enum(DEPOSIT_TYPE_LIST).default("percentage"),
  depositValue: z.number().min(0, "Deposit value cannot be negative"),
  currency: z.literal("QAR").default("QAR"),
  pickupInfoEn: z.string().trim().max(300).optional().default(""),
  pickupInfoAr: z.string().trim().max(300).optional().default(""),
  itinerary: z.array(itineraryStopSchema).default([]),
  inclusionsEn: z.array(z.string().trim()).default([]),
  inclusionsAr: z.array(z.string().trim()).default([]),
  exclusionsEn: z.array(z.string().trim()).default([]),
  exclusionsAr: z.array(z.string().trim()).default([]),
  requiredGearEn: z.array(z.string().trim()).default([]),
  requiredGearAr: z.array(z.string().trim()).default([]),
  faqs: z.array(tourFaqSchema).default([]),
  importantInfoEn: z.string().trim().max(2000).optional().default(""),
  importantInfoAr: z.string().trim().max(2000).optional().default(""),
  cancellationPolicyEn: z.string().trim().max(1000).optional().default(""),
  cancellationPolicyAr: z.string().trim().max(1000).optional().default(""),
  seoTitleEn: z.string().trim().max(120).optional().default(""),
  seoTitleAr: z.string().trim().max(120).optional().default(""),
  seoDescriptionEn: z.string().trim().max(300).optional().default(""),
  seoDescriptionAr: z.string().trim().max(300).optional().default(""),
  featuredImage: z.string().url("Featured image must be a valid URL").optional().or(z.literal("")),
  galleryImages: z.array(z.string().url()).default([]),
  status: z.enum(TOUR_STATUS_LIST).default("published"),
}).refine((data) => data.maxParticipants >= data.minParticipants, {
  message: "Maximum participants must be greater than or equal to minimum participants",
  path: ["maxParticipants"],
}).refine((data) => {
  if (data.depositType === "percentage") {
    return data.depositValue <= 100;
  }
  return data.depositValue <= data.totalPrice;
}, {
  message: "Deposit cannot exceed total price or 100%",
  path: ["depositValue"],
});

export const departureSchema = z.object({
  id: z.string().optional(),
  tourId: z.string().trim().min(2),
  departureDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Departure date must be YYYY-MM-DD format"),
  startTime: z.string().trim().min(2, "Start time is required"),
  endTime: z.string().trim().optional(),
  capacity: z.number().int().min(1, "Capacity must be at least 1 seat"),
  reservedSeats: z.number().int().min(0).default(0),
  status: z.enum(DEPARTURE_STATUS_LIST).default("open"),
  pricingOverride: z.number().min(0).nullable().optional(),
});

export type UpsertTourInput = z.infer<typeof upsertTourSchema>;
export type DepartureInput = z.infer<typeof departureSchema>;
