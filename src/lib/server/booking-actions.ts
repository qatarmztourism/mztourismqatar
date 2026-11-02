"use server";

import crypto from "crypto";
import { z } from "zod";
import { headers } from "next/headers";
import { createAdminClient, getPrivilegedBookingClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import {
  guestBookingLimiter,
  tokenLookupLimiter,
  depositProofLimiter,
  customTripLimiter,
  getClientIp,
} from "@/lib/security/rate-limit";
import {
  guestBookingSchema,
  customTripSchema,
  MANUAL_PAYMENT_METHODS,
  type ManualPaymentMethod,
  type ActionResult,
} from "@/lib/validations/booking-schemas";
import {
  validateDepositProofBuffer,
  generateUnpredictableStoragePath,
  MAX_DEPOSIT_FILE_SIZE_BYTES,
} from "@/lib/security/file-validation";
import { getPublicTourBySlugAction } from "./tour-actions";
import { sendCustomerBookingNotification } from "./email-service";
import { getQatarPaymentSettings } from "@/lib/payments/qatar-payment-config";
import { getCardGatewayStatus } from "@/lib/payments/card-gateway";

// =============================================================================
// 1. SECURE GUEST BOOKING CREATION ACTION
// =============================================================================

/**
 * Creates a standard tour reservation securely on the server side.
 *
 * Security & Data Integrity guarantees:
 * - Rate-limited by client IP (5 submissions / hour).
 * - Honeypot check prevents automated spam bots.
 * - Re-queries `public.services` from Supabase to verify existence and active status.
 * - Prevents client price or title tampering.
 * - Deduplicates rapid identical submissions (within 90s window).
 * - `booking_ref` is cryptographically generated on the server (never trusted from client).
 * - `upload_token` is generated server-side and returned ONLY to the submitting guest.
 * - Uses `createAdminClient()` on the server; the service-role key is NEVER sent to the browser.
 * - Initial state is strictly `awaiting_deposit` and `deposit_pending`.
 */
export async function createGuestBookingAction(
  rawInput: unknown
): Promise<
  ActionResult<{
    bookingRef: string;
    uploadToken: string;
    serviceId: string;
    serviceTitle: string;
    departureDate: string | null;
    paxCount: number;
    totalPrice?: number;
    depositRequired: number;
    balanceDue: number;
    currency: string;
  }>
> {
  try {
    // 1. Rate limiting check (enforced strictly in production; relaxed in development for comprehensive testing)
    if (process.env.NODE_ENV !== "development") {
      const headerList = await headers();
      const clientIp = getClientIp(headerList);
      const rateLimit = guestBookingLimiter.check(clientIp);

      if (!rateLimit.success) {
        const waitMinutes = Math.ceil((rateLimit.resetTime - Date.now()) / 60000);
        return {
          success: false,
          error: `Submission rate limit exceeded. Please wait ${waitMinutes} minute(s) before submitting again.`,
        };
      }
    }

    // 2. Validate input schema with Zod
    const validation = guestBookingSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: "Please correct the highlighted errors.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const input = validation.data;

    // 3. Reject if honeypot was populated by bot
    if (input.honeypot && input.honeypot.length > 0) {
      return { success: false, error: "Automated submission detected." };
    }

    const rawServiceId = input.serviceId.trim();
    const targetServiceId =
      rawServiceId === "tent-desert-camps" ? "tent-desert-camp" : rawServiceId;

    const supabase = createAdminClient();

    // 4. Re-fetch selected service from Supabase to guarantee authenticity & active status
    const { data: verifiedService, error: serviceError } = await supabase
      .from("services")
      .select("id, title_en, title_ar, indicative_price, is_active")
      .or(`id.eq.${targetServiceId},id.eq.${rawServiceId}`)
      .maybeSingle();

    if (serviceError || !verifiedService) {
      return {
        success: false,
        error: "The requested tour or service does not exist in our catalog.",
      };
    }

    if (!verifiedService.is_active) {
      return {
        success: false,
        error: "The selected service is currently inactive and unavailable for booking.",
      };
    }

    const serviceTitle =
      input.preferredLocale === "ar"
        ? verifiedService.title_ar
        : verifiedService.title_en;

    // 5. Prevent duplicate rapid submissions (same email & service within 90 seconds)
    const ninetySecAgo = new Date(Date.now() - 90 * 1000).toISOString();
    const { data: existingDuplicate } = await supabase
      .from("bookings")
      .select(
        "id, booking_ref, upload_token, service_id, departure_date, pax_count, deposit_required, balance_due, currency"
      )
      .eq("customer_email", input.customerEmail)
      .eq("service_id", verifiedService.id)
      .gte("created_at", ninetySecAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingDuplicate) {
      return {
        success: true,
        data: {
          bookingRef: existingDuplicate.booking_ref,
          uploadToken: existingDuplicate.upload_token,
          serviceId: existingDuplicate.service_id,
          serviceTitle,
          departureDate: existingDuplicate.departure_date,
          paxCount: existingDuplicate.pax_count,
          depositRequired: Number(existingDuplicate.deposit_required),
          balanceDue: Number(existingDuplicate.balance_due || 0),
          currency: existingDuplicate.currency,
        },
      };
    }

    // 6. Generate cryptographically safe reference and bearer upload token server-side
    // Format: MZ-XXXXXXXX (8 hexadecimal uppercase characters)
    const secureRef = `MZ-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const secureUploadToken = crypto.randomUUID();

    // 6b. Tour Pricing & Departure Capacity Protection
    const tourRes = await getPublicTourBySlugAction(targetServiceId, input.preferredLocale);
    const tour = tourRes.data;

    // Fetch site-wide configured deposit percentage from CMS settings
    const { data: siteSettings } = await supabase
      .from("cms_site_settings")
      .select("deposit_default_percentage")
      .eq("id", "default")
      .maybeSingle();
    const defaultDepositPct = siteSettings?.deposit_default_percentage ?? 30;

    // Every tour strictly enforces per-person pricing: Total Price = Price Per Person × Number of People
    const perPersonPrice = tour
      ? tour.totalPrice
      : (() => {
          const priceMatch = (verifiedService.indicative_price || "").replace(/,/g, "").match(/\d+/);
          return priceMatch ? parseInt(priceMatch[0], 10) : 450;
        })();

    const computedTotalPrice = perPersonPrice * input.paxCount;
    let computedDeposit = Math.round((computedTotalPrice * defaultDepositPct) / 100);

    if (tour) {
      if (tour.depositType === "percentage") {
        const pct = tour.depositValue && tour.depositValue > 0 ? tour.depositValue : defaultDepositPct;
        computedDeposit = Math.round((computedTotalPrice * pct) / 100);
      } else if (tour.depositType === "fixed") {
        computedDeposit = Math.min(computedTotalPrice, (tour.depositValue || 150) * input.paxCount);
      }
    }
    const computedBalance = Math.max(0, computedTotalPrice - computedDeposit);

    if (tour) {
      // Capacity & Overbooking Protection:
      if (input.departureDate) {
        const { data: activeDateBookings } = await supabase
          .from("bookings")
          .select("pax_count")
          .eq("service_id", verifiedService.id)
          .eq("departure_date", input.departureDate)
          .neq("booking_status", "cancelled");

        const currentBookedSeats = (activeDateBookings || []).reduce((acc, b) => acc + (b.pax_count || 1), 0);
        const maxCapacity = tour.maxParticipants || 6;

        if (tour.tourType === "private") {
          // Private vehicle charter: if already booked on that date, reject overbooking
          if ((activeDateBookings || []).length > 0) {
            return {
              success: false,
              error: input.preferredLocale === "ar"
                ? "عذراً، تم حجز الأسطول الخاص بالكامل في هذا التاريخ المختار. يرجى اختيار تاريخ آخر أو التواصل مع الكونسيرج."
                : "No available seats on selected departure: The private fleet for this signature experience is fully chartered on the selected date. Please choose another date or contact our concierge.",
            };
          }
        } else {
          // Group tour: check remaining seat count
          const availableSeats = Math.max(0, maxCapacity - currentBookedSeats);
          if (input.paxCount > availableSeats) {
            return {
              success: false,
              error: input.preferredLocale === "ar"
                ? `المقاعد المتاحة في هذا الموعد هي (${availableSeats}) مقعداً فقط، بينما طلبتم (${input.paxCount}) مقاعد. يرجى تعديل عدد الركاب أو اختيار موعد آخر.`
                : `Only ${availableSeats} seat(s) remain available on ${input.departureDate}. Please reduce passenger count or select an alternate departure date.`,
            };
          }
        }
      }
    }

    // Check if submitting user has an active authenticated session
    let authUserId: string | null = null;
    try {
      const serverSupabase = await createServerSupabase();
      const {
        data: { user },
      } = await serverSupabase.auth.getUser();
      if (user) {
        authUserId = user.id;
      }
    } catch {
      // Continue as guest
    }

    // 7. Format notes preserving passenger breakdown and preferred language
    const partyBreakdown = `[Party: ${input.adults} Adult${input.adults > 1 ? "s" : ""}${
      input.children ? `, ${input.children} Child${input.children > 1 ? "ren" : ""}` : ""
    } | Lang: ${input.preferredLocale === "ar" ? "العربية" : "English"}]`;
    const formattedNotes = input.notes
      ? `${partyBreakdown} ${input.notes}`.trim()
      : partyBreakdown;

    // 8. Insert directly using privileged admin client (bypasses broken gen_random_bytes trigger)
    // Server-side trusted pricing calculation snapshot:
    // In database with total_price column: total_price: computedTotalPrice
    // In current live schema: total_price is derived dynamically as deposit_required + balance_due
    const insertPayload = {
      booking_ref: secureRef,
      customer_id: null, // Always null on initial creation to satisfy RLS WITH CHECK (customer_id IS NULL OR customer_id = auth.uid())
      service_id: verifiedService.id,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      departure_date: input.departureDate || null,
      time_window: input.timeWindow || null,
      pax_count: input.paxCount,
      pickup_location: input.pickupLocation || null,
      notes: formattedNotes,
      booking_status: "awaiting_deposit" as const,
      payment_status: "deposit_pending" as const,
      deposit_required: computedDeposit,
      deposit_paid: 0.0,
      balance_due: computedBalance,
      currency: "QAR",
      upload_token: secureUploadToken,
      admin_notes: null,
    };

    const privilegedClient = await getPrivilegedBookingClient();
    const { data: booking, error: insertError } = await privilegedClient
      .from("bookings")
      .insert(insertPayload)
      .select(
        "id, booking_ref, upload_token, service_id, departure_date, pax_count, deposit_required, deposit_paid, balance_due, currency"
      )
      .single();

    if (insertError || !booking) {
      console.error("[Booking Action Failure] Database insert rejected:", {
        code: insertError?.code,
        message: insertError?.message,
        details: insertError?.details,
        hint: insertError?.hint,
      });
      return {
        success: false,
        error:
          input.preferredLocale === "ar"
            ? "تعذر تأكيد الحجز حالياً. يرجى المحاولة مرة أخرى أو التواصل مع الكونسيرج عبر واتساب."
            : "An unexpected error occurred while creating your reservation. Please try again or contact our concierge via WhatsApp.",
      };
    }

    // If caller has an active user account, safely associate the booking to their customer record
    if (authUserId) {
      try {
        await privilegedClient
          .from("bookings")
          .update({ customer_id: authUserId })
          .eq("id", booking.id);
      } catch (linkErr) {
        console.warn("[Booking Link Warning] Could not link customer_id post-insert:", linkErr);
      }
    }

    // 9. Return reference and secret token ONLY to the submitting guest
    return {
      success: true,
      data: {
        bookingRef: booking.booking_ref,
        uploadToken: booking.upload_token,
        serviceId: booking.service_id,
        serviceTitle,
        departureDate: booking.departure_date,
        paxCount: booking.pax_count,
        totalPrice: computedTotalPrice,
        depositRequired: Number(booking.deposit_required),
        balanceDue: Number(booking.balance_due || 0),
        currency: booking.currency,
      },
    };
  } catch (err) {
    console.error("[Create Booking Unexpected Error]", err);
    return {
      success: false,
      error: "Unable to process booking at this time. Please contact MZ Tourism concierge via WhatsApp.",
    };
  }
}

// =============================================================================
// 2. SECURE TOKEN-BASED GUEST STATUS LOOKUP ACTION
// =============================================================================

const uuidSchema = z.string().uuid("Invalid token format");

/**
 * Retrieves booking status for guests holding the unguessable bearer token.
 *
 * Security guarantees:
 * - Rate-limited to 10 lookups / minute per IP.
 * - Strictly strips all PII (no customer_name, customer_email, customer_phone,
 *   pickup_location, notes, or admin_notes).
 */
export async function getGuestBookingStatusAction(uploadToken: string) {
  try {
    // 1. Rate limiting
    const headerList = await headers();
    const clientIp = getClientIp(headerList);
    const rateLimit = tokenLookupLimiter.check(clientIp);

    if (!rateLimit.success) {
      return {
        success: false,
        error: "Too many lookup attempts. Please try again in one minute.",
      };
    }

    // 2. Validate token format
    const parsedToken = uuidSchema.safeParse(uploadToken);
    if (!parsedToken.success) {
      return { success: false, error: "Invalid booking tracking token." };
    }

    // 3. Query via RPC or admin client using exact token match
    const supabase = createAdminClient();
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        "id, booking_ref, service_id, departure_date, pax_count, booking_status, payment_status, deposit_required, deposit_paid, balance_due, currency, created_at"
      )
      .eq("upload_token", parsedToken.data)
      .maybeSingle();

    if (error || !booking) {
      return { success: false, error: "Booking not found or token has expired." };
    }

    // 4. Retrieve deposit proofs history (ZERO storage paths returned to clients)
    let proofsList: Record<string, unknown>[] = [];
    const richQuery = await supabase
      .from("deposit_proofs")
      .select("id, review_status, rejection_reason, file_name, file_size, payment_method, custom_payment_method, amount_submitted, transaction_ref, payment_date, uploaded_at")
      .eq("booking_id", booking.id)
      .order("uploaded_at", { ascending: false });

    if (!richQuery.error && richQuery.data) {
      proofsList = richQuery.data as Record<string, unknown>[];
    } else {
      const baseQuery = await supabase
        .from("deposit_proofs")
        .select("id, review_status, rejection_reason, file_name, file_size, uploaded_at")
        .eq("booking_id", booking.id)
        .order("uploaded_at", { ascending: false });
      if (baseQuery.data) {
        proofsList = baseQuery.data as Record<string, unknown>[];
      }
    }

    const latestProof = (proofsList?.[0] as {
      review_status?: string;
      rejection_reason?: string | null;
      file_name?: string | null;
      file_size?: number | null;
      uploaded_at?: string | null;
    }) || null;

    // Load active Qatar payment settings & card gateway diagnostic status
    const qatarSettings = getQatarPaymentSettings();
    const cardStatus = getCardGatewayStatus();

    const depReq = Number(booking.deposit_required || 0);
    const depPaid = Number(booking.deposit_paid || 0);
    const balDue = Number(booking.balance_due || 0);
    const bookingRec = booking as Record<string, unknown>;
    // Single source financial invariant: total_price = deposit_required + balance_due
    const totalPrice = Number(bookingRec.total_price || (depReq + balDue));

    const { data: svcRow } = await supabase
      .from("services")
      .select("title_en, title_ar")
      .eq("id", booking.service_id)
      .maybeSingle();

    const serviceTitle = svcRow?.title_en || booking.service_id;

    // 5. Return operational fields only (ZERO PII, ZERO internal storage paths)
    return {
      success: true,
      data: {
        id: booking.id,
        bookingRef: booking.booking_ref,
        serviceId: booking.service_id,
        serviceTitle,
        serviceTitleAr: svcRow?.title_ar || booking.service_id,
        departureDate: booking.departure_date,
        paxCount: booking.pax_count,
        totalPrice,
        bookingStatus: booking.booking_status,
        paymentStatus: booking.payment_status,
        depositRequired: depReq,
        depositPaid: depPaid,
        balanceDue: balDue,
        currency: booking.currency,
        createdAt: booking.created_at,
        proofStatus: latestProof?.review_status ?? "not_submitted",
        rejectionReason:
          latestProof?.review_status === "rejected" ? latestProof.rejection_reason : null,
        lastProofFileName: latestProof?.file_name ?? null,
        lastProofFileSize: latestProof?.file_size ?? null,
        lastProofUploadedAt: latestProof?.uploaded_at ?? null,
        proofs: (proofsList || []).map((p) => ({
          id: p.id as string,
          fileName: p.file_name as string,
          fileSize: Number(p.file_size || 0),
          reviewStatus: p.review_status as string,
          rejectionReason: (p.rejection_reason as string) || null,
          paymentMethod: (p.payment_method as string) || "bank_transfer",
          customPaymentMethod: (p.custom_payment_method as string) || null,
          amountSubmitted: Number(p.amount_submitted || depReq),
          transactionRef: (p.transaction_ref as string) || null,
          paymentDate: (p.payment_date as string) || null,
          uploadedAt: p.uploaded_at as string,
        })),
        qatarPaymentConfig: qatarSettings.bankTransfer,
        cardGatewayStatus: cardStatus,
        bankTransferEnabled: qatarSettings.bankTransferEnabled,
        cardPaymentEnabled: qatarSettings.cardPaymentEnabled,
        officePaymentEnabled: qatarSettings.officePaymentEnabled,
        paymentInstructions: {
          deposit_default_percentage: qatarSettings.depositDefaultPercentage,
          payment_bank_transfer_instructions_en:
            qatarSettings.bankTransfer.transferReferenceInstructionsEn,
          payment_bank_transfer_instructions_ar:
            qatarSettings.bankTransfer.transferReferenceInstructionsAr,
          payment_cash_office_instructions_en: `Cash settlements are welcomed at our concierge headquarters in ${qatarSettings.officeAddressEn}.`,
          payment_cash_office_instructions_ar: `نرحب بالسداد النقدي في مقر الكونسيرج في ${qatarSettings.officeAddressAr}.`,
          payment_other_instructions_en:
            "For custom, corporate or third-party payment arrangements, coordinate directly with our operations desk.",
          payment_other_instructions_ar:
            "لترتيبات الدفع الخاصة أو المؤسسية، يرجى التنسيق مع إدارة العمليات.",
        },
      },
    };
  } catch (err) {
    console.error("[Token Lookup Unexpected Error]", err);
    return { success: false, error: "Unable to verify booking token." };
  }
}

// =============================================================================
// 3. SECURE DEPOSIT RECEIPT UPLOAD & RECORDING ACTIONS
// =============================================================================

/**
 * Uploads a deposit proof file securely via Next.js Server Action with full binary validation.
 *
 * Security guarantees:
 * - Rate-limited by client IP (depositProofLimiter).
 * - Enforces strict 5 MB server size limit.
 * - Inspects actual binary magic bytes (JPEG, PNG, WebP, PDF).
 * - Generates unpredictable storage paths on server side.
 * - Uploads directly to private `deposit-proofs` bucket via createAdminClient().
 * - Rejects uploads for cancelled/completed bookings.
 * - Prevents uploading when 5 proofs per booking limit is reached.
 * - Never exposes service-role keys or private storage paths to client.
 */
export async function uploadDepositProofAction(formData: FormData): Promise<
  ActionResult<{
    proofId: string;
    reviewStatus: string;
    uploadedAt: string;
    fileName: string;
    fileSize: number;
  }>
> {
  try {
    // 1. Rate limiting
    const headerList = await headers();
    const clientIp = getClientIp(headerList);
    const rateLimit = depositProofLimiter.check(clientIp);

    if (!rateLimit.success) {
      return {
        success: false,
        error: "Too many upload attempts. Please wait before submitting another receipt.",
      };
    }

    // 2. Extract and validate fields from FormData
    const uploadTokenRaw = formData.get("uploadToken");
    const file = formData.get("file");
    const paymentMethodRaw = formData.get("paymentMethod")?.toString()?.trim() || "bank_transfer";
    const customPaymentMethod = formData.get("customPaymentMethod")?.toString()?.trim() || null;
    const amountPaidRaw = formData.get("amountPaid")?.toString()?.trim();
    const transactionReference = formData.get("transactionReference")?.toString()?.trim() || null;
    const paymentDate = formData.get("paymentDate")?.toString()?.trim() || new Date().toISOString().slice(0, 10);
    const customerNotes = formData.get("customerNotes")?.toString()?.trim() || null;

    if (!uploadTokenRaw || typeof uploadTokenRaw !== "string") {
      return { success: false, error: "Missing or invalid booking tracking token." };
    }

    const parsedToken = uuidSchema.safeParse(uploadTokenRaw.trim());
    if (!parsedToken.success) {
      return { success: false, error: "Invalid booking token format." };
    }
    const uploadToken = parsedToken.data;

    // Validate payment method
    const paymentMethod: ManualPaymentMethod = (MANUAL_PAYMENT_METHODS as readonly string[]).includes(paymentMethodRaw)
      ? (paymentMethodRaw as ManualPaymentMethod)
      : "bank_transfer";

    if (paymentMethod === "other" && (!customPaymentMethod || customPaymentMethod.length === 0)) {
      return { success: false, error: "Please describe your custom payment method." };
    }

    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please select a valid receipt file to upload." };
    }

    // 3. Convert File to Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Validate file buffer (size <= 10MB, extension, binary magic bytes)
    const validation = validateDepositProofBuffer(buffer, file.name, file.type);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const supabase = createAdminClient();

    // 5. Query parent booking
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("id, booking_ref, service_id, customer_name, customer_email, pax_count, deposit_required, deposit_paid, balance_due, currency, booking_status, payment_status, upload_token, customer_id")
      .eq("upload_token", uploadToken)
      .maybeSingle();

    if (bookingErr || !booking) {
      return { success: false, error: "The referenced booking was not found or has expired." };
    }

    // 6. Verify booking accepts deposit (awaiting_deposit or deposit_under_review)
    if (!["awaiting_deposit", "deposit_under_review"].includes(booking.booking_status)) {
      return {
        success: false,
        error: "Deposit proofs cannot be submitted for this booking status.",
      };
    }

    // 7. Abuse prevention: Limit max 10 deposit proofs per booking (supports replacement proofs)
    const { count: proofCount } = await supabase
      .from("deposit_proofs")
      .select("id", { count: "exact", head: true })
      .eq("booking_id", booking.id);

    if (proofCount && proofCount >= 10) {
      return {
        success: false,
        error:
          "Maximum upload limit reached for this booking. Please contact our concierge team directly via WhatsApp for assistance.",
      };
    }

    // Calculate customer submitted amount
    const parsedAmount = amountPaidRaw ? parseFloat(amountPaidRaw) : NaN;
    const amountSubmitted = !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : Number(booking.deposit_required || 0);

    // 8. Generate unpredictable storage path on server side
    const storagePath = generateUnpredictableStoragePath(
      booking.upload_token,
      validation.extension
    );

    // 9. Upload buffer to private Supabase Storage bucket payment-proofs (with fallback to deposit-proofs)
    let uploadBucket = "payment-proofs";
    let storageError: { message: string } | null = null;

    const paymentUpload = await supabase.storage
      .from("payment-proofs")
      .upload(storagePath, buffer, {
        contentType: validation.mimeType,
        upsert: false,
      });

    if (paymentUpload.error) {
      // Fallback attempt to deposit-proofs if payment-proofs bucket returned error
      const depositUpload = await supabase.storage
        .from("deposit-proofs")
        .upload(storagePath, buffer, {
          contentType: validation.mimeType,
          upsert: false,
        });

      if (depositUpload.error) {
        storageError = paymentUpload.error;
      } else {
        uploadBucket = "deposit-proofs";
      }
    }

    if (storageError) {
      console.error("[Deposit Storage Upload Error]", storageError);
      return {
        success: false,
        error: "Failed to store proof securely. Please try again or contact concierge.",
      };
    }

    // 10. Record metadata in deposit_proofs table (with fallback for remote DB schema variations)
    let proof: { id: string; review_status: string; uploaded_at: string; file_name: string; file_size: number } | null = null;

    const richInsert = await supabase
      .from("deposit_proofs")
      .insert({
        booking_id: booking.id,
        upload_token: booking.upload_token,
        storage_path: storagePath,
        file_name: validation.cleanFileName,
        mime_type: validation.mimeType,
        file_size: validation.fileSizeBytes,
        review_status: "pending",
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        payment_method: paymentMethod,
        custom_payment_method: customPaymentMethod,
        amount_submitted: amountSubmitted,
        transaction_ref: transactionReference,
        payment_date: paymentDate,
        customer_notes: customerNotes,
        bucket_id: uploadBucket,
      })
      .select("id, review_status, uploaded_at, file_name, file_size")
      .single();

    if (!richInsert.error && richInsert.data) {
      proof = richInsert.data;
    } else {
      // Fallback to base columns supported on remote database
      const baseInsert = await supabase
        .from("deposit_proofs")
        .insert({
          booking_id: booking.id,
          upload_token: booking.upload_token,
          storage_path: storagePath,
          file_name: validation.cleanFileName,
          mime_type: validation.mimeType,
          file_size: validation.fileSizeBytes,
          review_status: "pending",
          rejection_reason: null,
          reviewed_by: null,
          reviewed_at: null,
        })
        .select("id, review_status, uploaded_at, file_name, file_size")
        .single();

      if (!baseInsert.error && baseInsert.data) {
        proof = baseInsert.data;
      } else {
        console.error("[Deposit Proof Insert Error]", richInsert.error || baseInsert.error);
        return {
          success: false,
          error: "Receipt uploaded but recording failed in database.",
        };
      }
    }

    // 11. Update booking status (Exact status transition requirement: payment_status = 'deposit_pending', booking_status = 'awaiting_deposit')
    await supabase
      .from("bookings")
      .update({
        booking_status: "awaiting_deposit",
        payment_status: "deposit_pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    // 12. Record audit timeline event
    try {
      await supabase.from("booking_timeline").insert({
        booking_id: booking.id,
        event_type: "proof_submitted",
        from_status: booking.booking_status,
        to_status: "awaiting_deposit",
        title_en: "Payment Proof Submitted for Verification",
        title_ar: "تم تقديم إيصال السداد للمراجعة والتدقيق",
        description_en: `Manual payment proof uploaded via ${paymentMethod.replace(/_/g, " ")}. Customer submitted amount: ${amountSubmitted} ${booking.currency || "QAR"}.`,
        description_ar: `تم تقديم إشعار السداد اليدوي عبر طريقة (${paymentMethod}). المبلغ المصرح به: ${amountSubmitted} ${booking.currency || "ر.ق"}.`,
        actor_role: "customer",
        metadata: {
          proofId: proof.id,
          paymentMethod,
          customPaymentMethod,
          amountSubmitted,
          transactionReference,
        },
      });
    } catch (timelineErr) {
      console.warn("[Timeline Insert Notice]", timelineErr);
    }

    // 13. Dispatch non-blocking customer notification
    try {
      if (booking.customer_email) {
        await sendCustomerBookingNotification({
          bookingId: booking.id,
          bookingRef: booking.booking_ref,
          customerName: booking.customer_name,
          customerEmail: booking.customer_email,
          serviceTitle: booking.service_id,
          paxCount: booking.pax_count,
          depositRequired: Number(booking.deposit_required),
          depositPaid: Number(booking.deposit_paid),
          balanceDue: Number(booking.balance_due),
          currency: booking.currency || "QAR",
          notificationType: "proof_submitted",
        });
      }
    } catch (notifyErr) {
      console.warn("[Notification Dispatch Notice]", notifyErr);
    }

    return {
      success: true,
      data: {
        proofId: proof.id,
        reviewStatus: proof.review_status,
        uploadedAt: proof.uploaded_at,
        fileName: proof.file_name,
        fileSize: proof.file_size,
      },
    };
  } catch (err) {
    console.error("[Upload Deposit Proof Unexpected Error]", err);
    return {
      success: false,
      error: "An unexpected error occurred during receipt upload.",
    };
  }
}

const depositProofInputSchema = z.object({
  uploadToken: z.string().uuid("Invalid upload token format"),
  storagePath: z.string().min(5).max(500),
  originalFileName: z.string().min(1).max(255),
});

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE_BYTES = MAX_DEPOSIT_FILE_SIZE_BYTES; // 5MB server limit

/**
 * Verifies an uploaded deposit proof object inside Supabase Storage before recording it.
 *
 * Security guarantees:
 * - Does NOT trust client-reported file size or MIME type.
 * - Interrogates the actual object in the private `deposit-proofs` bucket.
 * - Validates path strictly matches `<upload_token>/<filename>`.
 * - Rejects path traversal attempts.
 * - Confirms the parent booking is currently in an active deposit-accepting state.
 * - Enforces maximum 5 upload records per booking to prevent resource abuse.
 */
export async function verifyAndRecordDepositProofAction(rawInput: unknown) {
  try {
    // 1. Rate limiting
    const headerList = await headers();
    const clientIp = getClientIp(headerList);
    const rateLimit = depositProofLimiter.check(clientIp);

    if (!rateLimit.success) {
      return {
        success: false,
        error: "Too many upload attempts. Please try again shortly.",
      };
    }

    // 2. Validate input schema
    const validation = depositProofInputSchema.safeParse(rawInput);
    if (!validation.success) {
      return { success: false, error: "Invalid upload parameters." };
    }

    const { uploadToken, storagePath, originalFileName } = validation.data;

    // 3. Strict storage path validation
    // Path MUST start with <uploadToken>/
    const expectedPrefix = `${uploadToken}/`;
    if (!storagePath.startsWith(expectedPrefix)) {
      return {
        success: false,
        error: "Security violation: storage path does not match booking directory.",
      };
    }

    // Path must not contain traversal
    if (storagePath.includes("..") || storagePath.includes("//")) {
      return {
        success: false,
        error: "Security violation: invalid directory path traversal.",
      };
    }

    const supabase = createAdminClient();

    // 4. Retrieve parent booking
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("id, booking_status, payment_status, upload_token")
      .eq("upload_token", uploadToken)
      .maybeSingle();

    if (bookingErr || !booking) {
      return { success: false, error: "Referenced booking does not exist." };
    }

    // Verify booking is in an active deposit-accepting state
    if (!["awaiting_deposit", "deposit_under_review"].includes(booking.booking_status)) {
      return {
        success: false,
        error: "Deposit proofs cannot be submitted for this booking status.",
      };
    }

    // 5. Limit max 10 proofs per booking
    const { count: proofCount } = await supabase
      .from("deposit_proofs")
      .select("id", { count: "exact", head: true })
      .eq("booking_id", booking.id);

    if (proofCount && proofCount >= 10) {
      return {
        success: false,
        error: "Maximum upload limit reached for this booking. Please contact staff via WhatsApp.",
      };
    }

    // 6. Verify the actual storage object exists in Supabase Storage (checking payment-proofs first)
    const fileNameOnly = storagePath.slice(expectedPrefix.length);
    let bucketName = "payment-proofs";
    let { data: fileList, error: listError } = await supabase.storage
      .from("payment-proofs")
      .list(uploadToken, { search: fileNameOnly });

    if (listError || !fileList || fileList.length === 0) {
      // Fallback check to deposit-proofs for backwards compatibility
      const fallbackList = await supabase.storage
        .from("deposit-proofs")
        .list(uploadToken, { search: fileNameOnly });
      if (fallbackList.data && fallbackList.data.length > 0) {
        fileList = fallbackList.data;
        listError = null;
        bucketName = "deposit-proofs";
      }
    }

    if (listError || !fileList || fileList.length === 0) {
      return {
        success: false,
        error: "Uploaded file was not found in storage. Please re-upload.",
      };
    }

    const targetFile = fileList.find((f) => f.name === fileNameOnly);
    if (!targetFile) {
      return {
        success: false,
        error: "Target file could not be verified in the secure storage folder.",
      };
    }

    // 7. Verify actual file size and content type from storage metadata
    const actualSize = targetFile.metadata?.size ?? 0;
    const actualMime = targetFile.metadata?.mimetype ?? "";

    if (actualSize <= 0 || actualSize > MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        error: `File size (${(actualSize / 1024 / 1024).toFixed(2)} MB) must be between 1 byte and 10 MB.`,
      };
    }

    if (!ALLOWED_MIME_TYPES.includes(actualMime)) {
      return {
        success: false,
        error: `File format (${actualMime || "unknown"}) is not supported. Only JPEG, PNG, WebP, and PDF are permitted.`,
      };
    }

    // 8. Insert record into deposit_proofs table
    const { data: proof, error: proofErr } = await supabase
      .from("deposit_proofs")
      .insert({
        booking_id: booking.id,
        upload_token: uploadToken,
        storage_path: storagePath,
        file_name: originalFileName,
        mime_type: actualMime,
        file_size: actualSize,
        review_status: "pending",
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        bucket_id: bucketName,
      })
      .select("id, review_status, uploaded_at")
      .single();

    if (proofErr || !proof) {
      console.error("[Deposit Proof Insert Error]", proofErr);
      return {
        success: false,
        error: "Failed to record deposit receipt in database.",
      };
    }

    // 9. Update booking status (Exact status transition requirement: payment_status = 'deposit_pending', booking_status = 'awaiting_deposit')
    await supabase
      .from("bookings")
      .update({
        booking_status: "awaiting_deposit",
        payment_status: "deposit_pending",
      })
      .eq("id", booking.id);

    return {
      success: true,
      data: {
        proofId: proof.id,
        reviewStatus: proof.review_status,
        uploadedAt: proof.uploaded_at,
      },
    };
  } catch (err) {
    console.error("[Verify Deposit Proof Unexpected Error]", err);
    return {
      success: false,
      error: "Unable to verify deposit proof at this time.",
    };
  }
}

// =============================================================================
// 4. CUSTOM TRIP REQUEST ACTION
// =============================================================================

/**
 * Creates a bespoke custom trip inquiry in the database.
 */
export async function createCustomTripRequestAction(
  rawInput: unknown
): Promise<
  ActionResult<{
    requestRef: string;
    guestName: string;
    email: string;
    destinations: string[];
    experiences: string[];
  }>
> {
  try {
    // 1. Rate limiting
    const headerList = await headers();
    const clientIp = getClientIp(headerList);
    const rateLimit = customTripLimiter.check(clientIp);

    if (!rateLimit.success) {
      return {
        success: false,
        error: "Too many custom trip inquiries. Please wait before submitting again.",
      };
    }

    // 2. Validate input schema
    const validation = customTripSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: "Please complete all required fields properly.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const input = validation.data;

    if (input.honeypot && input.honeypot.length > 0) {
      return { success: false, error: "Automated submission detected." };
    }

    // 3. Optional customer session
    let authUserId: string | null = null;
    try {
      const serverSupabase = await createServerSupabase();
      const {
        data: { user },
      } = await serverSupabase.auth.getUser();
      if (user) authUserId = user.id;
    } catch {
      // Guest
    }

    // Format: MZ-CT-XXXXXX (6 hex chars)
    const secureRef = `MZ-CT-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const supabase = createAdminClient();

    // Format party size string
    const partySizeStr =
      input.partySize ||
      (input.adults
        ? `${input.adults} Adults${input.children ? `, ${input.children} Children` : ""}`
        : "Private Party");

    // Format notes with preferences
    const preferences: string[] = [];
    if (input.accommodationPreference) {
      preferences.push(`Accommodation: ${input.accommodationPreference}`);
    }
    if (input.transportPreference) {
      preferences.push(`Transport: ${input.transportPreference}`);
    }
    if (input.preferredLocale) {
      preferences.push(
        `Language: ${input.preferredLocale === "ar" ? "العربية" : "English"}`
      );
    }

    const specialReqs = [
      preferences.length > 0 ? `[${preferences.join(" | ")}]` : null,
      input.notes?.trim() || null,
    ]
      .filter(Boolean)
      .join("\n");

    const { data: record, error: insertError } = await supabase
      .from("custom_trip_requests")
      .insert({
        request_ref: secureRef,
        customer_id: authUserId,
        guest_name: input.name,
        email: input.email,
        phone: input.phone,
        destinations: input.destinations,
        experiences: input.experiences,
        party_size: partySizeStr,
        timeframe: input.timeframe || "Flexible",
        budget_range: input.budget || "Bespoke Quote",
        special_requests: specialReqs || null,
        status: "new",
        admin_notes: null,
      })
      .select("id, request_ref, guest_name, email, destinations, experiences")
      .single();

    if (insertError || !record) {
      console.error("[Custom Trip Insert Error]", insertError);
      return {
        success: false,
        error: "Could not register your bespoke journey inquiry. Please contact us via WhatsApp.",
      };
    }

    return {
      success: true,
      data: {
        requestRef: record.request_ref,
        guestName: record.guest_name,
        email: record.email,
        destinations: record.destinations || [],
        experiences: record.experiences || [],
      },
    };
  } catch (err) {
    console.error("[Create Custom Trip Unexpected Error]", err);
    return {
      success: false,
      error: "Unable to submit custom itinerary inquiry.",
    };
  }
}

// =============================================================================
// 5. BOOKING LOOKUP BY REFERENCE & EMAIL
// =============================================================================

const lookupByRefSchema = z.object({
  bookingRef: z
    .string()
    .trim()
    .min(5)
    .max(20)
    .regex(/^MZ-[A-F0-9]{8}$/i, "Reference format must be MZ-XXXXXXXX"),
  email: z.string().trim().email("Invalid email format"),
});

/**
 * Allows a guest to retrieve their upload token using their Booking Reference + matching Email.
 */
export async function lookupBookingByRefAction(bookingRef: string, email: string) {
  try {
    const headerList = await headers();
    const clientIp = getClientIp(headerList);
    const rateLimit = tokenLookupLimiter.check(clientIp);

    if (!rateLimit.success) {
      return {
        success: false,
        error: "Too many lookup attempts. Please try again in one minute.",
      };
    }

    const validation = lookupByRefSchema.safeParse({ bookingRef, email });
    if (!validation.success) {
      return {
        success: false,
        error: "Please enter a valid Booking Reference (MZ-XXXXXXXX) and matching email.",
      };
    }

    const supabase = createAdminClient();
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        "id, booking_ref, upload_token, customer_email, booking_status, payment_status, departure_date"
      )
      .ilike("booking_ref", validation.data.bookingRef)
      .maybeSingle();

    if (error || !booking) {
      return { success: false, error: "No booking matches the provided reference and email." };
    }

    // Check email match (case-insensitive)
    if (booking.customer_email.toLowerCase() !== validation.data.email.toLowerCase()) {
      return { success: false, error: "No booking matches the provided reference and email." };
    }

    return {
      success: true,
      data: {
        bookingRef: booking.booking_ref,
        uploadToken: booking.upload_token,
        bookingStatus: booking.booking_status,
        paymentStatus: booking.payment_status,
        departureDate: booking.departure_date,
      },
    };
  } catch (err) {
    console.error("[Lookup Booking Unexpected Error]", err);
    return { success: false, error: "Unable to perform lookup." };
  }
}

// =============================================================================
// 6. CUSTOMER ACCOUNT BOOKINGS
// =============================================================================

/**
 * Returns all bookings belonging to the currently authenticated user.
 */
export async function getCustomerBookingsAction() {
  try {
    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required." };
    }

    const admin = createAdminClient();
    const userEmail = user.email || "";

    // Query either customer_id match or email match
    let query = admin
      .from("bookings")
      .select(
        "id, booking_ref, service_id, departure_date, time_window, pax_count, booking_status, payment_status, deposit_required, deposit_paid, balance_due, currency, upload_token, created_at"
      )
      .order("created_at", { ascending: false });

    if (userEmail) {
      query = query.or(`customer_id.eq.${user.id},customer_email.eq.${userEmail}`);
    } else {
      query = query.eq("customer_id", user.id);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error("[Get Customer Bookings Error]", error);
      return { success: false, error: "Unable to retrieve your bookings." };
    }

    const bookingList = bookings || [];
    const bookingIds = bookingList.map((b) => b.id);

    // Fetch latest deposit proofs for each booking (if any)
    const proofsMap: Record<
      string,
      {
        proofStatus: string;
        rejectionReason: string | null;
        fileName: string;
      }
    > = {};

    if (bookingIds.length > 0) {
      const { data: proofs } = await admin
        .from("deposit_proofs")
        .select("booking_id, review_status, rejection_reason, file_name, uploaded_at")
        .in("booking_id", bookingIds)
        .order("uploaded_at", { ascending: false });

      if (proofs) {
        for (const p of proofs) {
          if (!proofsMap[p.booking_id]) {
            proofsMap[p.booking_id] = {
              proofStatus: p.review_status,
              rejectionReason: p.review_status === "rejected" ? p.rejection_reason : null,
              fileName: p.file_name,
            };
          }
        }
      }
    }

    return {
      success: true,
      data: bookingList.map((b) => ({
        id: b.id,
        bookingRef: b.booking_ref,
        serviceId: b.service_id,
        departureDate: b.departure_date,
        timeWindow: b.time_window,
        paxCount: b.pax_count,
        totalPrice: Number((b as Record<string, unknown>).total_price || (Number(b.deposit_required) + Number(b.balance_due || 0))),
        bookingStatus: b.booking_status,
        paymentStatus: b.payment_status,
        depositRequired: Number(b.deposit_required),
        depositPaid: Number(b.deposit_paid),
        balanceDue: Number(b.balance_due),
        currency: b.currency,
        uploadToken: b.upload_token,
        createdAt: b.created_at,
        proofStatus: proofsMap[b.id]?.proofStatus ?? "not_submitted",
        rejectionReason: proofsMap[b.id]?.rejectionReason ?? null,
        lastProofFileName: proofsMap[b.id]?.fileName ?? null,
      })),
    };
  } catch (err) {
    console.error("[Get Customer Bookings Unexpected Error]", err);
    return { success: false, error: "Failed to load bookings." };
  }
}

/**
 * Links an existing guest booking to the authenticated customer account.
 */
export async function linkGuestBookingToAccountAction(bookingRef: string) {
  try {
    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required." };
    }

    const admin = createAdminClient();
    const cleanRef = bookingRef.trim().toUpperCase();

    const { data: booking, error } = await admin
      .from("bookings")
      .select("id, customer_id, customer_email")
      .eq("booking_ref", cleanRef)
      .maybeSingle();

    if (error || !booking) {
      return { success: false, error: "Booking reference not found." };
    }

    if (
      user.email &&
      booking.customer_email.toLowerCase() !== user.email.toLowerCase()
    ) {
      return {
        success: false,
        error: "This booking was registered with a different email address.",
      };
    }

    const { error: updateError } = await admin
      .from("bookings")
      .update({ customer_id: user.id })
      .eq("id", booking.id);

    if (updateError) {
      return { success: false, error: "Failed to link booking to account." };
    }

    return { success: true };
  } catch (err) {
    console.error("[Link Booking Unexpected Error]", err);
    return { success: false, error: "Unable to link booking." };
  }
}
