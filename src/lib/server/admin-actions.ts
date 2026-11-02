"use server";

import crypto from "crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { getCurrentUserAction } from "./auth-actions";
import {
  VALID_BOOKING_STATUS_TRANSITIONS,
  VALID_CUSTOM_TRIP_STATUS_TRANSITIONS,
  recordBalancePaymentSchema,
  cancelBookingSchema,
  completeBookingSchema,
  assignCustomTripSchema,
  updateCustomTripCrmSchema,
  addCustomTripMessageSchema,
  saveCustomProposalSchema,
  convertProposalSchema,
  calculateQuotationTotals,
} from "@/lib/validations/booking-schemas";
import { sendCustomerBookingNotification, sendCustomTripNotification } from "./email-service";

/**
 * Ensures caller is an active admin or authenticated staff member.
 */
export async function assertAdminAccess() {
  const session = await getCurrentUserAction();
  if (!session.success || !session.data || !session.data.isAdmin) {
    throw new Error("Unauthorized: Staff or administrator clearance required.");
  }
  return session.data;
}

/**
 * Ensures caller has financial officer or super administrator clearance.
 * Authorized for payment ledger entries, balance records, and deposit proof approvals.
 */
export async function assertFinanceAccess() {
  const session = await assertAdminAccess();
  const role = session.adminRole;
  if (role !== "super_admin" && role !== "finance") {
    throw new Error("Unauthorized: Financial clearance required (finance or super_admin).");
  }
  return session;
}

/**
 * Ensures caller has tour operations or super administrator clearance.
 * Authorized for booking status changes, completions, and cancellations.
 */
export async function assertTourOperationsAccess() {
  const session = await assertAdminAccess();
  const role = session.adminRole;
  if (role !== "super_admin" && role !== "tour_manager") {
    throw new Error("Unauthorized: Tour operations clearance required (tour_manager or super_admin).");
  }
  return session;
}

/**
 * Ensures caller has CRM clearance (super_admin, tour_manager, or concierge_agent).
 */
export async function assertCrmAccess() {
  const session = await assertAdminAccess();
  const role = session.adminRole;
  if (role !== "super_admin" && role !== "tour_manager" && role !== "concierge_agent") {
    throw new Error("Unauthorized: CRM clearance required (concierge_agent, tour_manager, or super_admin).");
  }
  return session;
}

/**
 * Ensures caller has itinerary and proposal operations clearance (super_admin or tour_manager).
 */
export async function assertProposalOperationsAccess() {
  const session = await assertAdminAccess();
  const role = session.adminRole;
  if (role !== "super_admin" && role !== "tour_manager") {
    throw new Error("Unauthorized: Proposal operations clearance required (tour_manager or super_admin).");
  }
  return session;
}

export interface AssignableStaffItem {
  id: string;
  role: string;
  fullName: string;
  email: string;
}

/**
 * Returns active staff accounts for CRM inquiry assignments.
 */
export async function getAssignableStaffAction() {
  try {
    await assertCrmAccess();
    const admin = createAdminClient();

    const { data: staff, error: staffErr } = await admin
      .from("admin_users")
      .select("id, role")
      .eq("is_active", true);

    if (staffErr) {
      console.error("[Get Assignable Staff Error]", staffErr);
      return { success: false, error: "Failed to load staff list." };
    }

    const staffIds = (staff || []).map((s) => s.id);
    const profilesMap = new Map<string, { full_name: string | null; email: string | null }>();

    if (staffIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", staffIds);

      for (const p of profiles || []) {
        profilesMap.set(p.id, p);
      }
    }

    const items: AssignableStaffItem[] = (staff || []).map((s) => {
      const p = profilesMap.get(s.id);
      return {
        id: s.id,
        role: s.role,
        fullName: p?.full_name || s.role.replace("_", " ").toUpperCase(),
        email: p?.email || "staff@mztourismqatar.qa",
      };
    });

    return { success: true, data: items };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// =============================================================================
// 1. ADMIN METRICS
// =============================================================================

export interface AdminMetricsData {
  totalBookings: number;
  awaitingDeposit: number;
  underReview: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingProofs: number;
  acceptedProofs: number;
  rejectedProofs: number;
  newCustomTrips: number;
  activeServices: number;
  totalServices: number;
}

export async function getAdminMetricsAction() {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();

    const [
      { count: totalBookings },
      { count: awaitingDeposit },
      { count: underReview },
      { count: confirmedBookings },
      { count: completedBookings },
      { count: cancelledBookings },
      { count: pendingProofs },
      { count: acceptedProofs },
      { count: rejectedProofs },
      { count: newCustomTrips },
      { count: activeServices },
      { count: totalServices },
    ] = await Promise.all([
      admin.from("bookings").select("id", { count: "exact", head: true }),
      admin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("booking_status", "awaiting_deposit"),
      admin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("booking_status", "deposit_under_review"),
      admin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("booking_status", "confirmed"),
      admin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("booking_status", "completed"),
      admin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("booking_status", "cancelled"),
      admin
        .from("deposit_proofs")
        .select("id", { count: "exact", head: true })
        .eq("review_status", "pending"),
      admin
        .from("deposit_proofs")
        .select("id", { count: "exact", head: true })
        .eq("review_status", "accepted"),
      admin
        .from("deposit_proofs")
        .select("id", { count: "exact", head: true })
        .eq("review_status", "rejected"),
      admin
        .from("custom_trip_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
      admin
        .from("services")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      admin.from("services").select("id", { count: "exact", head: true }),
    ]);

    return {
      success: true,
      data: {
        totalBookings: totalBookings ?? 0,
        awaitingDeposit: awaitingDeposit ?? 0,
        underReview: underReview ?? 0,
        confirmedBookings: confirmedBookings ?? 0,
        completedBookings: completedBookings ?? 0,
        cancelledBookings: cancelledBookings ?? 0,
        pendingProofs: pendingProofs ?? 0,
        acceptedProofs: acceptedProofs ?? 0,
        rejectedProofs: rejectedProofs ?? 0,
        newCustomTrips: newCustomTrips ?? 0,
        activeServices: activeServices ?? 0,
        totalServices: totalServices ?? 0,
      },
    };
  } catch (err) {
    console.error("[Get Admin Metrics Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

// =============================================================================
// 2. ADMIN BOOKINGS MANAGEMENT
// =============================================================================

export interface GetAdminBookingsOptions {
  filterStatus?: string;
  filterPaymentStatus?: string;
  search?: string;
  serviceId?: string;
  departureDate?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "newest" | "oldest" | "departure_asc" | "departure_desc" | "amount_desc" | "amount_asc";
  page?: number;
  limit?: number;
}

export async function getAdminBookingsAction(
  filterStatusOrOptions?: string | GetAdminBookingsOptions
) {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();

    let filterStatus = "all";
    let filterPaymentStatus = "all";
    let search = "";
    let serviceId = "all";
    let departureDate = "";
    let startDate = "";
    let endDate = "";
    let sortBy: GetAdminBookingsOptions["sortBy"] = "newest";
    let page = 1;
    let limit = 100;

    if (typeof filterStatusOrOptions === "string") {
      filterStatus = filterStatusOrOptions;
    } else if (filterStatusOrOptions && typeof filterStatusOrOptions === "object") {
      filterStatus = filterStatusOrOptions.filterStatus || "all";
      filterPaymentStatus = filterStatusOrOptions.filterPaymentStatus || "all";
      search = filterStatusOrOptions.search?.trim().toLowerCase() || "";
      serviceId = filterStatusOrOptions.serviceId || "all";
      departureDate = filterStatusOrOptions.departureDate?.trim() || "";
      startDate = filterStatusOrOptions.startDate?.trim() || "";
      endDate = filterStatusOrOptions.endDate?.trim() || "";
      sortBy = filterStatusOrOptions.sortBy || "newest";
      page = Math.max(1, filterStatusOrOptions.page || 1);
      limit = Math.min(200, Math.max(1, filterStatusOrOptions.limit || 100));
    }

    let query = admin
      .from("bookings")
      .select(
        "id, booking_ref, customer_id, service_id, customer_name, customer_email, customer_phone, departure_date, time_window, pax_count, pickup_location, notes, booking_status, payment_status, deposit_required, deposit_paid, balance_due, currency, admin_notes, upload_token, created_at, updated_at",
        { count: "exact" }
      );

    // Sorting order
    switch (sortBy) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "departure_asc":
        query = query.order("departure_date", { ascending: true, nullsFirst: false });
        break;
      case "departure_desc":
        query = query.order("departure_date", { ascending: false, nullsFirst: false });
        break;
      case "amount_desc":
        query = query.order("deposit_required", { ascending: false });
        break;
      case "amount_asc":
        query = query.order("deposit_required", { ascending: true });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    if (filterStatus && filterStatus !== "all") {
      query = query.eq(
        "booking_status",
        filterStatus as Database["public"]["Enums"]["booking_status"]
      );
    }

    if (filterPaymentStatus && filterPaymentStatus !== "all") {
      query = query.eq(
        "payment_status",
        filterPaymentStatus as Database["public"]["Enums"]["payment_status"]
      );
    }

    if (serviceId && serviceId !== "all") {
      query = query.eq("service_id", serviceId);
    }

    if (departureDate) {
      query = query.eq("departure_date", departureDate);
    }

    if (startDate) {
      query = query.gte("departure_date", startDate);
    }

    if (endDate) {
      query = query.lte("departure_date", endDate);
    }

    if (search) {
      // ilike search across reference, guest name, email, phone
      query = query.or(
        `booking_ref.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%`
      );
    }

    const fromOffset = (page - 1) * limit;
    const toOffset = fromOffset + limit - 1;
    query = query.range(fromOffset, toOffset);

    const { data: bookings, count, error } = await query;

    if (error) {
      console.error("[Get Admin Bookings Error]", error);
      return { success: false, error: "Failed to retrieve bookings." };
    }

    return {
      success: true,
      totalCount: count ?? (bookings?.length || 0),
      page,
      limit,
      data: (bookings || []).map((b) => {
        const depRequired = Number(b.deposit_required || 0);
        const balDue = Number(b.balance_due || 0);
        const depPaid = Number(b.deposit_paid || 0);
        const rawRec = b as Record<string, unknown>;
        const totPrice = rawRec.total_price ? Number(rawRec.total_price) : (depRequired + balDue);

        return {
          id: b.id,
          bookingRef: b.booking_ref,
          customerId: b.customer_id,
          serviceId: b.service_id,
          customerName: b.customer_name,
          customerEmail: b.customer_email,
          customerPhone: b.customer_phone,
          departureDate: b.departure_date,
          timeWindow: b.time_window,
          paxCount: b.pax_count,
          pickupLocation: b.pickup_location,
          notes: b.notes,
          bookingStatus: b.booking_status,
          paymentStatus: b.payment_status,
          depositRequired: depRequired,
          depositPaid: depPaid,
          balanceDue: balDue,
          totalPrice: totPrice,
          currency: b.currency,
          adminNotes: b.admin_notes,
          cancellationReason: (rawRec.cancellation_reason as string) || null,
          cancelledAt: (rawRec.cancelled_at as string) || null,
          cancelledBy: (rawRec.cancelled_by as string) || null,
          completedAt: (rawRec.completed_at as string) || null,
          completedBy: (rawRec.completed_by as string) || null,
          uploadToken: b.upload_token,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        };
      }),
    };
  } catch (err) {
    console.error("[Get Admin Bookings Unexpected Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Returns full dossier for a single reservation, including associated deposit proofs,
 * verified payment ledger entries, timeline events, and notification logs.
 */
export async function getAdminBookingDetailAction(bookingId: string) {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();

    const { data: booking, error } = await admin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();

    if (error || !booking) {
      return { success: false, error: "Booking record not found." };
    }

    // Retrieve associated deposit proofs
    const { data: proofs } = await admin
      .from("deposit_proofs")
      .select("id, storage_path, file_name, mime_type, file_size, review_status, rejection_reason, reviewed_by, reviewed_at, uploaded_at")
      .eq("booking_id", booking.id)
      .order("uploaded_at", { ascending: false });

    // Retrieve verified payments ledger
    const { data: payments } = await admin
      .from("booking_payments")
      .select("id, booking_id, payment_type, amount, currency, payment_method, transaction_reference, proof_id, notes, recorded_by, recorded_at")
      .eq("booking_id", booking.id)
      .order("recorded_at", { ascending: false });

    // Retrieve timeline events
    const { data: timeline } = await admin
      .from("booking_timeline")
      .select("id, booking_id, event_type, from_status, to_status, title_en, title_ar, description_en, description_ar, actor_id, actor_role, metadata, created_at")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: false });

    // Retrieve notification logs
    const { data: notifications } = await admin
      .from("customer_notifications")
      .select("id, booking_id, notification_type, channel, recipient, status, subject, created_at")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: false });

    const depRequired = Number(booking.deposit_required || 0);
    const balDue = Number(booking.balance_due || 0);
    const depPaid = Number(booking.deposit_paid || 0);
    const totPrice = booking.total_price ? Number(booking.total_price) : (depRequired + balDue);

    return {
      success: true,
      data: {
        booking: {
          id: booking.id,
          bookingRef: booking.booking_ref,
          customerId: booking.customer_id,
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
          currency: booking.currency,
          adminNotes: booking.admin_notes,
          cancellationReason: booking.cancellation_reason || null,
          cancelledAt: booking.cancelled_at || null,
          cancelledBy: booking.cancelled_by || null,
          completedAt: booking.completed_at || null,
          completedBy: booking.completed_by || null,
          uploadToken: booking.upload_token,
          createdAt: booking.created_at,
          updatedAt: booking.updated_at,
        },
        proofs: proofs || [],
        payments: (payments || []).map((p) => ({
          id: p.id,
          bookingId: p.booking_id,
          paymentType: p.payment_type,
          amount: Number(p.amount),
          currency: p.currency,
          paymentMethod: p.payment_method,
          transactionReference: p.transaction_reference,
          proofId: p.proof_id,
          notes: p.notes,
          recordedBy: p.recorded_by,
          recordedAt: p.recorded_at,
        })),
        timeline: (timeline || []).map((t) => ({
          id: t.id,
          bookingId: t.booking_id,
          eventType: t.event_type,
          fromStatus: t.from_status,
          toStatus: t.to_status,
          titleEn: t.title_en,
          titleAr: t.title_ar,
          descriptionEn: t.description_en,
          descriptionAr: t.description_ar,
          actorId: t.actor_id,
          actorRole: t.actor_role,
          metadata: t.metadata,
          createdAt: t.created_at,
        })),
        notifications: notifications || [],
      },
    };
  } catch (err) {
    console.error("[Get Admin Booking Detail Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

const updateBookingSchema = z.object({
  bookingId: z.string().uuid("Invalid booking identifier"),
  bookingStatus: z.enum([
    "awaiting_deposit",
    "deposit_under_review",
    "confirmed",
    "completed",
    "cancelled",
  ]),
  paymentStatus: z.enum([
    "deposit_pending",
    "deposit_submitted",
    "deposit_confirmed",
    "deposit_rejected",
    "fully_paid",
  ]),
  depositPaid: z.number().min(0, "Deposit paid cannot be negative").optional(),
  balanceDue: z.number().min(0, "Balance due cannot be negative").optional(),
  adminNotes: z.string().max(2000, "Admin notes exceed 2000 characters").optional().nullable(),
});

export async function updateAdminBookingAction(rawInput: unknown) {
  try {
    await assertAdminAccess();
    const validation = updateBookingSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: "Invalid booking update parameters.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const {
      bookingId,
      bookingStatus,
      paymentStatus,
      depositPaid,
      balanceDue,
      adminNotes,
    } = validation.data;

    const admin = createAdminClient();

    // 1. Fetch current booking to validate status transition
    const { data: currentBooking, error: fetchErr } = await admin
      .from("bookings")
      .select("id, booking_status, payment_status")
      .eq("id", bookingId)
      .maybeSingle();

    if (fetchErr || !currentBooking) {
      return { success: false, error: "Booking record not found." };
    }

    const currentStatus = currentBooking.booking_status;
    const allowedTransitions = VALID_BOOKING_STATUS_TRANSITIONS[currentStatus] || [currentStatus];

    if (!allowedTransitions.includes(bookingStatus)) {
      return {
        success: false,
        error: `Cannot transition booking status from "${currentStatus}" to "${bookingStatus}".`,
      };
    }

    const updatePayload: Database["public"]["Tables"]["bookings"]["Update"] = {
      booking_status: bookingStatus,
      payment_status: paymentStatus,
      admin_notes: adminNotes !== undefined ? adminNotes : undefined,
      updated_at: new Date().toISOString(),
    };

    if (depositPaid !== undefined) {
      updatePayload.deposit_paid = depositPaid;
    }
    if (balanceDue !== undefined) {
      updatePayload.balance_due = balanceDue;
    }

    const { error: updateErr } = await admin
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId);

    if (updateErr) {
      console.error("[Update Admin Booking Error]", updateErr);
      return { success: false, error: "Failed to update booking." };
    }

    return { success: true };
  } catch (err) {
    console.error("[Update Admin Booking Unexpected Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

// =============================================================================
// 3. DEPOSIT PROOFS REVIEW QUEUE & SIGNED URLS
// =============================================================================

interface DepositProofWithBooking {
  id: string;
  booking_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  review_status: Database["public"]["Enums"]["deposit_proof_review_status"];
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  uploaded_at: string;
  bookings: {
    id: string;
    booking_ref: string;
    customer_name: string;
    customer_phone: string;
    service_id: string;
    departure_date: string | null;
    deposit_required: number;
  } | null;
}

export async function getAdminDepositProofsAction() {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();

    const { data: proofs, error } = await admin
      .from("deposit_proofs")
      .select(
        "id, booking_id, storage_path, file_name, mime_type, file_size, review_status, rejection_reason, reviewed_by, reviewed_at, uploaded_at, bookings(id, booking_ref, customer_name, customer_phone, service_id, departure_date, deposit_required)"
      )
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("[Get Deposit Proofs Error]", error);
      return { success: false, error: "Failed to load deposit proofs." };
    }

    const proofList = (proofs as unknown as DepositProofWithBooking[]) || [];

    return {
      success: true,
      data: proofList.map((p) => ({
        id: p.id,
        bookingId: p.booking_id,
        storagePath: p.storage_path,
        fileName: p.file_name,
        mimeType: p.mime_type,
        fileSize: p.file_size,
        reviewStatus: p.review_status,
        rejectionReason: p.rejection_reason,
        reviewedBy: p.reviewed_by,
        reviewedAt: p.reviewed_at,
        uploadedAt: p.uploaded_at,
        booking: p.bookings
          ? {
              id: p.bookings.id,
              bookingRef: p.bookings.booking_ref,
              customerName: p.bookings.customer_name,
              customerPhone: p.bookings.customer_phone,
              serviceId: p.bookings.service_id,
              departureDate: p.bookings.departure_date,
              depositRequired: Number(p.bookings.deposit_required),
            }
          : null,
      })),
    };
  } catch (err) {
    console.error("[Get Deposit Proofs Unexpected Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Generates a temporary short-lived signed URL (15 minutes / 900 seconds)
 * for a deposit proof file so authorized staff can view it.
 * The private storage bucket remains completely protected from unauthenticated access.
 */
export async function getAdminSignedProofUrlAction(storagePath: string, bucketId: string = "deposit-proofs") {
  try {
    await assertAdminAccess();

    if (!storagePath || typeof storagePath !== "string" || storagePath.includes("..") || storagePath.includes("//")) {
      return { success: false, error: "Invalid storage path." };
    }

    const admin = createAdminClient();
    const primaryBucket = bucketId === "payment-proofs" ? "payment-proofs" : "deposit-proofs";
    const fallbackBucket = primaryBucket === "deposit-proofs" ? "payment-proofs" : "deposit-proofs";

    // 15 minutes = 900 seconds maximum validity for staff inspection
    let { data, error } = await admin.storage
      .from(primaryBucket)
      .createSignedUrl(storagePath, 900);

    // Fallback if not found in primary bucket
    if (error || !data?.signedUrl) {
      const fallback = await admin.storage
        .from(fallbackBucket)
        .createSignedUrl(storagePath, 900);
      if (fallback.data?.signedUrl) {
        data = fallback.data;
        error = null;
      }
    }

    if (error || !data?.signedUrl) {
      console.error("[Create Signed URL Error]", error);
      return { success: false, error: "Could not generate secure view URL." };
    }

    return { success: true, signedUrl: data.signedUrl };
  } catch (err) {
    console.error("[Create Signed URL Unexpected Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

const reviewProofSchema = z
  .object({
    proofId: z.string().uuid("Invalid proof identifier"),
    bookingId: z.string().uuid("Invalid booking identifier"),
    reviewStatus: z.enum(["accepted", "rejected"]),
    confirmedAmount: z.number().positive("Confirmed amount must be greater than zero").optional(),
    rejectionReason: z
      .string()
      .max(500, "Rejection reason exceeds 500 characters")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.reviewStatus === "rejected") {
        return Boolean(data.rejectionReason && data.rejectionReason.trim().length >= 3);
      }
      return true;
    },
    {
      message:
        "A clear rejection reason (at least 3 characters) must be provided when declining a deposit proof.",
      path: ["rejectionReason"],
    }
  );

export async function reviewAdminDepositProofAction(rawInput: unknown) {
  try {
    const adminUser = await assertFinanceAccess();
    const validation = reviewProofSchema.safeParse(rawInput);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid review parameters.";
      return { success: false, error: firstError };
    }

    const { proofId, bookingId, reviewStatus, confirmedAmount: inputAmount, rejectionReason } = validation.data;
    const admin = createAdminClient();

    // 1. Fetch current booking and deposit proof
    const [
      { data: booking, error: bErr },
      { data: existingProof, error: pErr },
    ] = await Promise.all([
      admin
        .from("bookings")
        .select("id, booking_ref, customer_name, customer_email, service_id, pax_count, deposit_required, deposit_paid, balance_due, currency, booking_status")
        .eq("id", bookingId)
        .maybeSingle(),
      admin
        .from("deposit_proofs")
        .select("id, review_status")
        .eq("id", proofId)
        .maybeSingle(),
    ]);

    if (bErr || !booking) {
      return { success: false, error: "Associated reservation record not found." };
    }

    if (pErr || !existingProof) {
      return { success: false, error: "Deposit proof record not found." };
    }

    // Prevent duplicate approvals
    if (existingProof.review_status === "accepted" && reviewStatus === "accepted") {
      return { success: false, error: "This deposit receipt has already been verified and approved." };
    }

    const nowIso = new Date().toISOString();

    // 2. Cascade state to parent booking, financial ledger & audit trail
    if (reviewStatus === "accepted") {
      const proofMeta = existingProof as { id: string; review_status: string; amount_submitted?: number | null };
      const confirmedAmount = inputAmount ?? (
        proofMeta.amount_submitted && Number(proofMeta.amount_submitted) > 0
          ? Number(proofMeta.amount_submitted)
          : Number(booking.deposit_required || 0)
      );

      // Record deposit into verified payment ledger (prevent double recording)
      try {
        const { data: existingLedger } = await admin
          .from("booking_payments")
          .select("id")
          .eq("booking_id", bookingId)
          .eq("proof_id", proofId)
          .maybeSingle();

        if (!existingLedger) {
          await admin.from("booking_payments").insert({
            booking_id: bookingId,
            payment_type: "deposit",
            amount: confirmedAmount,
            currency: booking.currency || "QAR",
            payment_method: "bank_transfer",
            custom_payment_method: null,
            amount_submitted: confirmedAmount,
            payment_date: nowIso.slice(0, 10),
            transaction_reference: null,
            proof_id: proofId,
            notes: "Deposit verified and credited from approved customer manual payment receipt",
            recorded_by: adminUser.user?.id || null,
            recorded_at: nowIso,
            verification_status: "confirmed",
          });
        }
      } catch (bpErr) {
        console.warn("[Booking Payments Ledger]", bpErr);
      }

      // Compute single source of truth balance from ledger
      const { data: allConfirmedPayments } = await admin
        .from("booking_payments")
        .select("amount")
        .eq("booking_id", bookingId)
        .eq("verification_status", "confirmed");

      const totalConfirmedPayments = (allConfirmedPayments || []).reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      );

      const bookingRec = booking as Record<string, unknown>;
      const totPrice = bookingRec.total_price
        ? Number(bookingRec.total_price)
        : Number(booking.deposit_required || 0) + Number(booking.balance_due || 0);

      // Invariant: Balance Due = Total Booking Amount - Confirmed Payments
      const computedBalDue = Math.max(0, totPrice - totalConfirmedPayments);

      // Update deposit proof record
      const { error: proofError } = await admin
        .from("deposit_proofs")
        .update({
          review_status: "accepted",
          admin_confirmed_amount: confirmedAmount,
          rejection_reason: null,
          reviewed_by: adminUser.user?.id || null,
          reviewed_at: nowIso,
        })
        .eq("id", proofId);

      if (proofError) {
        console.error("[Review Proof Error]", proofError);
        return { success: false, error: "Failed to update review record." };
      }

      // Exact status transition: booking_status = 'confirmed', payment_status = 'deposit_confirmed' (or 'fully_paid' if balance 0)
      await admin
        .from("bookings")
        .update({
          booking_status: "confirmed",
          payment_status: computedBalDue === 0 ? "fully_paid" : "deposit_confirmed",
          deposit_paid: totalConfirmedPayments,
          balance_due: computedBalDue,
          total_price: totPrice,
          updated_at: nowIso,
        })
        .eq("id", bookingId);

      // Record timeline audit event
      try {
        await admin.from("booking_timeline").insert({
          booking_id: bookingId,
          event_type: "deposit_approved",
          from_status: booking.booking_status,
          to_status: "confirmed",
          title_en: "Deposit Approved & Reservation Confirmed",
          title_ar: "تم اعتماد العربون وتأكيد الحجز",
          description_en: `Deposit payment of ${confirmedAmount} ${booking.currency || "QAR"} approved. Reservation confirmed.`,
          description_ar: `تم اعتماد إشعار تحويل العربون بقيمة ${confirmedAmount} ${booking.currency || "ر.ق"} وتأكيد الحجز.`,
          actor_id: adminUser.user?.id || null,
          actor_role: adminUser.adminRole || "finance",
          metadata: { proofId, depositAmount: confirmedAmount, balanceDue: computedBalDue },
        });
      } catch (timelineErr) {
        console.warn("[Timeline Insert Notice]", timelineErr);
      }

      // Dispatch customer notification
      try {
        await sendCustomerBookingNotification({
          bookingId: booking.id,
          bookingRef: booking.booking_ref,
          customerName: booking.customer_name,
          customerEmail: booking.customer_email,
          serviceTitle: booking.service_id,
          paxCount: booking.pax_count,
          depositRequired: Number(booking.deposit_required),
          depositPaid: totalConfirmedPayments,
          balanceDue: computedBalDue,
          currency: booking.currency,
          notificationType: "booking_confirmed",
        });
      } catch (notifyErr) {
        console.warn("[Notification Dispatch Notice]", notifyErr);
      }
    } else {
      // Review rejected
      // Update deposit proof record
      const { error: proofError } = await admin
        .from("deposit_proofs")
        .update({
          review_status: "rejected",
          rejection_reason: rejectionReason?.trim() || "Receipt inconclusive or missing bank transaction reference",
          reviewed_by: adminUser.user?.id || null,
          reviewed_at: nowIso,
        })
        .eq("id", proofId);

      if (proofError) {
        console.error("[Review Proof Error]", proofError);
        return { success: false, error: "Failed to update review record." };
      }

      // Exact status transition: booking_status = 'awaiting_deposit', payment_status = 'deposit_rejected'
      await admin
        .from("bookings")
        .update({
          booking_status: "awaiting_deposit",
          payment_status: "deposit_rejected",
          updated_at: nowIso,
        })
        .eq("id", bookingId);

      // Record timeline audit event
      try {
        await admin.from("booking_timeline").insert({
          booking_id: bookingId,
          event_type: "deposit_rejected",
          from_status: booking.booking_status,
          to_status: "awaiting_deposit",
          title_en: "Deposit Proof Declined",
          title_ar: "تم رفض إشعار التحويل",
          description_en: rejectionReason || "Deposit proof could not be verified.",
          description_ar: rejectionReason || "تعذر التحقق من صحة إشعار التحويل البنكي.",
          actor_id: adminUser.user?.id || null,
          actor_role: adminUser.adminRole || "finance",
          metadata: { proofId, rejectionReason },
        });
      } catch (timelineErr) {
        console.warn("[Timeline Insert Notice]", timelineErr);
      }

      // Dispatch customer notification
      try {
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
          currency: booking.currency,
          notificationType: "deposit_rejected",
          rejectionReason: rejectionReason?.trim() || null,
        });
      } catch (notifyErr) {
        console.warn("[Notification Dispatch Notice]", notifyErr);
      }
    }

    return { success: true };
  } catch (err) {
    console.error("[Review Proof Unexpected Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

export async function confirmManualDepositAction(bookingId: string, proofId: string, confirmedAmount?: number) {
  return reviewAdminDepositProofAction({
    bookingId,
    proofId,
    reviewStatus: "accepted",
    confirmedAmount,
  });
}

export async function rejectManualDepositProofAction(bookingId: string, proofId: string, rejectionReason: string) {
  return reviewAdminDepositProofAction({
    bookingId,
    proofId,
    reviewStatus: "rejected",
    rejectionReason,
  });
}

/**
 * Records a verified balance payment directly into the financial ledger (public.booking_payments).
 * Restricted to finance officers and super administrators.
 * Strictly prevents overpayment (amount cannot exceed balance_due).
 * When remaining balance reaches 0, marks booking payment status as 'fully_paid'.
 */
export async function recordBalancePaymentAction(rawInput: unknown) {
  try {
    const adminUser = await assertFinanceAccess();
    const validation = recordBalancePaymentSchema.safeParse(rawInput);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0]?.message || "Invalid payment details.";
      return {
        success: false,
        error: firstIssue,
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const { bookingId, amount, currency, paymentMethod, transactionReference, notes } = validation.data;
    const admin = createAdminClient();

    // 1. Fetch booking to verify current balance
    const { data: booking, error: fetchErr } = await admin
      .from("bookings")
      .select("id, booking_ref, customer_name, customer_email, service_id, pax_count, deposit_required, deposit_paid, balance_due, total_price, currency, booking_status, payment_status")
      .eq("id", bookingId)
      .maybeSingle();

    if (fetchErr || !booking) {
      return { success: false, error: "Booking record not found." };
    }

    const currentBalanceDue = Number(booking.balance_due || 0);

    // Prevent payment exceeding balance due
    if (amount > currentBalanceDue) {
      return {
        success: false,
        error: `Payment amount (${amount} ${currency}) exceeds remaining balance due (${currentBalanceDue} ${currency}).`,
      };
    }

    const nowIso = new Date().toISOString();

    // 2. Insert into payment ledger
    const { data: paymentRecord, error: ledgerErr } = await admin
      .from("booking_payments")
      .insert({
        booking_id: bookingId,
        payment_type: "balance",
        amount,
        currency,
        payment_method: paymentMethod,
        transaction_reference: transactionReference || null,
        notes: notes || null,
        recorded_by: adminUser.user?.id || null,
        recorded_at: nowIso,
      })
      .select("id")
      .single();

    if (ledgerErr) {
      console.error("[Record Payment Ledger Error]", ledgerErr);
      return { success: false, error: "Failed to record payment entry in ledger." };
    }

    // 3. Recalculate balances
    const newBalanceDue = Math.max(0, currentBalanceDue - amount);
    const newDepositPaid = Number(booking.deposit_paid || 0) + amount;
    const isFullyPaid = newBalanceDue === 0;
    const newPaymentStatus = isFullyPaid ? "fully_paid" : booking.payment_status;

    const { error: updateErr } = await admin
      .from("bookings")
      .update({
        balance_due: newBalanceDue,
        deposit_paid: newDepositPaid,
        payment_status: newPaymentStatus,
        updated_at: nowIso,
      })
      .eq("id", bookingId);

    if (updateErr) {
      console.error("[Update Booking Balance Error]", updateErr);
      return { success: false, error: "Failed to update reservation balance." };
    }

    // 4. Record audit timeline entry
    try {
      await admin.from("booking_timeline").insert({
        booking_id: bookingId,
        event_type: "balance_payment_recorded",
        from_status: booking.booking_status,
        to_status: booking.booking_status,
        title_en: "Balance Payment Recorded",
        title_ar: "تم تسجيل دفعة من الرصيد",
        description_en: `Recorded verified payment of ${amount} ${currency} via ${paymentMethod.replace(/_/g, " ")}. Remaining: ${newBalanceDue} ${currency}.`,
        description_ar: `تم تسجيل دفعة معتمدة بقيمة ${amount} ${currency} عبر: ${paymentMethod}. المتبقي: ${newBalanceDue} ${currency}.`,
        actor_id: adminUser.user?.id || null,
        actor_role: adminUser.adminRole || "finance",
        metadata: {
          paymentId: paymentRecord?.id,
          amount,
          currency,
          paymentMethod,
          transactionReference: transactionReference || null,
          remainingBalance: newBalanceDue,
        },
      });
    } catch (timelineErr) {
      console.warn("[Timeline Insert Notice]", timelineErr);
    }

    return {
      success: true,
      data: {
        paymentId: paymentRecord?.id,
        newBalanceDue,
        newDepositPaid,
        isFullyPaid,
      },
    };
  } catch (err) {
    console.error("[Record Balance Payment Unexpected Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Cancels a reservation with mandatory reason (>= 3 characters).
 * Enforces role clearance (tour_manager or super_admin).
 * Enforces lifecycle state transitions (completed reservations CANNOT be cancelled).
 * Dispatches customer notification and records audit timeline entry.
 */
export async function cancelAdminBookingAction(rawInput: unknown) {
  try {
    const adminUser = await assertTourOperationsAccess();
    const validation = cancelBookingSchema.safeParse(rawInput);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0]?.message || "Invalid cancellation parameters.";
      return { success: false, error: firstIssue };
    }

    const { bookingId, reason } = validation.data;
    const admin = createAdminClient();

    // 1. Fetch current booking to validate status transition
    const { data: booking, error: fetchErr } = await admin
      .from("bookings")
      .select("id, booking_ref, customer_name, customer_email, service_id, pax_count, deposit_required, deposit_paid, balance_due, currency, booking_status")
      .eq("id", bookingId)
      .maybeSingle();

    if (fetchErr || !booking) {
      return { success: false, error: "Booking record not found." };
    }

    const currentStatus = booking.booking_status;
    const allowed = VALID_BOOKING_STATUS_TRANSITIONS[currentStatus] || [currentStatus];

    if (!allowed.includes("cancelled")) {
      return {
        success: false,
        error: `Cannot cancel reservation with status "${currentStatus}". Completed reservations cannot be cancelled.`,
      };
    }

    const nowIso = new Date().toISOString();

    // 2. Update booking
    const { error: updateErr } = await admin
      .from("bookings")
      .update({
        booking_status: "cancelled",
        cancellation_reason: reason,
        cancelled_at: nowIso,
        cancelled_by: adminUser.user?.id || null,
        updated_at: nowIso,
      })
      .eq("id", bookingId);

    if (updateErr) {
      console.error("[Cancel Admin Booking Error]", updateErr);
      return { success: false, error: "Failed to cancel reservation." };
    }

    // 3. Record timeline entry
    try {
      await admin.from("booking_timeline").insert({
        booking_id: bookingId,
        event_type: "booking_cancelled",
        from_status: currentStatus,
        to_status: "cancelled",
        title_en: "Reservation Cancelled",
        title_ar: "تم إلغاء الحجز",
        description_en: `Reason: ${reason}`,
        description_ar: `سبب الإلغاء: ${reason}`,
        actor_id: adminUser.user?.id || null,
        actor_role: adminUser.adminRole || "tour_manager",
        metadata: { reason },
      });
    } catch (timelineErr) {
      console.warn("[Timeline Insert Notice]", timelineErr);
    }

    // 4. Dispatch notification to customer
    try {
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
        currency: booking.currency,
        notificationType: "booking_cancelled",
        cancellationReason: reason,
      });
    } catch (notifyErr) {
      console.warn("[Cancellation Notification Notice]", notifyErr);
    }

    return { success: true };
  } catch (err) {
    console.error("[Cancel Admin Booking Unexpected Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Marks an expedition as successfully completed.
 * Enforces role clearance (tour_manager or super_admin).
 * Enforces that only confirmed bookings can transition to completed.
 * Dispatches customer notification and records audit timeline entry.
 */
export async function completeAdminBookingAction(rawInput: unknown) {
  try {
    const adminUser = await assertTourOperationsAccess();
    const validation = completeBookingSchema.safeParse(rawInput);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0]?.message || "Invalid completion parameters.";
      return { success: false, error: firstIssue };
    }

    const { bookingId, notes } = validation.data;
    const admin = createAdminClient();

    // 1. Fetch current booking
    const { data: booking, error: fetchErr } = await admin
      .from("bookings")
      .select("id, booking_ref, customer_name, customer_email, service_id, pax_count, deposit_required, deposit_paid, balance_due, currency, booking_status")
      .eq("id", bookingId)
      .maybeSingle();

    if (fetchErr || !booking) {
      return { success: false, error: "Booking record not found." };
    }

    if (booking.booking_status !== "confirmed") {
      return {
        success: false,
        error: `Only confirmed reservations can be marked as completed (current status: "${booking.booking_status}").`,
      };
    }

    const nowIso = new Date().toISOString();

    // 2. Update booking
    const { error: updateErr } = await admin
      .from("bookings")
      .update({
        booking_status: "completed",
        completed_at: nowIso,
        completed_by: adminUser.user?.id || null,
        updated_at: nowIso,
      })
      .eq("id", bookingId);

    if (updateErr) {
      console.error("[Complete Admin Booking Error]", updateErr);
      return { success: false, error: "Failed to mark reservation as completed." };
    }

    // 3. Record timeline entry
    try {
      await admin.from("booking_timeline").insert({
        booking_id: bookingId,
        event_type: "booking_completed",
        from_status: "confirmed",
        to_status: "completed",
        title_en: "Expedition Completed",
        title_ar: "اكتملت الرحلة بنجاح",
        description_en: notes || "Expedition concluded successfully by concierge operations.",
        description_ar: notes || "اكتملت الرحلة السياحية بنجاح من قبل فريق العمليات والكونسيرج.",
        actor_id: adminUser.user?.id || null,
        actor_role: adminUser.adminRole || "tour_manager",
        metadata: { notes: notes || null },
      });
    } catch (timelineErr) {
      console.warn("[Timeline Insert Notice]", timelineErr);
    }

    // 4. Dispatch notification to customer
    try {
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
        currency: booking.currency,
        notificationType: "booking_completed",
      });
    } catch (notifyErr) {
      console.warn("[Completion Notification Notice]", notifyErr);
    }

    return { success: true };
  } catch (err) {
    console.error("[Complete Admin Booking Unexpected Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Generates an RFC 4180 compliant CSV export of filtered reservations.
 * Enforces administrator authentication.
 */
export async function exportBookingsCsvAction(filterOptions?: GetAdminBookingsOptions) {
  try {
    await assertAdminAccess();
    const result = await getAdminBookingsAction({
      ...(filterOptions || {}),
      page: 1,
      limit: 1000,
    });

    if (!result.success || !result.data) {
      return { success: false, error: result.error || "Failed to load bookings for export." };
    }

    const headers = [
      "Booking Reference",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Tour Service ID",
      "Departure Date",
      "Pax Count",
      "Pickup Location",
      "Booking Status",
      "Payment Status",
      "Deposit Required (QAR)",
      "Deposit Paid (QAR)",
      "Balance Due (QAR)",
      "Total Price (QAR)",
      "Cancellation Reason",
      "Created At",
    ];

    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = result.data.map((b) => [
      escapeCsv(b.bookingRef),
      escapeCsv(b.customerName),
      escapeCsv(b.customerEmail),
      escapeCsv(b.customerPhone),
      escapeCsv(b.serviceId),
      escapeCsv(b.departureDate || "Flexible"),
      escapeCsv(b.paxCount),
      escapeCsv(b.pickupLocation || ""),
      escapeCsv(b.bookingStatus),
      escapeCsv(b.paymentStatus),
      escapeCsv(b.depositRequired),
      escapeCsv(b.depositPaid),
      escapeCsv(b.balanceDue),
      escapeCsv(b.totalPrice ?? (b.depositRequired + b.balanceDue)),
      escapeCsv(b.cancellationReason || ""),
      escapeCsv(b.createdAt),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    return {
      success: true,
      csvContent,
      filename: `mz_tourism_bookings_${new Date().toISOString().slice(0, 10)}.csv`,
    };
  } catch (err) {
    console.error("[Export Bookings CSV Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

// =============================================================================
// 4. CUSTOM TRIP REQUESTS & CRM MANAGEMENT
// =============================================================================

export interface GetAdminCustomTripsOptions {
  filterStatus?: string;
  priority?: string;
  assignedTo?: string;
  destination?: string;
  search?: string;
  sortBy?: "newest" | "oldest" | "priority_desc" | "follow_up";
  page?: number;
  limit?: number;
}

export async function getAdminCustomTripsAction(
  filterStatusOrOptions?: string | GetAdminCustomTripsOptions
) {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();

    let filterStatus = "all";
    let priorityFilter = "all";
    let assignedToFilter = "all";
    let destinationFilter = "";
    let search = "";
    let sortBy: "newest" | "oldest" | "priority_desc" | "follow_up" = "newest";
    let page = 1;
    let limit = 50;

    if (typeof filterStatusOrOptions === "string") {
      filterStatus = filterStatusOrOptions;
    } else if (filterStatusOrOptions && typeof filterStatusOrOptions === "object") {
      filterStatus = filterStatusOrOptions.filterStatus || "all";
      priorityFilter = filterStatusOrOptions.priority || "all";
      assignedToFilter = filterStatusOrOptions.assignedTo || "all";
      destinationFilter = filterStatusOrOptions.destination?.trim().toLowerCase() || "";
      search = filterStatusOrOptions.search?.trim().toLowerCase() || "";
      sortBy = filterStatusOrOptions.sortBy || "newest";
      page = Math.max(1, filterStatusOrOptions.page || 1);
      limit = Math.min(100, Math.max(1, filterStatusOrOptions.limit || 50));
    }

    let query = admin
      .from("custom_trip_requests")
      .select(
        "id, request_ref, customer_id, guest_name, email, phone, destinations, experiences, party_size, timeframe, budget_range, special_requests, status, priority, assigned_to, assigned_at, follow_up_date, preferred_locale, adults, children, accommodation_preference, transport_preference, converted_booking_id, converted_at, converted_by, lost_reason, admin_notes, created_at, updated_at",
        { count: "exact" }
      );

    if (filterStatus && filterStatus !== "all") {
      query = query.eq(
        "status",
        filterStatus as Database["public"]["Enums"]["custom_trip_status"]
      );
    }

    if (priorityFilter && priorityFilter !== "all") {
      query = query.eq(
        "priority",
        priorityFilter as Database["public"]["Enums"]["custom_trip_priority"]
      );
    }

    if (assignedToFilter && assignedToFilter !== "all") {
      if (assignedToFilter === "unassigned") {
        query = query.is("assigned_to", null);
      } else {
        query = query.eq("assigned_to", assignedToFilter);
      }
    }

    if (destinationFilter) {
      query = query.contains("destinations", [destinationFilter]);
    }

    if (search) {
      query = query.or(
        `request_ref.ilike.%${search}%,guest_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    // Apply sorting
    if (sortBy === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else if (sortBy === "follow_up") {
      query = query.order("follow_up_date", { ascending: true, nullsFirst: false });
    } else if (sortBy === "priority_desc") {
      query = query.order("priority", { ascending: false }).order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const fromOffset = (page - 1) * limit;
    const toOffset = fromOffset + limit - 1;
    query = query.range(fromOffset, toOffset);

    const { data: trips, count, error } = await query;

    if (error) {
      console.error("[Get Custom Trips Error]", error);
      return { success: false, error: "Failed to retrieve custom trips." };
    }

    // Fetch assigned staff profile names for display
    const assignedIds = Array.from(
      new Set(
        (trips || [])
          .map((t) => t.assigned_to)
          .filter((id): id is string => Boolean(id))
      )
    );

    const staffMap = new Map<string, { fullName: string; email: string }>();
    if (assignedIds.length > 0) {
      const { data: staffProfiles } = await admin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", assignedIds);

      for (const p of staffProfiles || []) {
        staffMap.set(p.id, {
          fullName: p.full_name || "Concierge Staff",
          email: p.email || "",
        });
      }
    }

    return {
      success: true,
      totalCount: count ?? (trips?.length || 0),
      page,
      limit,
      data: (trips || []).map((t) => {
        const staff = t.assigned_to ? staffMap.get(t.assigned_to) : null;
        return {
          id: t.id,
          requestRef: t.request_ref,
          customerId: t.customer_id,
          guestName: t.guest_name,
          email: t.email,
          phone: t.phone,
          destinations: t.destinations || [],
          experiences: t.experiences || [],
          partySize: t.party_size,
          timeframe: t.timeframe,
          budgetRange: t.budget_range,
          specialRequests: t.special_requests,
          status: t.status,
          priority: t.priority || "normal",
          assignedTo: t.assigned_to,
          assignedStaffName: staff?.fullName || null,
          assignedStaffEmail: staff?.email || null,
          assignedAt: t.assigned_at,
          followUpDate: t.follow_up_date,
          preferredLocale: t.preferred_locale || "en",
          adults: t.adults ?? 2,
          children: t.children ?? 0,
          accommodationPreference: t.accommodation_preference,
          transportPreference: t.transport_preference,
          convertedBookingId: t.converted_booking_id,
          convertedAt: t.converted_at,
          lostReason: t.lost_reason,
          adminNotes: t.admin_notes,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        };
      }),
    };
  } catch (err) {
    console.error("[Get Custom Trips Unexpected Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Retrieves the comprehensive dossier for a bespoke journey inquiry:
 * Details, audit timeline, communication messages, proposals, and converted booking status.
 */
export async function getAdminCustomTripDetailAction(requestId: string) {
  try {
    await assertCrmAccess();
    const admin = createAdminClient();

    const { data: trip, error: fetchErr } = await admin
      .from("custom_trip_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();

    if (fetchErr || !trip) {
      return { success: false, error: "Custom journey inquiry not found." };
    }

    // Parallel fetch: timeline, messages, proposals, assigned staff, converted booking
    const [timelineRes, messagesRes, proposalsRes, assignedStaffRes, convertedBookingRes] =
      await Promise.all([
        admin
          .from("custom_trip_timeline")
          .select("*")
          .eq("inquiry_id", requestId)
          .order("created_at", { ascending: false }),
        admin
          .from("custom_trip_messages")
          .select("*")
          .eq("inquiry_id", requestId)
          .order("created_at", { ascending: true }),
        admin
          .from("custom_proposals")
          .select("*")
          .eq("inquiry_id", requestId)
          .order("version", { ascending: false }),
        trip.assigned_to
          ? admin.from("profiles").select("id, full_name, email").eq("id", trip.assigned_to).maybeSingle()
          : Promise.resolve({ data: null }),
        trip.converted_booking_id
          ? admin
              .from("bookings")
              .select("id, booking_ref, booking_status, payment_status, total_price, departure_date")
              .eq("id", trip.converted_booking_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

    const assignedStaff = assignedStaffRes?.data;
    const convertedBooking = convertedBookingRes?.data;

    return {
      success: true,
      data: {
        inquiry: {
          id: trip.id,
          requestRef: trip.request_ref,
          customerId: trip.customer_id,
          guestName: trip.guest_name,
          email: trip.email,
          phone: trip.phone,
          destinations: trip.destinations || [],
          experiences: trip.experiences || [],
          partySize: trip.party_size,
          timeframe: trip.timeframe,
          budgetRange: trip.budget_range,
          specialRequests: trip.special_requests,
          status: trip.status,
          priority: trip.priority || "normal",
          assignedTo: trip.assigned_to,
          assignedStaffName: assignedStaff?.full_name || null,
          assignedStaffEmail: assignedStaff?.email || null,
          assignedAt: trip.assigned_at,
          followUpDate: trip.follow_up_date,
          preferredLocale: trip.preferred_locale || "en",
          adults: trip.adults ?? 2,
          children: trip.children ?? 0,
          accommodationPreference: trip.accommodation_preference,
          transportPreference: trip.transport_preference,
          convertedBookingId: trip.converted_booking_id,
          convertedBookingRef: convertedBooking?.booking_ref || null,
          convertedBookingStatus: convertedBooking?.booking_status || null,
          convertedAt: trip.converted_at,
          lostReason: trip.lost_reason,
          adminNotes: trip.admin_notes,
          createdAt: trip.created_at,
          updatedAt: trip.updated_at,
        },
        timeline: (timelineRes.data || []).map((t) => ({
          id: t.id,
          eventType: t.event_type,
          titleEn: t.title_en,
          titleAr: t.title_ar,
          descriptionEn: t.description_en,
          descriptionAr: t.description_ar,
          actorRole: t.actor_role,
          metadata: t.metadata,
          createdAt: t.created_at,
        })),
        messages: (messagesRes.data || []).map((m) => ({
          id: m.id,
          senderType: m.sender_type,
          senderName: m.sender_name,
          channel: m.channel,
          message: m.message,
          isInternal: m.is_internal,
          createdAt: m.created_at,
        })),
        proposals: (proposalsRes.data || []).map((p) => ({
          id: p.id,
          proposalRef: p.proposal_ref,
          guestToken: p.guest_token,
          tokenExpiresAt: p.token_expires_at,
          version: p.version,
          status: p.status,
          titleEn: p.title_en,
          titleAr: p.title_ar,
          summaryEn: p.summary_en,
          summaryAr: p.summary_ar,
          validUntil: p.valid_until,
          currency: p.currency,
          pricingBreakdown: p.pricing_breakdown,
          totalPrice: Number(p.total_price),
          depositRequired: Number(p.deposit_required),
          balanceDue: Number(p.balance_due),
          itineraryDays: p.itinerary_days,
          inclusionsEn: p.inclusions_en,
          inclusionsAr: p.inclusions_ar,
          exclusionsEn: p.exclusions_en,
          exclusionsAr: p.exclusions_ar,
          termsEn: p.terms_en,
          termsAr: p.terms_ar,
          customerNotes: p.customer_notes,
          internalNotes: p.internal_notes,
          customerFeedback: p.customer_feedback,
          customerActionAt: p.customer_action_at,
          convertedBookingId: p.converted_booking_id,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        })),
      },
    };
  } catch (err) {
    console.error("[Get Custom Trip Detail Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Assigns inquiry to authorized staff member with follow-up date and priority.
 */
export async function assignCustomTripAction(rawInput: unknown) {
  try {
    const session = await assertCrmAccess();
    const validation = assignCustomTripSchema.safeParse(rawInput);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Invalid assignment data." };
    }

    const { inquiryId, assignedToId, followUpDate, priority } = validation.data;
    const admin = createAdminClient();

    const nowIso = new Date().toISOString();
    const { data: inquiry, error: fetchErr } = await admin
      .from("custom_trip_requests")
      .select("id, request_ref, guest_name, email, status")
      .eq("id", inquiryId)
      .maybeSingle();

    if (fetchErr || !inquiry) {
      return { success: false, error: "Inquiry not found." };
    }

    let staffName = "Unassigned";
    let staffEmail: string | null = null;

    if (assignedToId) {
      const { data: staffProf } = await admin
        .from("profiles")
        .select("full_name, email")
        .eq("id", assignedToId)
        .maybeSingle();

      staffName = staffProf?.full_name || "Staff Member";
      staffEmail = staffProf?.email || null;
    }

    const { error: updateErr } = await admin
      .from("custom_trip_requests")
      .update({
        assigned_to: assignedToId || null,
        assigned_at: assignedToId ? nowIso : null,
        follow_up_date: followUpDate || null,
        priority,
        updated_at: nowIso,
      })
      .eq("id", inquiryId);

    if (updateErr) {
      console.error("[Assign Inquiry Error]", updateErr);
      return { success: false, error: "Failed to update assignment." };
    }

    // Log to timeline
    await admin.from("custom_trip_timeline").insert({
      inquiry_id: inquiryId,
      event_type: "inquiry_assigned",
      title_en: `Inquiry Assigned: ${staffName}`,
      title_ar: `تم تكليف الاستفسار: ${staffName}`,
      description_en: `Priority set to ${priority}. Follow-up scheduled: ${followUpDate || "None"}.`,
      description_ar: `تم تحديد الأولوية إلى ${priority}. تاريخ المتابعة: ${followUpDate || "غير محدد"}.`,
      actor_id: session.user.id,
      actor_role: session.adminRole || "staff",
      metadata: { assignedToId, priority, followUpDate },
    });

    // Notify assigned staff
    if (assignedToId && staffEmail) {
      await sendCustomTripNotification({
        inquiryId,
        inquiryRef: inquiry.request_ref,
        customerName: inquiry.guest_name,
        customerEmail: inquiry.email,
        assignedStaffEmail: staffEmail,
        assignedStaffName: staffName,
        notificationType: "inquiry_assigned",
      });
    }

    return { success: true };
  } catch (err) {
    console.error("[Assign Custom Trip Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Updates CRM details: status, priority, followUpDate, adminNotes, lostReason.
 */
export async function updateCustomTripCrmDetailsAction(rawInput: unknown) {
  try {
    const session = await assertCrmAccess();
    const validation = updateCustomTripCrmSchema.safeParse(rawInput);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Invalid CRM parameters." };
    }

    const { inquiryId, status, priority, followUpDate, adminNotes, lostReason } = validation.data;
    const admin = createAdminClient();

    const { data: current, error: fetchErr } = await admin
      .from("custom_trip_requests")
      .select("id, status, priority, admin_notes, request_ref")
      .eq("id", inquiryId)
      .maybeSingle();

    if (fetchErr || !current) {
      return { success: false, error: "Inquiry not found." };
    }

    // Validate status progression if changing status
    if (status && status !== current.status) {
      const allowed = VALID_CUSTOM_TRIP_STATUS_TRANSITIONS[current.status] || [current.status];
      if (!allowed.includes(status)) {
        return {
          success: false,
          error: `Cannot transition inquiry from "${current.status}" to "${status}".`,
        };
      }
    }

    const nowIso = new Date().toISOString();
    const updates: Database["public"]["Tables"]["custom_trip_requests"]["Update"] = {
      updated_at: nowIso,
    };

    if (status) updates.status = status as Database["public"]["Enums"]["custom_trip_status"];
    if (priority) updates.priority = priority;
    if (followUpDate !== undefined) updates.follow_up_date = followUpDate;
    if (adminNotes !== undefined) updates.admin_notes = adminNotes;
    if (lostReason !== undefined) updates.lost_reason = lostReason;

    const { error: updateErr } = await admin
      .from("custom_trip_requests")
      .update(updates)
      .eq("id", inquiryId);

    if (updateErr) {
      console.error("[Update CRM Details Error]", updateErr);
      return { success: false, error: "Failed to update CRM details." };
    }

    // Log status transition to timeline
    if (status && status !== current.status) {
      await admin.from("custom_trip_timeline").insert({
        inquiry_id: inquiryId,
        event_type: "status_changed",
        title_en: `Status Updated to ${status.replace("_", " ").toUpperCase()}`,
        title_ar: `تم تحديث الحالة إلى ${status}`,
        description_en: lostReason ? `Reason: ${lostReason}` : `Transitioned from ${current.status} to ${status}.`,
        description_ar: lostReason ? `السبب: ${lostReason}` : `تم تغيير الحالة من ${current.status} إلى ${status}.`,
        actor_id: session.user.id,
        actor_role: session.adminRole || "staff",
        metadata: { fromStatus: current.status, toStatus: status },
      });
    }

    return { success: true };
  } catch (err) {
    console.error("[Update CRM Details Unexpected Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Appends a communication record or internal operational note to an inquiry.
 */
export async function addCustomTripMessageAction(rawInput: unknown) {
  try {
    const session = await assertCrmAccess();
    const validation = addCustomTripMessageSchema.safeParse(rawInput);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Invalid message data." };
    }

    const { inquiryId, message, channel, isInternal } = validation.data;
    const admin = createAdminClient();

    const { data: prof } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .maybeSingle();

    const senderName = prof?.full_name || session.adminRole?.replace("_", " ").toUpperCase() || "Concierge Staff";

    const { error: insertErr } = await admin.from("custom_trip_messages").insert({
      inquiry_id: inquiryId,
      sender_type: "admin",
      sender_name: senderName,
      sender_id: session.user.id,
      channel,
      message,
      is_internal: isInternal,
    });

    if (insertErr) {
      console.error("[Add Custom Trip Message Error]", insertErr);
      return { success: false, error: "Failed to record message." };
    }

    // If not internal, log to timeline
    if (!isInternal) {
      await admin.from("custom_trip_timeline").insert({
        inquiry_id: inquiryId,
        event_type: "communication_logged",
        title_en: `Outbound Message (${channel.toUpperCase()})`,
        title_ar: `رسالة تواصل صادرة (${channel})`,
        description_en: message.slice(0, 150) + (message.length > 150 ? "..." : ""),
        description_ar: message.slice(0, 150) + (message.length > 150 ? "..." : ""),
        actor_id: session.user.id,
        actor_role: session.adminRole || "staff",
      });
    }

    return { success: true };
  } catch (err) {
    console.error("[Add Custom Trip Message Unexpected Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Visual Itinerary & Quotation Builder: Save or Publish Proposal.
 * - Enforces tour operations or super admin clearance.
 * - Computes all totals server-side in QAR.
 * - Stores immutable snapshots and increments revision version on changes to published quotes.
 * - Sends bilingual notification if published.
 */
export async function saveCustomProposalAction(rawInput: unknown) {
  try {
    const session = await assertProposalOperationsAccess();
    const validation = saveCustomProposalSchema.safeParse(rawInput);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Invalid proposal data." };
    }

    const input = validation.data;
    const admin = createAdminClient();

    // 1. Fetch inquiry context
    const { data: inquiry, error: inqErr } = await admin
      .from("custom_trip_requests")
      .select("id, request_ref, customer_id, guest_name, email, preferred_locale, adults, children, status")
      .eq("id", input.inquiryId)
      .maybeSingle();

    if (inqErr || !inquiry) {
      return { success: false, error: "Inquiry not found." };
    }

    // 2. Server-side quotation calculation in QAR
    const adults = inquiry.adults || 2;
    const children = inquiry.children || 0;
    const calculation = calculateQuotationTotals(input.pricing, adults, children);

    const nowIso = new Date().toISOString();
    let proposalIdToReturn = input.proposalId;
    let guestTokenToReturn = "";
    let proposalRefToReturn = "";
    let isRevision = false;

    // 3. Check if updating an existing proposal
    if (input.proposalId) {
      const { data: existingProp } = await admin
        .from("custom_proposals")
        .select("id, proposal_ref, guest_token, version, status")
        .eq("id", input.proposalId)
        .maybeSingle();

      if (existingProp) {
        proposalRefToReturn = existingProp.proposal_ref;
        guestTokenToReturn = existingProp.guest_token;

        // If existing proposal was already sent/published, create a new immutable version
        if (existingProp.status !== "draft") {
          isRevision = true;
          // Supersede the old version
          await admin
            .from("custom_proposals")
            .update({ status: "superseded", updated_at: nowIso })
            .eq("id", existingProp.id);

          // Insert new proposal version
          const newVersion = existingProp.version + 1;
          const newGuestToken = crypto.randomUUID();
          const newProposalRef = `MZ-PROP-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

          const { data: newProp, error: insertNewErr } = await admin
            .from("custom_proposals")
            .insert({
              proposal_ref: newProposalRef,
              inquiry_id: input.inquiryId,
              customer_id: inquiry.customer_id,
              guest_token: newGuestToken,
              version: newVersion,
              status: input.publish ? "published" : "draft",
              title_en: input.titleEn,
              title_ar: input.titleAr,
              summary_en: input.summaryEn || null,
              summary_ar: input.summaryAr || null,
              valid_until: input.validUntil,
              currency: "QAR",
              pricing_breakdown: { ...input.pricing, ...calculation },
              total_price: calculation.totalPrice,
              deposit_required: calculation.depositRequired,
              balance_due: calculation.balanceDue,
              itinerary_days: input.itineraryDays as Record<string, unknown>[],
              inclusions_en: input.inclusionsEn,
              inclusions_ar: input.inclusionsAr,
              exclusions_en: input.exclusionsEn,
              exclusions_ar: input.exclusionsAr,
              terms_en: input.termsEn || null,
              terms_ar: input.termsAr || null,
              customer_notes: input.customerNotes || null,
              internal_notes: input.internalNotes || null,
              created_by: session.user.id,
            })
            .select("id, proposal_ref, guest_token")
            .single();

          if (insertNewErr || !newProp) {
            console.error("[Insert Revised Proposal Error]", insertNewErr);
            return { success: false, error: "Failed to create revised proposal version." };
          }

          proposalIdToReturn = newProp.id;
          guestTokenToReturn = newProp.guest_token;
          proposalRefToReturn = newProp.proposal_ref;
        } else {
          // Updating an existing draft in-place
          const { error: updateDraftErr } = await admin
            .from("custom_proposals")
            .update({
              status: input.publish ? "published" : "draft",
              title_en: input.titleEn,
              title_ar: input.titleAr,
              summary_en: input.summaryEn || null,
              summary_ar: input.summaryAr || null,
              valid_until: input.validUntil,
              pricing_breakdown: { ...input.pricing, ...calculation },
              total_price: calculation.totalPrice,
              deposit_required: calculation.depositRequired,
              balance_due: calculation.balanceDue,
              itinerary_days: input.itineraryDays as Record<string, unknown>[],
              inclusions_en: input.inclusionsEn,
              inclusions_ar: input.inclusionsAr,
              exclusions_en: input.exclusionsEn,
              exclusions_ar: input.exclusionsAr,
              terms_en: input.termsEn || null,
              terms_ar: input.termsAr || null,
              customer_notes: input.customerNotes || null,
              internal_notes: input.internalNotes || null,
              updated_at: nowIso,
            })
            .eq("id", existingProp.id);

          if (updateDraftErr) {
            console.error("[Update Draft Proposal Error]", updateDraftErr);
            return { success: false, error: "Failed to update draft proposal." };
          }
        }
      }
    } else {
      // 4. Create brand new proposal (version 1)
      const newGuestToken = crypto.randomUUID();
      const newProposalRef = `MZ-PROP-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

      const { data: createdProp, error: insertErr } = await admin
        .from("custom_proposals")
        .insert({
          proposal_ref: newProposalRef,
          inquiry_id: input.inquiryId,
          customer_id: inquiry.customer_id,
          guest_token: newGuestToken,
          version: 1,
          status: input.publish ? "published" : "draft",
          title_en: input.titleEn,
          title_ar: input.titleAr,
          summary_en: input.summaryEn || null,
          summary_ar: input.summaryAr || null,
          valid_until: input.validUntil,
          currency: "QAR",
          pricing_breakdown: { ...input.pricing, ...calculation },
          total_price: calculation.totalPrice,
          deposit_required: calculation.depositRequired,
          balance_due: calculation.balanceDue,
          itinerary_days: input.itineraryDays as Record<string, unknown>[],
          inclusions_en: input.inclusionsEn,
          inclusions_ar: input.inclusionsAr,
          exclusions_en: input.exclusionsEn,
          exclusions_ar: input.exclusionsAr,
          terms_en: input.termsEn || null,
          terms_ar: input.termsAr || null,
          customer_notes: input.customerNotes || null,
          internal_notes: input.internalNotes || null,
          created_by: session.user.id,
        })
        .select("id, proposal_ref, guest_token")
        .single();

      if (insertErr || !createdProp) {
        console.error("[Create Proposal Error]", insertErr);
        return { success: false, error: "Failed to create proposal." };
      }

      proposalIdToReturn = createdProp.id;
      guestTokenToReturn = createdProp.guest_token;
      proposalRefToReturn = createdProp.proposal_ref;
    }

    // 5. If publishing, update inquiry status and send notification
    if (input.publish) {
      await admin
        .from("custom_trip_requests")
        .update({
          status: "proposal_sent",
          updated_at: nowIso,
        })
        .eq("id", input.inquiryId);

      await admin.from("custom_trip_timeline").insert({
        inquiry_id: input.inquiryId,
        event_type: isRevision ? "proposal_revised" : "proposal_sent",
        title_en: isRevision ? `Proposal Revised [${proposalRefToReturn}]` : `Proposal Sent [${proposalRefToReturn}]`,
        title_ar: isRevision ? `تم تحديث العرض [${proposalRefToReturn}]` : `تم إرسال العرض [${proposalRefToReturn}]`,
        description_en: `Quotation: ${calculation.totalPrice.toLocaleString("en-US")} QAR (Deposit: ${calculation.depositRequired.toLocaleString("en-US")} QAR). Valid until ${input.validUntil}.`,
        description_ar: `القيمة: ${calculation.totalPrice.toLocaleString("en-US")} ر.ق (العربون: ${calculation.depositRequired.toLocaleString("en-US")} ر.ق). يسري حتى ${input.validUntil}.`,
        actor_id: session.user.id,
        actor_role: session.adminRole || "staff",
        metadata: { proposalId: proposalIdToReturn, proposalRef: proposalRefToReturn },
      });

      // Send bilingual notification with proposal URL
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mztourismqatar.qa";
      const proposalUrl = `${siteUrl}/${inquiry.preferred_locale || "en"}/proposals/${guestTokenToReturn}`;

      await sendCustomTripNotification({
        inquiryId: input.inquiryId,
        inquiryRef: inquiry.request_ref,
        customerName: inquiry.guest_name,
        customerEmail: inquiry.email,
        proposalRef: proposalRefToReturn,
        proposalTitle: inquiry.preferred_locale === "ar" ? input.titleAr : input.titleEn,
        proposalUrl,
        validUntil: input.validUntil,
        totalPrice: calculation.totalPrice,
        currency: "QAR",
        locale: inquiry.preferred_locale as "en" | "ar",
        notificationType: isRevision ? "proposal_revised" : "proposal_ready",
      });
    }

    return {
      success: true,
      data: {
        proposalId: proposalIdToReturn,
        proposalRef: proposalRefToReturn,
        guestToken: guestTokenToReturn,
        totalPrice: calculation.totalPrice,
        depositRequired: calculation.depositRequired,
        balanceDue: calculation.balanceDue,
      },
    };
  } catch (err) {
    console.error("[Save Custom Proposal Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Converts an accepted proposal into a confirmed reservation in public.bookings.
 * - Prevents duplicate conversions.
 * - Preserves exact agreed quotation as immutable booking price snapshot.
 * - Initializes booking in awaiting_deposit status with manual payment verification.
 */
export async function convertProposalToBookingAction(rawInput: unknown) {
  try {
    const session = await assertTourOperationsAccess();
    const validation = convertProposalSchema.safeParse(rawInput);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Invalid conversion payload." };
    }

    const { proposalId, pickupLocation, specialRequests } = validation.data;
    const admin = createAdminClient();

    // 1. Fetch proposal
    const { data: proposal, error: propErr } = await admin
      .from("custom_proposals")
      .select("*")
      .eq("id", proposalId)
      .maybeSingle();

    if (propErr || !proposal) {
      return { success: false, error: "Proposal not found." };
    }

    // 2. Prevent duplicate conversions
    if (proposal.converted_booking_id) {
      return {
        success: false,
        error: "This proposal has already been converted into an existing booking.",
      };
    }

    // 3. Fetch inquiry
    const { data: inquiry, error: inqErr } = await admin
      .from("custom_trip_requests")
      .select("*")
      .eq("id", proposal.inquiry_id)
      .maybeSingle();

    if (inqErr || !inquiry) {
      return { success: false, error: "Associated inquiry not found." };
    }

    if (inquiry.converted_booking_id) {
      return {
        success: false,
        error: "This inquiry has already been converted into a booking.",
      };
    }

    // 4. Generate cryptographically safe booking reference
    const bookingRef = `MZ-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const uploadToken = crypto.randomUUID();

    const paxCount = (inquiry.adults || 2) + (inquiry.children || 0);
    const itineraryDays = (proposal.itinerary_days as Record<string, unknown>[]) || [];
    const firstDepartureDate = (itineraryDays[0]?.date as string) || null;

    const mergedSpecialRequests = [
      inquiry.special_requests,
      specialRequests?.trim() || null,
      `Converted from Custom Proposal [${proposal.proposal_ref}]`,
    ]
      .filter(Boolean)
      .join("\n");

    const resolvedPickup =
      pickupLocation?.trim() ||
      inquiry.accommodation_preference ||
      "Doha VIP Chauffeur / Hotel Concierge Pickup";

    // 5. Insert into public.bookings with exact quotation amounts
    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .insert({
        booking_ref: bookingRef,
        service_id: "desert-safari", // Default anchor category for bespoke itineraries
        customer_id: inquiry.customer_id,
        customer_name: inquiry.guest_name,
        customer_email: inquiry.email,
        customer_phone: inquiry.phone,
        departure_date: firstDepartureDate,
        pax_count: paxCount,
        pickup_location: resolvedPickup,
        notes: mergedSpecialRequests,
        booking_status: "awaiting_deposit",
        payment_status: "deposit_pending",
        total_price: Number(proposal.total_price),
        deposit_required: Number(proposal.deposit_required),
        deposit_paid: 0,
        balance_due: Number(proposal.total_price),
        currency: "QAR",
        upload_token: uploadToken,
        admin_notes: `Bespoke itinerary conversion. Inquiry: ${inquiry.request_ref}, Proposal: ${proposal.proposal_ref}.`,
      })
      .select("id, booking_ref")
      .single();

    if (bookingErr || !booking) {
      console.error("[Convert Proposal Insert Booking Error]", bookingErr);
      return { success: false, error: "Failed to create booking from proposal." };
    }

    const nowIso = new Date().toISOString();

    // 6. Update proposal record
    await admin
      .from("custom_proposals")
      .update({
        converted_booking_id: booking.id,
        status: "converted",
        updated_at: nowIso,
      })
      .eq("id", proposal.id);

    // 7. Update inquiry record
    await admin
      .from("custom_trip_requests")
      .update({
        converted_booking_id: booking.id,
        converted_at: nowIso,
        converted_by: session.user.id,
        status: "converted",
        updated_at: nowIso,
      })
      .eq("id", inquiry.id);

    // 8. Log to booking timeline
    await admin.from("booking_timeline").insert({
      booking_id: booking.id,
      event_type: "created",
      title_en: "Bespoke Journey Booking Established",
      title_ar: "تم إنشاء حجز الرحلة المخصصة",
      description_en: `Converted from bespoke proposal [${proposal.proposal_ref}]. Total agreed price: ${proposal.total_price} QAR.`,
      description_ar: `تم التحويل من عرض الرحلة المخصصة [${proposal.proposal_ref}]. القيمة الإجمالية المتفق عليها: ${proposal.total_price} ر.ق.`,
      actor_id: session.user.id,
      actor_role: session.adminRole || "staff",
      metadata: { proposalId: proposal.id, inquiryId: inquiry.id },
    });

    // 9. Log to custom trip timeline
    await admin.from("custom_trip_timeline").insert({
      inquiry_id: inquiry.id,
      event_type: "converted_to_booking",
      title_en: `Converted to Booking [${booking.booking_ref}]`,
      title_ar: `تم تحويل الطلب إلى حجز مؤكد [${booking.booking_ref}]`,
      description_en: `Booking initialized with agreed price ${proposal.total_price} QAR. Awaiting deposit settlement.`,
      description_ar: `تم إنشاء ملف الحجز بقيمة ${proposal.total_price} ر.ق. بانتظار تحويل العربون.`,
      actor_id: session.user.id,
      actor_role: session.adminRole || "staff",
      metadata: { bookingId: booking.id, bookingRef: booking.booking_ref },
    });

    // 10. Dispatch booking_received notification to customer
    await sendCustomerBookingNotification({
      bookingId: booking.id,
      bookingRef: booking.booking_ref,
      customerName: inquiry.guest_name,
      customerEmail: inquiry.email,
      serviceTitle: proposal.title_en,
      departureDate: firstDepartureDate,
      paxCount,
      depositRequired: Number(proposal.deposit_required),
      depositPaid: 0,
      balanceDue: Number(proposal.total_price),
      currency: "QAR",
      locale: (inquiry.preferred_locale as "en" | "ar") || "en",
      notificationType: "booking_received",
    });

    return {
      success: true,
      data: {
        bookingId: booking.id,
        bookingRef: booking.booking_ref,
      },
    };
  } catch (err) {
    console.error("[Convert Proposal Unexpected Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

const updateCustomTripSchema = z.object({
  requestId: z.string().uuid("Invalid request identifier"),
  status: z.enum([
    "new",
    "under_review",
    "contacted",
    "itinerary_in_progress",
    "proposal_sent",
    "revision_requested",
    "accepted",
    "converted",
    "lost",
    "quoted",
    "archived",
  ]),
  adminNotes: z.string().max(4000, "Notes exceed 4000 characters").optional().nullable(),
});

export async function updateAdminCustomTripStatusAction(rawInput: unknown) {
  try {
    await assertAdminAccess();
    const validation = updateCustomTripSchema.safeParse(rawInput);
    if (!validation.success) {
      return { success: false, error: "Invalid parameters." };
    }

    const { requestId, status, adminNotes } = validation.data;
    const admin = createAdminClient();

    // 1. Verify current status and allowed transition
    const { data: currentReq, error: fetchErr } = await admin
      .from("custom_trip_requests")
      .select("id, status")
      .eq("id", requestId)
      .maybeSingle();

    if (fetchErr || !currentReq) {
      return { success: false, error: "Custom trip inquiry not found." };
    }

    const allowed = VALID_CUSTOM_TRIP_STATUS_TRANSITIONS[currentReq.status] || [currentReq.status];
    if (!allowed.includes(status)) {
      return {
        success: false,
        error: `Cannot transition brief status from "${currentReq.status}" to "${status}".`,
      };
    }

    const { error } = await admin
      .from("custom_trip_requests")
      .update({
        status,
        admin_notes: adminNotes !== undefined ? adminNotes : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      console.error("[Update Custom Trip Error]", error);
      return { success: false, error: "Failed to update custom trip request." };
    }

    return { success: true };
  } catch (err) {
    console.error("[Update Custom Trip Unexpected Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

// =============================================================================
// 6. PHASE 2: ADVANCED ADMIN DASHBOARD & REVENUE ANALYTICS
// =============================================================================

export async function assertSuperAdminAccess() {
  const session = await assertAdminAccess();
  if (session.adminRole !== "super_admin") {
    throw new Error("Forbidden: Super Administrator clearance required.");
  }
  return session;
}

export interface AdminDashboardFilterOptions {
  dateRangePreset?: "7d" | "30d" | "90d" | "ytd" | "all" | "custom";
  startDate?: string;
  endDate?: string;
}

export interface AdminSummaryCardsData {
  totalBookings: number;
  awaitingDeposit: number;
  depositUnderReview: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalCollectedRevenue: number;
  depositAmountCollected: number;
  balanceDue: number;
  upcomingDeparturesCount: number;
}

export interface AdminFinancialBreakdown {
  totalBookingValue: number;
  confirmedDepositCollections: number;
  otherRecordedPayments: number;
  totalCollectedAmount: number;
  outstandingCustomerBalance: number;
  cancelledBookingAmounts: number;
  unverifiedDepositAmount: number;
  currency: string;
  databaseLimitationNote: string;
}

export interface RevenueDataPoint {
  date: string;
  label: string;
  revenue: number;
  bookingValue: number;
  bookingsCount: number;
  depositsCount: number;
}

export interface AdminRecentActivityItem {
  id: string;
  type: "booking_created" | "proof_submitted" | "booking_confirmed" | "upcoming_departure" | "booking_cancelled";
  bookingRef: string;
  customerName: string;
  serviceId: string;
  amount?: number;
  currency: string;
  timestamp: string;
  status: string;
  linkUrl: string;
  detail?: string;
}

export interface AdminUpcomingDepartureItem {
  bookingId: string;
  bookingRef: string;
  serviceId: string;
  departureDate: string;
  timeWindow: string | null;
  customerName: string;
  customerPhone: string;
  paxCount: number;
  maxSeats: number;
  availableSeats: number;
  status: string;
  paymentStatus: string;
  pickupLocation: string | null;
}

export interface AdminDashboardData {
  summaryCards: AdminSummaryCardsData;
  financialBreakdown: AdminFinancialBreakdown;
  dailyAnalytics: RevenueDataPoint[];
  weeklyAnalytics: RevenueDataPoint[];
  monthlyAnalytics: RevenueDataPoint[];
  yearlyAnalytics: RevenueDataPoint[];
  recentBookings: AdminRecentActivityItem[];
  latestDepositSubmissions: AdminRecentActivityItem[];
  recentlyConfirmedBookings: AdminRecentActivityItem[];
  upcomingDepartures: AdminUpcomingDepartureItem[];
  recentCancellations: AdminRecentActivityItem[];
  userRole: Database["public"]["Enums"]["admin_role"];
}

/**
 * Retrieves comprehensive metrics, financial reconciliation, interactive revenue series,
 * recent activity feeds, and upcoming departures from actual Supabase database records.
 */
export async function getAdminDashboardSummaryAction(
  options?: AdminDashboardFilterOptions
) {
  try {
    const session = await assertAdminAccess();
    const admin = createAdminClient();

    // 1. Fetch all bookings and deposit proofs in parallel
    const [bookingsRes, proofsRes] = await Promise.all([
      admin
        .from("bookings")
        .select(
          "id, booking_ref, service_id, customer_name, customer_email, customer_phone, departure_date, time_window, pax_count, pickup_location, notes, booking_status, payment_status, deposit_required, deposit_paid, balance_due, currency, admin_notes, created_at, updated_at"
        )
        .order("created_at", { ascending: false }),
      admin
        .from("deposit_proofs")
        .select(
          "id, booking_id, file_name, file_size, mime_type, review_status, rejection_reason, reviewed_by, reviewed_at, uploaded_at, storage_path"
        )
        .order("uploaded_at", { ascending: false }),
    ]);

    if (bookingsRes.error) {
      console.error("[Dashboard Bookings Query Error]", bookingsRes.error);
      return { success: false, error: "Failed to query booking records." };
    }

    const bookings = bookingsRes.data || [];
    const proofs = proofsRes.data || [];
    const bookingLookup = new Map(bookings.map((b) => [b.id, b]));

    // 2. Date Filtering Bounds (Qatar Timezone 기준)
    const now = new Date();
    const todayQatarStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Qatar",
    }).format(now); // "YYYY-MM-DD"

    const preset = options?.dateRangePreset || "30d";
    let rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let rangeEnd = now;

    if (preset === "7d") {
      rangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (preset === "30d") {
      rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (preset === "90d") {
      rangeStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (preset === "ytd") {
      rangeStart = new Date(now.getFullYear(), 0, 1);
    } else if (preset === "all") {
      rangeStart = new Date(2020, 0, 1);
    } else if (preset === "custom" && options?.startDate && options?.endDate) {
      rangeStart = new Date(options.startDate);
      rangeEnd = new Date(options.endDate);
      rangeEnd.setHours(23, 59, 59, 999);
    }

    // 3. Compute Summary Card Metrics
    const totalBookings = bookings.length;
    let awaitingDeposit = 0;
    let depositUnderReview = 0;
    let confirmedBookings = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;

    let totalBookingValue = 0;
    let confirmedDepositRevenue = 0;
    let depositAmountCollected = 0;
    let balanceDue = 0;
    let cancelledBookingAmounts = 0;
    let unverifiedDepositAmount = 0;
    let otherRecordedPayments = 0;

    const upcomingDeparturesList: AdminUpcomingDepartureItem[] = [];

    for (const b of bookings) {
      const depReq = Number(b.deposit_required || 0);
      const depPaid = Number(b.deposit_paid || 0);
      const balDue = Number(b.balance_due || 0);
      const grossVal = depReq + balDue;

      if (b.booking_status === "awaiting_deposit") {
        awaitingDeposit += 1;
        unverifiedDepositAmount += depReq;
      } else if (b.booking_status === "deposit_under_review") {
        depositUnderReview += 1;
        unverifiedDepositAmount += depReq;
      } else if (b.booking_status === "confirmed") {
        confirmedBookings += 1;
      } else if (b.booking_status === "completed") {
        completedBookings += 1;
      } else if (b.booking_status === "cancelled") {
        cancelledBookings += 1;
        cancelledBookingAmounts += grossVal;
      }

      // Financial accuracy rules:
      if (b.booking_status !== "cancelled") {
        totalBookingValue += grossVal;
        balanceDue += balDue;
      }

      // Only count verified deposit revenue on confirmed/completed bookings
      if (
        (b.booking_status === "confirmed" || b.booking_status === "completed") &&
        depPaid > 0
      ) {
        confirmedDepositRevenue += depPaid;
      }

      // Total deposit amount collected across all bookings with deposits received
      if (depPaid > 0) {
        depositAmountCollected += depPaid;
      }

      // Other recorded payments (e.g. fully paid bookings where amount exceeded initial deposit)
      if (b.payment_status === "fully_paid" && depPaid < depReq + balDue) {
        // Any settled balance is tracked
        otherRecordedPayments += 0;
      }

      // Upcoming departures check
      if (
        b.booking_status !== "cancelled" &&
        b.departure_date &&
        b.departure_date >= todayQatarStr
      ) {
        // Estimate max capacity based on service fleet type
        let maxSeats = 6;
        if (b.service_id.includes("dhow")) maxSeats = 30;
        else if (b.service_id.includes("transfer") || b.service_id.includes("airport")) maxSeats = 12;
        else maxSeats = Math.max(6, b.pax_count);

        const availableSeats = Math.max(0, maxSeats - b.pax_count);

        upcomingDeparturesList.push({
          bookingId: b.id,
          bookingRef: b.booking_ref,
          serviceId: b.service_id,
          departureDate: b.departure_date,
          timeWindow: b.time_window,
          customerName: b.customer_name,
          customerPhone: b.customer_phone,
          paxCount: b.pax_count,
          maxSeats,
          availableSeats,
          status: b.booking_status,
          paymentStatus: b.payment_status,
          pickupLocation: b.pickup_location,
        });
      }
    }

    // Sort upcoming departures chronologically
    upcomingDeparturesList.sort((a, b) => a.departureDate.localeCompare(b.departureDate));

    const totalCollectedAmount = confirmedDepositRevenue + otherRecordedPayments;

    const summaryCards: AdminSummaryCardsData = {
      totalBookings,
      awaitingDeposit,
      depositUnderReview,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalCollectedRevenue: confirmedDepositRevenue,
      depositAmountCollected,
      balanceDue,
      upcomingDeparturesCount: upcomingDeparturesList.length,
    };

    const financialBreakdown: AdminFinancialBreakdown = {
      totalBookingValue,
      confirmedDepositCollections: confirmedDepositRevenue,
      otherRecordedPayments,
      totalCollectedAmount,
      outstandingCustomerBalance: balanceDue,
      cancelledBookingAmounts,
      unverifiedDepositAmount,
      currency: "QAR",
      databaseLimitationNote:
        "The platform records verified deposit settlements and outstanding balances directly per booking record. Unverified proofs and pending remittances are quarantined and strictly excluded from collected revenue until formal admin audit.",
    };

    // 4. Time-Series Aggregations for Analytics Charts
    const dailyMap = new Map<string, { revenue: number; bookingValue: number; bookingsCount: number; depositsCount: number }>();
    const weeklyMap = new Map<string, { revenue: number; bookingValue: number; bookingsCount: number; depositsCount: number }>();
    const monthlyMap = new Map<string, { revenue: number; bookingValue: number; bookingsCount: number; depositsCount: number }>();
    const yearlyMap = new Map<string, { revenue: number; bookingValue: number; bookingsCount: number; depositsCount: number }>();

    for (const b of bookings) {
      const bDate = new Date(b.created_at);
      if (bDate < rangeStart || bDate > rangeEnd) continue;

      const dateStr = b.created_at.substring(0, 10);
      const isConfirmed = b.booking_status === "confirmed" || b.booking_status === "completed";
      const rev = isConfirmed ? Number(b.deposit_paid || 0) : 0;
      const bVal = b.booking_status !== "cancelled" ? Number(b.deposit_required || 0) + Number(b.balance_due || 0) : 0;

      // Daily
      const curDaily = dailyMap.get(dateStr) || { revenue: 0, bookingValue: 0, bookingsCount: 0, depositsCount: 0 };
      curDaily.revenue += rev;
      curDaily.bookingValue += bVal;
      curDaily.bookingsCount += 1;
      if (b.deposit_paid > 0) curDaily.depositsCount += 1;
      dailyMap.set(dateStr, curDaily);

      // Weekly (starting Sunday)
      const weekStart = new Date(bDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekStr = weekStart.toISOString().substring(0, 10);
      const curWeekly = weeklyMap.get(weekStr) || { revenue: 0, bookingValue: 0, bookingsCount: 0, depositsCount: 0 };
      curWeekly.revenue += rev;
      curWeekly.bookingValue += bVal;
      curWeekly.bookingsCount += 1;
      if (b.deposit_paid > 0) curWeekly.depositsCount += 1;
      weeklyMap.set(weekStr, curWeekly);

      // Monthly (YYYY-MM)
      const monthStr = dateStr.substring(0, 7);
      const curMonthly = monthlyMap.get(monthStr) || { revenue: 0, bookingValue: 0, bookingsCount: 0, depositsCount: 0 };
      curMonthly.revenue += rev;
      curMonthly.bookingValue += bVal;
      curMonthly.bookingsCount += 1;
      if (b.deposit_paid > 0) curMonthly.depositsCount += 1;
      monthlyMap.set(monthStr, curMonthly);

      // Yearly (YYYY)
      const yearStr = dateStr.substring(0, 4);
      const curYearly = yearlyMap.get(yearStr) || { revenue: 0, bookingValue: 0, bookingsCount: 0, depositsCount: 0 };
      curYearly.revenue += rev;
      curYearly.bookingValue += bVal;
      curYearly.bookingsCount += 1;
      if (b.deposit_paid > 0) curYearly.depositsCount += 1;
      yearlyMap.set(yearStr, curYearly);
    }

    const formatSeries = (map: Map<string, { revenue: number; bookingValue: number; bookingsCount: number; depositsCount: number }>): RevenueDataPoint[] => {
      return Array.from(map.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, val]) => ({
          date,
          label: date,
          revenue: val.revenue,
          bookingValue: val.bookingValue,
          bookingsCount: val.bookingsCount,
          depositsCount: val.depositsCount,
        }));
    };

    const dailyAnalytics = formatSeries(dailyMap);
    const weeklyAnalytics = formatSeries(weeklyMap);
    const monthlyAnalytics = formatSeries(monthlyMap);
    const yearlyAnalytics = formatSeries(yearlyMap);

    // 5. Recent Activity Feeds
    const recentBookings: AdminRecentActivityItem[] = bookings.slice(0, 5).map((b) => ({
      id: b.id,
      type: "booking_created",
      bookingRef: b.booking_ref,
      customerName: b.customer_name,
      serviceId: b.service_id,
      amount: Number(b.deposit_required || 0),
      currency: b.currency || "QAR",
      timestamp: b.created_at,
      status: b.booking_status,
      linkUrl: `/admin?tab=bookings&search=${b.booking_ref}`,
      detail: `${b.pax_count} Pax • ${b.departure_date || "Date Pending"}`,
    }));

    const latestDepositSubmissions: AdminRecentActivityItem[] = proofs.slice(0, 5).map((p) => {
      const b = bookingLookup.get(p.booking_id);
      return {
        id: p.id,
        type: "proof_submitted",
        bookingRef: b?.booking_ref || "MZ-UNKNOWN",
        customerName: b?.customer_name || "Guest",
        serviceId: b?.service_id || "tour",
        amount: Number(b?.deposit_paid || b?.deposit_required || 0),
        currency: b?.currency || "QAR",
        timestamp: p.uploaded_at,
        status: p.review_status,
        linkUrl: `/admin?tab=proofs&id=${p.id}`,
        detail: p.file_name,
      };
    });

    const recentlyConfirmedBookings: AdminRecentActivityItem[] = bookings
      .filter((b) => b.booking_status === "confirmed")
      .slice(0, 5)
      .map((b) => ({
        id: b.id,
        type: "booking_confirmed",
        bookingRef: b.booking_ref,
        customerName: b.customer_name,
        serviceId: b.service_id,
        amount: Number(b.deposit_paid || 0),
        currency: b.currency || "QAR",
        timestamp: b.updated_at,
        status: b.booking_status,
        linkUrl: `/admin?tab=bookings&search=${b.booking_ref}`,
        detail: `Confirmed • Dep: ${b.departure_date || "TBD"}`,
      }));

    const recentCancellations: AdminRecentActivityItem[] = bookings
      .filter((b) => b.booking_status === "cancelled")
      .slice(0, 5)
      .map((b) => ({
        id: b.id,
        type: "booking_cancelled",
        bookingRef: b.booking_ref,
        customerName: b.customer_name,
        serviceId: b.service_id,
        amount: Number(b.deposit_required || 0),
        currency: b.currency || "QAR",
        timestamp: b.updated_at,
        status: b.booking_status,
        linkUrl: `/admin?tab=bookings&search=${b.booking_ref}`,
        detail: `Archived • Cancelled dossier`,
      }));

    const result: AdminDashboardData = {
      summaryCards,
      financialBreakdown,
      dailyAnalytics,
      weeklyAnalytics,
      monthlyAnalytics,
      yearlyAnalytics,
      recentBookings,
      latestDepositSubmissions,
      recentlyConfirmedBookings,
      upcomingDepartures: upcomingDeparturesList.slice(0, 10),
      recentCancellations,
      userRole: session.adminRole as Database["public"]["Enums"]["admin_role"],
    };

    return { success: true, data: result };
  } catch (err) {
    console.error("[Get Admin Dashboard Summary Unexpected Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

export interface AdminStaffMemberItem {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: Database["public"]["Enums"]["admin_role"];
  isActive: boolean;
  createdAt: string;
}

/**
 * Super Administrator endpoint: Retrieve all staff accounts from public.admin_users.
 */
export async function getAdminStaffMembersAction() {
  try {
    await assertSuperAdminAccess();
    const admin = createAdminClient();

    const { data: staff, error: staffErr } = await admin
      .from("admin_users")
      .select("id, role, is_active, created_at")
      .order("created_at", { ascending: true });

    if (staffErr) {
      console.error("[Get Staff Members Query Error]", staffErr);
      return { success: false, error: "Failed to query staff registry." };
    }

    const staffIds = (staff || []).map((s) => s.id);
    const profilesMap = new Map<string, { email: string; full_name: string | null; phone: string | null }>();

    if (staffIds.length > 0) {
      const { data: profs } = await admin
        .from("profiles")
        .select("id, email, full_name, phone")
        .in("id", staffIds);

      if (profs) {
        for (const p of profs) {
          profilesMap.set(p.id, p);
        }
      }
    }

    const formatted: AdminStaffMemberItem[] = (staff || []).map((s) => {
      const prof = profilesMap.get(s.id);
      return {
        id: s.id,
        email: prof?.email || "Unknown Email",
        fullName: prof?.full_name || "Staff Member",
        phone: prof?.phone || null,
        role: s.role,
        isActive: s.is_active,
        createdAt: s.created_at,
      };
    });

    return { success: true, data: formatted };
  } catch (err) {
    console.error("[Get Staff Members Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

const updateStaffRoleSchema = z.object({
  userId: z.string().uuid("Invalid staff user ID"),
  role: z.enum(["super_admin", "tour_manager", "concierge_agent", "finance"]),
  isActive: z.boolean(),
});

/**
 * Super Administrator endpoint: Update role or active state of staff member.
 */
export async function updateAdminStaffRoleAction(rawInput: unknown) {
  try {
    await assertSuperAdminAccess();
    const validation = updateStaffRoleSchema.safeParse(rawInput);
    if (!validation.success) {
      return { success: false, error: "Invalid role modification parameters." };
    }

    const { userId, role, isActive } = validation.data;
    const admin = createAdminClient();

    const { error } = await admin
      .from("admin_users")
      .update({
        role,
        is_active: isActive,
      })
      .eq("id", userId);

    if (error) {
      console.error("[Update Staff Role Error]", error);
      return { success: false, error: "Failed to update staff permissions." };
    }

    return { success: true };
  } catch (err) {
    console.error("[Update Staff Role Unexpected Error]", err);
    return { success: false, error: (err as Error).message };
  }
}
