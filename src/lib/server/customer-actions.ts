"use server";

import { z } from "zod";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

export interface CustomerCustomTripItem {
  id: string;
  requestRef: string;
  guestName: string;
  email: string;
  phone: string;
  destinations: string[];
  experiences: string[];
  partySize: string;
  timeframe: string;
  budgetRange: string;
  specialRequests: string | null;
  status: Database["public"]["Enums"]["custom_trip_status"];
  proposal?: {
    id: string;
    proposalRef: string;
    guestToken: string;
    status: Database["public"]["Enums"]["proposal_status"];
    titleEn: string;
    titleAr: string;
    totalPrice: number;
    depositRequired: number;
    validUntil: string;
  } | null;
  createdAt: string;
}

export interface CustomerParticipantItem {
  id: string;
  fullName: string;
  passportOrQatarId: string | null;
  specialDietary: string | null;
  isChild: boolean;
}

export interface CustomerDepositProofItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  reviewStatus: Database["public"]["Enums"]["deposit_proof_review_status"];
  rejectionReason: string | null;
  uploadedAt: string;
  signedUrl: string | null;
  paymentMethod?: string;
  customPaymentMethod?: string | null;
  amountSubmitted?: number;
  adminConfirmedAmount?: number | null;
  transactionRef?: string | null;
  paymentDate?: string | null;
}

export interface CustomerPaymentLedgerItem {
  id: string;
  paymentType: "deposit" | "balance" | "full" | "refund";
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionReference: string | null;
  recordedAt: string;
}

async function createCustomerSignedProofUrl(
  admin: ReturnType<typeof createAdminClient>,
  storagePath: string,
  bucketId: string = "deposit-proofs"
): Promise<string | null> {
  try {
    const primaryBucket = bucketId === "payment-proofs" ? "payment-proofs" : "deposit-proofs";
    const fallbackBucket = primaryBucket === "deposit-proofs" ? "payment-proofs" : "deposit-proofs";
    const primaryResult = await admin.storage
      .from(primaryBucket)
      .createSignedUrl(storagePath, 900);

    let signedUrl = primaryResult.data?.signedUrl || null;

    if (!signedUrl) {
      const fallback = await admin.storage
        .from(fallbackBucket)
        .createSignedUrl(storagePath, 900);
      signedUrl = fallback.data?.signedUrl || null;
    }

    return signedUrl;
  } catch (err) {
    console.warn("[Signed URL Helper Error]", err);
    return null;
  }
}

export interface CustomerTimelineItem {
  id: string;
  eventType: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  createdAt: string;
}

export interface CustomerBookingDossier {
  id: string;
  bookingRef: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  departureDate: string | null;
  timeWindow: string | null;
  paxCount: number;
  pickupLocation: string | null;
  notes: string | null;
  bookingStatus: Database["public"]["Enums"]["booking_status"];
  paymentStatus: Database["public"]["Enums"]["payment_status"];
  depositRequired: number;
  depositPaid: number;
  balanceDue: number;
  totalPrice?: number;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  completedAt?: string | null;
  currency: string;
  uploadToken: string;
  createdAt: string;
  updatedAt: string;
  participants: CustomerParticipantItem[];
  proofs: CustomerDepositProofItem[];
  payments?: CustomerPaymentLedgerItem[];
  timeline?: CustomerTimelineItem[];
}

export interface CustomerPaymentTransaction {
  id: string;
  bookingRef: string;
  serviceId: string;
  departureDate: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  reviewStatus: Database["public"]["Enums"]["deposit_proof_review_status"];
  rejectionReason: string | null;
  uploadedAt: string;
  signedUrl: string | null;
  amount: number;
  currency: string;
}

export interface CustomerBookingPaymentItem {
  id: string;
  bookingRef: string;
  serviceId: string;
  departureDate: string | null;
  depositRequired: number;
  depositPaid: number;
  balanceDue: number;
  currency: string;
  bookingStatus: Database["public"]["Enums"]["booking_status"];
  paymentStatus: Database["public"]["Enums"]["payment_status"];
  uploadToken: string;
  createdAt: string;
}

export interface CustomerPaymentsSummary {
  totalPaid: number;
  totalBalanceDue: number;
  totalDepositRequired: number;
  currency: string;
  totalBookingsCount: number;
  awaitingDepositCount: number;
  bookingPayments: CustomerBookingPaymentItem[];
  transactions: CustomerPaymentTransaction[];
}

/**
 * Retrieves all custom trip inquiries belonging to the currently authenticated customer.
 * Enforces ownership: customer_id = user.id OR email = user.email.
 * Strictly omits internal admin notes.
 */
export async function getCustomerCustomTripsAction() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required." };
    }

    const admin = createAdminClient();
    const userEmail = user.email || "";

    let query = admin
      .from("custom_trip_requests")
      .select(
        "id, request_ref, guest_name, email, phone, destinations, experiences, party_size, timeframe, budget_range, special_requests, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (userEmail) {
      query = query.or(`customer_id.eq.${user.id},email.eq.${userEmail}`);
    } else {
      query = query.eq("customer_id", user.id);
    }

    const { data: records, error } = await query;

    if (error) {
      console.error("[Get Customer Custom Trips Error]", error);
      return { success: false, error: "Unable to retrieve bespoke itinerary inquiries." };
    }

    const inquiryIds = (records || []).map((r) => r.id);
    const proposalMap = new Map<
      string,
      {
        id: string;
        proposalRef: string;
        guestToken: string;
        status: Database["public"]["Enums"]["proposal_status"];
        titleEn: string;
        titleAr: string;
        totalPrice: number;
        depositRequired: number;
        validUntil: string;
      }
    >();

    if (inquiryIds.length > 0) {
      const { data: proposals } = await admin
        .from("custom_proposals")
        .select("id, inquiry_id, proposal_ref, guest_token, status, title_en, title_ar, total_price, deposit_required, valid_until, version")
        .in("inquiry_id", inquiryIds)
        .neq("status", "superseded")
        .order("version", { ascending: false });

      for (const p of proposals || []) {
        if (!proposalMap.has(p.inquiry_id)) {
          proposalMap.set(p.inquiry_id, {
            id: p.id,
            proposalRef: p.proposal_ref,
            guestToken: p.guest_token,
            status: p.status,
            titleEn: p.title_en,
            titleAr: p.title_ar,
            totalPrice: Number(p.total_price),
            depositRequired: Number(p.deposit_required),
            validUntil: p.valid_until,
          });
        }
      }
    }

    const formatted: CustomerCustomTripItem[] = (records || []).map((r) => ({
      id: r.id,
      requestRef: r.request_ref,
      guestName: r.guest_name,
      email: r.email,
      phone: r.phone,
      destinations: r.destinations || [],
      experiences: r.experiences || [],
      partySize: r.party_size || "Private Party",
      timeframe: r.timeframe || "Flexible",
      budgetRange: r.budget_range || "Bespoke Quote",
      specialRequests: r.special_requests,
      status: r.status,
      proposal: proposalMap.get(r.id) || null,
      createdAt: r.created_at,
    }));

    return { success: true, data: formatted };
  } catch (err) {
    console.error("[Get Customer Custom Trips Unexpected Error]", err);
    return { success: false, error: "Failed to load custom trip history." };
  }
}

const bookingIdSchema = z.string().uuid("Invalid booking identifier");

/**
 * Retrieves full reservation details and verified deposit proofs for an authenticated customer.
 * Ownership is verified on the server: booking.customer_id === user.id OR booking.customer_email === user.email.
 * Generates short-lived (15 min) signed URLs for private receipts.
 * Strictly omits internal admin notes and bucket storage paths.
 */
export async function getCustomerBookingDetailAction(bookingId: string) {
  try {
    const parsed = bookingIdSchema.safeParse(bookingId);
    if (!parsed.success) {
      return { success: false, error: "Invalid booking ID format." };
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required." };
    }

    const admin = createAdminClient();

    // 1. Fetch booking record
    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .select(
        "id, booking_ref, customer_id, service_id, customer_name, customer_email, customer_phone, departure_date, time_window, pax_count, pickup_location, notes, booking_status, payment_status, deposit_required, deposit_paid, balance_due, currency, upload_token, created_at, updated_at"
      )
      .eq("id", parsed.data)
      .maybeSingle();

    if (bookingErr || !booking) {
      return { success: false, error: "Reservation not found." };
    }

    // 2. Strict ownership verification
    const isOwnerById = booking.customer_id === user.id;
    const isOwnerByEmail =
      user.email &&
      booking.customer_email.toLowerCase() === user.email.toLowerCase();

    if (!isOwnerById && !isOwnerByEmail) {
      return {
        success: false,
        error: "Unauthorized: You do not have permission to view this reservation.",
      };
    }

    // 3. Fetch participants for this booking
    const { data: participants } = await admin
      .from("booking_participants")
      .select("id, full_name, passport_or_qatar_id, special_dietary, is_child")
      .eq("booking_id", booking.id);

    const formattedParticipants: CustomerParticipantItem[] = (participants || []).map((p) => ({
      id: p.id,
      fullName: p.full_name,
      passportOrQatarId: p.passport_or_qatar_id,
      specialDietary: p.special_dietary,
      isChild: Boolean(p.is_child),
    }));

    // 4. Fetch deposit proofs for this booking
    const { data: proofs, error: proofErr } = await admin
      .from("deposit_proofs")
      .select(
        "id, storage_path, file_name, file_size, mime_type, review_status, rejection_reason, uploaded_at, payment_method, custom_payment_method, amount_submitted, admin_confirmed_amount, transaction_ref, payment_date, bucket_id"
      )
      .eq("booking_id", booking.id)
      .order("uploaded_at", { ascending: false });

    if (proofErr) {
      console.warn("[Customer Booking Proofs Fetch Error]", proofErr);
    }

    // 5. Generate short-lived signed URLs (15 min = 900s) for proof previews
    const formattedProofs: CustomerDepositProofItem[] = await Promise.all(
      (proofs || []).map(async (p) => {
        const signedUrl = await createCustomerSignedProofUrl(admin, p.storage_path, p.bucket_id || "payment-proofs");

        return {
          id: p.id,
          fileName: p.file_name,
          fileSize: p.file_size,
          mimeType: p.mime_type,
          reviewStatus: p.review_status,
          rejectionReason: p.rejection_reason,
          uploadedAt: p.uploaded_at,
          signedUrl,
          paymentMethod: p.payment_method,
          customPaymentMethod: p.custom_payment_method,
          amountSubmitted: p.amount_submitted ? Number(p.amount_submitted) : undefined,
          adminConfirmedAmount: p.admin_confirmed_amount ? Number(p.admin_confirmed_amount) : undefined,
          transactionRef: p.transaction_ref,
          paymentDate: p.payment_date,
        };
      })
    );

    const dossier: CustomerBookingDossier = {
      id: booking.id,
      bookingRef: booking.booking_ref,
      serviceId: booking.service_id,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      customerPhone: booking.customer_phone,
      departureDate: booking.departure_date,
      timeWindow: booking.time_window,
      paxCount: booking.pax_count,
      pickupLocation: booking.pickup_location,
      notes: booking.notes,
      bookingStatus: booking.booking_status,
      paymentStatus: booking.payment_status,
      depositRequired: Number(booking.deposit_required),
      depositPaid: Number(booking.deposit_paid),
      balanceDue: Number(booking.balance_due),
      currency: booking.currency,
      uploadToken: booking.upload_token,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      participants: formattedParticipants,
      proofs: formattedProofs,
    };

    return { success: true, data: dossier };
  } catch (err) {
    console.error("[Get Customer Booking Detail Error]", err);
    return { success: false, error: "An unexpected error occurred loading reservation details." };
  }
}

const bookingRefSchema = z
  .string()
  .trim()
  .regex(/^MZ-[A-Z0-9]{8}$/i, "Invalid reservation reference format (e.g. MZ-XXXXXXXX)");

/**
 * Retrieves full reservation details by customer-facing booking reference (MZ-XXXXXXXX).
 * Strictly prevents UUID exposure in customer URLs while enforcing authenticated customer ownership.
 * Generates short-lived (15 min) signed URLs for private receipts.
 */
export async function getCustomerBookingByRefAction(bookingRef: string) {
  try {
    const parsed = bookingRefSchema.safeParse(bookingRef);
    if (!parsed.success) {
      return { success: false, error: "Invalid booking reference format." };
    }

    const cleanRef = parsed.data.toUpperCase();

    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required." };
    }

    const admin = createAdminClient();

    // 1. Fetch booking record by customer-facing reference
    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .select(
        "id, booking_ref, customer_id, service_id, customer_name, customer_email, customer_phone, departure_date, time_window, pax_count, pickup_location, notes, booking_status, payment_status, deposit_required, deposit_paid, balance_due, currency, upload_token, created_at, updated_at"
      )
      .eq("booking_ref", cleanRef)
      .maybeSingle();

    if (bookingErr || !booking) {
      return { success: false, error: "Reservation not found." };
    }

    // 2. Strict ownership verification
    const isOwnerById = booking.customer_id === user.id;
    const isOwnerByEmail =
      user.email &&
      booking.customer_email.toLowerCase() === user.email.toLowerCase();

    if (!isOwnerById && !isOwnerByEmail) {
      return {
        success: false,
        error: "Unauthorized: You do not have permission to view this reservation.",
      };
    }

    // 3. Fetch participants for this booking
    const { data: participants } = await admin
      .from("booking_participants")
      .select("id, full_name, passport_or_qatar_id, special_dietary, is_child")
      .eq("booking_id", booking.id);

    const formattedParticipants: CustomerParticipantItem[] = (participants || []).map((p) => ({
      id: p.id,
      fullName: p.full_name,
      passportOrQatarId: p.passport_or_qatar_id,
      specialDietary: p.special_dietary,
      isChild: Boolean(p.is_child),
    }));

    // 4. Fetch deposit proofs
    const { data: proofs, error: proofErr } = await admin
      .from("deposit_proofs")
      .select(
        "id, storage_path, file_name, file_size, mime_type, review_status, rejection_reason, uploaded_at, payment_method, custom_payment_method, amount_submitted, admin_confirmed_amount, transaction_ref, payment_date, bucket_id"
      )
      .eq("booking_id", booking.id)
      .order("uploaded_at", { ascending: false });

    if (proofErr) {
      console.warn("[Customer Booking Proofs Fetch Error]", proofErr);
    }

    // 5. Fetch verified payment ledger entries
    const { data: payments } = await admin
      .from("booking_payments")
      .select("id, payment_type, amount, currency, payment_method, transaction_reference, recorded_at")
      .eq("booking_id", booking.id)
      .order("recorded_at", { ascending: false });

    const formattedPayments: CustomerPaymentLedgerItem[] = (payments || []).map((pay) => ({
      id: pay.id,
      paymentType: pay.payment_type as CustomerPaymentLedgerItem["paymentType"],
      amount: Number(pay.amount),
      currency: pay.currency,
      paymentMethod: pay.payment_method,
      transactionReference: pay.transaction_reference,
      recordedAt: pay.recorded_at,
    }));

    // 6. Fetch timeline events
    const { data: timeline } = await admin
      .from("booking_timeline")
      .select("id, event_type, title_en, title_ar, description_en, description_ar, created_at")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: false });

    const formattedTimeline: CustomerTimelineItem[] = (timeline || []).map((t) => ({
      id: t.id,
      eventType: t.event_type,
      titleEn: t.title_en,
      titleAr: t.title_ar,
      descriptionEn: t.description_en,
      descriptionAr: t.description_ar,
      createdAt: t.created_at,
    }));

    // 7. Generate short-lived signed URLs (15 min = 900s) for proof previews
    const formattedProofs: CustomerDepositProofItem[] = await Promise.all(
      (proofs || []).map(async (p) => {
        const signedUrl = await createCustomerSignedProofUrl(admin, p.storage_path, p.bucket_id || "payment-proofs");

        return {
          id: p.id,
          fileName: p.file_name,
          fileSize: p.file_size,
          mimeType: p.mime_type,
          reviewStatus: p.review_status,
          rejectionReason: p.rejection_reason,
          uploadedAt: p.uploaded_at,
          signedUrl,
          paymentMethod: p.payment_method,
          customPaymentMethod: p.custom_payment_method,
          amountSubmitted: p.amount_submitted ? Number(p.amount_submitted) : undefined,
          adminConfirmedAmount: p.admin_confirmed_amount ? Number(p.admin_confirmed_amount) : undefined,
          transactionRef: p.transaction_ref,
          paymentDate: p.payment_date,
        };
      })
    );

    const depRequired = Number(booking.deposit_required || 0);
    const balDue = Number(booking.balance_due || 0);
    const depPaid = Number(booking.deposit_paid || 0);
    const bookingRec = booking as Record<string, unknown>;
    const totPrice = bookingRec.total_price ? Number(bookingRec.total_price) : (depRequired + balDue);

    const dossier: CustomerBookingDossier = {
      id: booking.id,
      bookingRef: booking.booking_ref,
      serviceId: booking.service_id,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      customerPhone: booking.customer_phone,
      departureDate: booking.departure_date,
      timeWindow: booking.time_window,
      paxCount: booking.pax_count,
      pickupLocation: booking.pickup_location,
      notes: booking.notes,
      bookingStatus: booking.booking_status,
      paymentStatus: booking.payment_status,
      depositRequired: depRequired,
      depositPaid: depPaid,
      balanceDue: balDue,
      totalPrice: totPrice,
      cancellationReason: (bookingRec.cancellation_reason as string) || null,
      cancelledAt: (bookingRec.cancelled_at as string) || null,
      completedAt: (bookingRec.completed_at as string) || null,
      currency: booking.currency,
      uploadToken: booking.upload_token,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      participants: formattedParticipants,
      proofs: formattedProofs,
      payments: formattedPayments,
      timeline: formattedTimeline,
    };

    return { success: true, data: dossier };
  } catch (err) {
    console.error("[Get Customer Booking By Ref Error]", err);
    return { success: false, error: "An unexpected error occurred loading reservation details." };
  }
}

/**
 * Retrieves payment history, balance due, and submitted deposit receipts for the authenticated customer.
 */
export async function getCustomerPaymentsAction() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required." };
    }

    const admin = createAdminClient();
    const userEmail = user.email || "";

    let query = admin
      .from("bookings")
      .select(
        "id, booking_ref, service_id, departure_date, booking_status, payment_status, deposit_required, deposit_paid, balance_due, currency, upload_token, created_at"
      )
      .order("created_at", { ascending: false });

    if (userEmail) {
      query = query.or(`customer_id.eq.${user.id},customer_email.eq.${userEmail}`);
    } else {
      query = query.eq("customer_id", user.id);
    }

    const { data: bookings, error: bookingsErr } = await query;

    if (bookingsErr) {
      console.error("[Get Customer Payments Bookings Error]", bookingsErr);
      return { success: false, error: "Unable to retrieve payments ledger." };
    }

    const bookingList = bookings || [];
    const bookingIds = bookingList.map((b) => b.id);
    const bookingLookup = new Map(bookingList.map((b) => [b.id, b]));

    let totalPaid = 0;
    let totalBalanceDue = 0;
    let totalDepositRequired = 0;
    let awaitingDepositCount = 0;

    const bookingPayments: CustomerBookingPaymentItem[] = bookingList.map((b) => {
      const depPaid = Number(b.deposit_paid || 0);
      const balDue = Number(b.balance_due || 0);
      const depReq = Number(b.deposit_required || 0);

      totalPaid += depPaid;
      // Only count active balance due for non-cancelled bookings
      if (b.booking_status !== "cancelled") {
        totalBalanceDue += balDue;
      }
      totalDepositRequired += depReq;

      if (b.payment_status === "deposit_pending" || b.booking_status === "awaiting_deposit") {
        awaitingDepositCount += 1;
      }

      return {
        id: b.id,
        bookingRef: b.booking_ref,
        serviceId: b.service_id,
        departureDate: b.departure_date,
        depositRequired: depReq,
        depositPaid: depPaid,
        balanceDue: balDue,
        currency: b.currency || "QAR",
        bookingStatus: b.booking_status,
        paymentStatus: b.payment_status,
        uploadToken: b.upload_token,
        createdAt: b.created_at,
      };
    });

    let transactions: CustomerPaymentTransaction[] = [];

    if (bookingIds.length > 0) {
      const { data: proofs, error: proofErr } = await admin
        .from("deposit_proofs")
        .select(
          "id, booking_id, storage_path, file_name, file_size, mime_type, review_status, rejection_reason, uploaded_at, bucket_id"
        )
        .in("booking_id", bookingIds)
        .order("uploaded_at", { ascending: false });

      if (proofErr) {
        console.warn("[Customer Payments Proofs Fetch Error]", proofErr);
      }

      if (proofs && proofs.length > 0) {
        transactions = await Promise.all(
          proofs.map(async (p) => {
            const b = bookingLookup.get(p.booking_id);
            const signedUrl = await createCustomerSignedProofUrl(admin, p.storage_path, p.bucket_id || "payment-proofs");

            return {
              id: p.id,
              bookingRef: b?.booking_ref || "MZ-UNKNOWN",
              serviceId: b?.service_id || "tour",
              departureDate: b?.departure_date || null,
              fileName: p.file_name,
              fileSize: p.file_size,
              mimeType: p.mime_type,
              reviewStatus: p.review_status,
              rejectionReason: p.rejection_reason,
              uploadedAt: p.uploaded_at,
              signedUrl,
              amount: Number(b?.deposit_paid || b?.deposit_required || 0),
              currency: b?.currency || "QAR",
            };
          })
        );
      }
    }

    const summary: CustomerPaymentsSummary = {
      totalPaid,
      totalBalanceDue,
      totalDepositRequired,
      currency: "QAR",
      totalBookingsCount: bookingList.length,
      awaitingDepositCount,
      bookingPayments,
      transactions,
    };

    return { success: true, data: summary };
  } catch (err) {
    console.error("[Get Customer Payments Unexpected Error]", err);
    return { success: false, error: "Failed to load payments summary." };
  }
}
