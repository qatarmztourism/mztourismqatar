import { z } from "zod";

export const VALID_SERVICE_IDS = [
  "desert-safari",
  "doha-city-tours",
  "airport-hotel-transfers",
  "resort-stays",
  "celebrations-events",
  "horse-riding",
  "gcc-travel",
  "tent-desert-camp",
] as const;

export const guestBookingSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters"),
    customerEmail: z
      .string()
      .trim()
      .email("Please provide a valid email address")
      .max(150, "Email must not exceed 150 characters"),
    customerPhone: z
      .string()
      .trim()
      .min(8, "Phone number is too short")
      .max(25, "Phone number is too long")
      .regex(/^[\d\s+\-().]+$/, "Invalid characters in phone number"),
    serviceId: z
      .string()
      .trim()
      .min(2, "Please select a valid Qatar tourism service")
      .max(64, "Service ID exceeds maximum length")
      .regex(/^[a-z0-9-]+$/, "Invalid service identifier format"),
    departureDate: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true;
        const parsed = new Date(val);
        if (isNaN(parsed.getTime())) return false;
        // Allow today or future dates (with 24h grace window for timezone variance)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return parsed >= yesterday;
      }, "Departure date must not be in the past"),
    timeWindow: z.string().trim().max(100).optional(),
    adults: z
      .number()
      .int("Adult count must be a whole number")
      .min(1, "At least 1 adult passenger is required")
      .max(50, "For parties larger than 50, please contact our VIP delegation desk")
      .optional(),
    children: z
      .number()
      .int("Children count must be a whole number")
      .min(0, "Children count cannot be negative")
      .max(30, "Children count must not exceed 30")
      .optional(),
    paxCount: z
      .number()
      .int("Passenger count must be a whole number")
      .min(1, "Passenger count must be at least 1")
      .max(50, "For parties larger than 50, please contact our VIP desk")
      .optional(),
    pickupLocation: z
      .string()
      .trim()
      .max(200, "Pickup location must not exceed 200 characters")
      .optional(),
    preferredLocale: z.enum(["en", "ar"]).optional().default("en"),
    notes: z
      .string()
      .trim()
      .max(1500, "Notes must not exceed 1500 characters")
      .optional(),
    honeypot: z.string().max(0, "Automated submission rejected").optional(),
    idempotencyKey: z.string().trim().max(64).optional(),
  })
  .transform((data) => {
    const adults = data.adults ?? (data.paxCount ? Math.max(1, data.paxCount) : 1);
    const children = data.children ?? 0;
    const computedPax = data.paxCount ?? (adults + children);
    return {
      ...data,
      adults,
      children,
      paxCount: Math.min(50, Math.max(1, computedPax)),
    };
  });

export type GuestBookingInput = z.input<typeof guestBookingSchema>;
export type GuestBookingOutput = z.output<typeof guestBookingSchema>;

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export const customTripSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .max(150, "Email must not exceed 150 characters"),
  phone: z
    .string()
    .trim()
    .min(8, "Phone number is too short")
    .max(25, "Phone number is too long")
    .regex(/^[\d\s+\-().]+$/, "Invalid characters in phone number"),
  destinations: z
    .array(z.string().trim().min(1).max(100))
    .min(1, "Select at least one destination"),
  experiences: z
    .array(z.string().trim().min(1).max(100))
    .min(1, "Select at least one experience"),
  adults: z
    .number()
    .int("Adults must be a whole number")
    .min(1, "At least 1 adult is required")
    .max(50, "Exceeds 50 adults")
    .optional(),
  children: z
    .number()
    .int("Children must be a whole number")
    .min(0, "Children cannot be negative")
    .max(30, "Exceeds 30 children")
    .optional(),
  partySize: z.string().trim().max(100).optional(),
  timeframe: z.string().trim().max(100).optional(),
  budget: z.string().trim().max(100).optional(),
  accommodationPreference: z.string().trim().max(100).optional(),
  transportPreference: z.string().trim().max(100).optional(),
  notes: z
    .string()
    .trim()
    .max(2000, "Special requests must not exceed 2000 characters")
    .optional(),
  preferredLocale: z.enum(["en", "ar"]).optional().default("en"),
  honeypot: z.string().max(0, "Automated submission rejected").optional(),
});

export type CustomTripInput = z.infer<typeof customTripSchema>;

// Permitted status transitions for bookings to enforce valid lifecycle progressions
export const VALID_BOOKING_STATUS_TRANSITIONS: Record<string, string[]> = {
  awaiting_deposit: ["awaiting_deposit", "deposit_under_review", "confirmed", "cancelled"],
  deposit_under_review: ["deposit_under_review", "confirmed", "awaiting_deposit", "cancelled"],
  confirmed: ["confirmed", "completed", "cancelled"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

// Permitted status transitions for custom trip inquiries
export const VALID_CUSTOM_TRIP_STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ["new", "under_review", "contacted", "lost", "quoted", "converted", "archived"],
  under_review: ["under_review", "contacted", "itinerary_in_progress", "lost"],
  contacted: ["contacted", "under_review", "itinerary_in_progress", "proposal_sent", "quoted", "converted", "archived", "lost"],
  itinerary_in_progress: ["itinerary_in_progress", "proposal_sent", "under_review", "lost"],
  proposal_sent: ["proposal_sent", "revision_requested", "accepted", "lost"],
  revision_requested: ["revision_requested", "itinerary_in_progress", "proposal_sent", "lost"],
  accepted: ["accepted", "converted", "lost"],
  converted: ["converted", "archived"],
  lost: ["lost", "new"],
  quoted: ["quoted", "proposal_sent", "converted", "archived", "lost"],
  archived: ["archived", "new"],
};

// =============================================================================
// PHASE 4 & PHASE 8: MANUAL DEPOSIT CONFIRMATION & PAYMENT LEDGER VALIDATIONS
// =============================================================================

export const MANUAL_PAYMENT_METHODS = [
  "bank_transfer",
  "cash_office",
  "other",
] as const;

export type ManualPaymentMethod = (typeof MANUAL_PAYMENT_METHODS)[number];

export const PAYMENT_METHODS = [
  "bank_transfer",
  "credit_card",
  "cash_office",
  "cash",
  "pos_terminal",
  "cheque",
  "other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const qatarPaymentSettingsSchema = z.object({
  accountHolderName: z.string().trim().max(200).optional().nullable(),
  bankName: z.string().trim().max(100).optional().nullable(),
  iban: z.string().trim().max(40).optional().nullable().or(z.literal("")),
  accountNumber: z.string().trim().max(50).optional().nullable(),
  swiftBic: z.string().trim().max(20).optional().nullable(),
  transferReferenceInstructionsEn: z.string().trim().max(600).optional(),
  transferReferenceInstructionsAr: z.string().trim().max(600).optional(),
  depositPercentage: z.number().min(10).max(100).default(30),
  paymentTypeDue: z.enum(["deposit", "full"]).default("deposit"),
  bankTransferEnabled: z.boolean().default(true),
  cardPaymentEnabled: z.boolean().default(false),
  officePaymentEnabled: z.boolean().default(true),
});

export type QatarPaymentSettingsInput = z.infer<typeof qatarPaymentSettingsSchema>;

export const submitManualDepositProofSchema = z
  .object({
    uploadToken: z.string().uuid("Invalid booking tracking token"),
    paymentMethod: z.enum(MANUAL_PAYMENT_METHODS).default("bank_transfer"),
    customPaymentMethod: z.string().trim().max(150).optional().or(z.literal("")),
    amountPaid: z.number().positive("Amount paid must be greater than zero"),
    transactionReference: z.string().trim().max(100).optional().or(z.literal("")),
    paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional().or(z.literal("")),
    customerNotes: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.paymentMethod === "other") {
        return Boolean(data.customPaymentMethod && data.customPaymentMethod.trim().length > 0);
      }
      return true;
    },
    {
      message: "Please describe your custom payment method.",
      path: ["customPaymentMethod"],
    }
  );

export type SubmitManualDepositProofInput = z.infer<typeof submitManualDepositProofSchema>;

export const confirmDepositSchema = z.object({
  bookingId: z.string().uuid("Invalid booking identifier"),
  proofId: z.string().uuid("Invalid proof identifier"),
  confirmedAmount: z.number().positive("Confirmed deposit amount must be greater than zero"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ConfirmDepositInput = z.infer<typeof confirmDepositSchema>;

export const rejectDepositProofSchema = z.object({
  bookingId: z.string().uuid("Invalid booking identifier"),
  proofId: z.string().uuid("Invalid proof identifier"),
  rejectionReason: z
    .string()
    .trim()
    .min(3, "Rejection reason must be at least 3 characters")
    .max(500, "Rejection reason must not exceed 500 characters"),
});

export type RejectDepositProofInput = z.infer<typeof rejectDepositProofSchema>;

export const recordBalancePaymentSchema = z.object({
  bookingId: z.string().uuid("Invalid booking identifier"),
  amount: z
    .number()
    .positive("Payment amount must be greater than zero")
    .max(1000000, "Amount exceeds permissible limit"),
  currency: z.literal("QAR").default("QAR"),
  paymentMethod: z.enum(PAYMENT_METHODS).default("bank_transfer"),
  transactionReference: z
    .string()
    .trim()
    .max(100, "Reference must not exceed 100 characters")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must not exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type RecordBalancePaymentInput = z.infer<typeof recordBalancePaymentSchema>;

export const cancelBookingSchema = z.object({
  bookingId: z.string().uuid("Invalid booking identifier"),
  reason: z
    .string()
    .trim()
    .min(3, "Cancellation reason must be at least 3 characters")
    .max(1000, "Cancellation reason must not exceed 1000 characters"),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

export const completeBookingSchema = z.object({
  bookingId: z.string().uuid("Invalid booking identifier"),
  notes: z
    .string()
    .trim()
    .max(1000, "Completion notes must not exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type CompleteBookingInput = z.infer<typeof completeBookingSchema>;

export const adminBookingFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: z.string().trim().optional().default("all"),
  paymentStatus: z.string().trim().optional().default("all"),
  serviceId: z.string().trim().optional().default("all"),
  departureDate: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  sortBy: z
    .enum(["newest", "oldest", "departure_asc", "departure_desc", "amount_desc", "amount_asc"])
    .default("newest"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(200).default(50),
});

export type AdminBookingFilterInput = z.infer<typeof adminBookingFilterSchema>;

// =============================================================================
// PHASE 5: CUSTOM TOUR REQUEST CRM, ITINERARY BUILDER & PROPOSALS
// =============================================================================

export const CUSTOM_TRIP_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type CustomTripPriority = (typeof CUSTOM_TRIP_PRIORITIES)[number];

export const PROPOSAL_STATUSES = [
  "draft",
  "published",
  "revision_requested",
  "accepted",
  "declined",
  "converted",
  "superseded",
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const assignCustomTripSchema = z.object({
  inquiryId: z.string().uuid("Invalid inquiry identifier"),
  assignedToId: z.string().uuid("Invalid staff identifier").nullable().optional(),
  followUpDate: z.string().trim().optional().nullable(),
  priority: z.enum(CUSTOM_TRIP_PRIORITIES).default("normal"),
});

export type AssignCustomTripInput = z.infer<typeof assignCustomTripSchema>;

export const updateCustomTripCrmSchema = z.object({
  inquiryId: z.string().uuid("Invalid inquiry identifier"),
  status: z.string().trim().optional(),
  priority: z.enum(CUSTOM_TRIP_PRIORITIES).optional(),
  followUpDate: z.string().trim().optional().nullable(),
  adminNotes: z.string().max(4000, "Notes exceed 4000 characters").optional().nullable(),
  lostReason: z.string().max(1000, "Lost reason exceeds 1000 characters").optional().nullable(),
});

export type UpdateCustomTripCrmInput = z.infer<typeof updateCustomTripCrmSchema>;

export const addCustomTripMessageSchema = z.object({
  inquiryId: z.string().uuid("Invalid inquiry identifier"),
  message: z.string().trim().min(1, "Message cannot be empty").max(4000, "Message exceeds 4000 characters"),
  channel: z.enum(["portal", "email", "whatsapp", "internal_note"]).default("portal"),
  isInternal: z.boolean().default(false),
});

export type AddCustomTripMessageInput = z.infer<typeof addCustomTripMessageSchema>;

export const itineraryActivitySchema = z.object({
  titleEn: z.string().trim().min(2, "Activity title (EN) is required").max(200),
  titleAr: z.string().trim().min(2, "Activity title (AR) is required").max(200),
  startTime: z.string().trim().optional(),
  endTime: z.string().trim().optional(),
  location: z.string().trim().min(2, "Location is required").max(200),
  transport: z.string().trim().max(200).optional(),
  hotel: z.string().trim().max(200).optional(),
  meals: z.string().trim().max(200).optional(),
  isOptional: z.boolean().default(false),
  notesCustomer: z.string().trim().max(1000).optional(),
  notesInternal: z.string().trim().max(1000).optional(),
});

export type ItineraryActivityInput = z.infer<typeof itineraryActivitySchema>;

export const itineraryDaySchema = z.object({
  dayNumber: z.number().int().min(1, "Day number must be at least 1").max(60),
  titleEn: z.string().trim().min(2, "Day title (EN) is required").max(200),
  titleAr: z.string().trim().min(2, "Day title (AR) is required").max(200),
  descriptionEn: z.string().trim().max(2000).optional(),
  descriptionAr: z.string().trim().max(2000).optional(),
  date: z.string().trim().optional(),
  activities: z.array(itineraryActivitySchema).default([]),
});

export type ItineraryDayInput = z.infer<typeof itineraryDaySchema>;

export const quotationPricingSchema = z.object({
  pricingModel: z.enum(["per_person", "fixed_group"]).default("per_person"),
  adultRate: z.number().min(0, "Adult rate cannot be negative").default(0),
  childRate: z.number().min(0, "Child rate cannot be negative").default(0),
  accommodationCost: z.number().min(0, "Accommodation cost cannot be negative").default(0),
  transportCost: z.number().min(0, "Transport cost cannot be negative").default(0),
  activityCost: z.number().min(0, "Activity cost cannot be negative").default(0),
  optionalExtrasCost: z.number().min(0, "Extras cost cannot be negative").default(0),
  discountAmount: z.number().min(0, "Discount cannot be negative").default(0),
  taxAmount: z.number().min(0, "Tax cannot be negative").default(0),
  depositType: z.enum(["percentage", "fixed"]).default("percentage"),
  depositValue: z.number().min(0, "Deposit value cannot be negative").default(30),
});

export type QuotationPricingInput = z.infer<typeof quotationPricingSchema>;

export function calculateQuotationTotals(
  pricing: QuotationPricingInput,
  adults: number = 2,
  children: number = 0
) {
  const safeAdults = Math.max(1, adults);
  const safeChildren = Math.max(0, children);

  const basePaxCost =
    pricing.pricingModel === "per_person"
      ? pricing.adultRate * safeAdults + pricing.childRate * safeChildren
      : pricing.adultRate;

  const subtotal =
    basePaxCost +
    pricing.accommodationCost +
    pricing.transportCost +
    pricing.activityCost +
    pricing.optionalExtrasCost;

  const discount = Math.min(subtotal, pricing.discountAmount);
  const tax = Math.max(0, pricing.taxAmount);
  const totalPrice = Math.max(0, Math.round((subtotal - discount + tax) * 100) / 100);

  let depositRequired = 0;
  if (pricing.depositType === "percentage") {
    const pct = Math.min(100, Math.max(0, pricing.depositValue));
    depositRequired = Math.round(((totalPrice * pct) / 100) * 100) / 100;
  } else {
    depositRequired = Math.min(totalPrice, Math.max(0, pricing.depositValue));
  }

  const balanceDue = Math.max(0, Math.round((totalPrice - depositRequired) * 100) / 100);

  return {
    basePaxCost,
    subtotal,
    discount,
    tax,
    totalPrice,
    depositRequired,
    balanceDue,
    currency: "QAR" as const,
  };
}

export const saveCustomProposalSchema = z.object({
  inquiryId: z.string().uuid("Invalid inquiry identifier"),
  proposalId: z.string().uuid("Invalid proposal identifier").optional(),
  titleEn: z.string().trim().min(3, "Proposal title (EN) must be at least 3 characters").max(200),
  titleAr: z.string().trim().min(3, "Proposal title (AR) must be at least 3 characters").max(200),
  summaryEn: z.string().trim().max(2000).optional(),
  summaryAr: z.string().trim().max(2000).optional(),
  validUntil: z.string().trim().min(8, "Validity date is required"),
  currency: z.literal("QAR").default("QAR"),
  pricing: quotationPricingSchema,
  itineraryDays: z.array(itineraryDaySchema).min(1, "At least 1 itinerary day is required"),
  inclusionsEn: z.array(z.string().trim()).default([]),
  inclusionsAr: z.array(z.string().trim()).default([]),
  exclusionsEn: z.array(z.string().trim()).default([]),
  exclusionsAr: z.array(z.string().trim()).default([]),
  termsEn: z.string().trim().max(4000).optional(),
  termsAr: z.string().trim().max(4000).optional(),
  customerNotes: z.string().trim().max(2000).optional(),
  internalNotes: z.string().trim().max(2000).optional(),
  publish: z.boolean().default(false),
});

export type SaveCustomProposalInput = z.infer<typeof saveCustomProposalSchema>;

export const customerProposalFeedbackSchema = z.object({
  token: z.string().uuid("Invalid proposal token"),
  feedback: z.string().trim().min(3, "Feedback must be at least 3 characters").max(2000),
});

export type CustomerProposalFeedbackInput = z.infer<typeof customerProposalFeedbackSchema>;

export const convertProposalSchema = z.object({
  proposalId: z.string().uuid("Invalid proposal identifier"),
  pickupLocation: z.string().trim().max(200).optional(),
  specialRequests: z.string().trim().max(2000).optional(),
});

export type ConvertProposalInput = z.infer<typeof convertProposalSchema>;

export const adminCustomTripFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: z.string().trim().optional().default("all"),
  priority: z.string().trim().optional().default("all"),
  assignedTo: z.string().trim().optional().default("all"),
  destination: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  sortBy: z.enum(["newest", "oldest", "priority_desc", "follow_up"]).default("newest"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(200).default(50),
});

export type AdminCustomTripFilterInput = z.infer<typeof adminCustomTripFilterSchema>;
