"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { proposalAccessLimiter, getClientIp } from "@/lib/security/rate-limit";
import { sendCustomTripNotification } from "./email-service";
import type { Database } from "@/lib/supabase/database.types";

const tokenSchema = z.string().uuid("Invalid proposal access token");

export interface PublicProposalData {
  id: string;
  proposalRef: string;
  guestToken: string;
  tokenExpiresAt: string;
  isExpired: boolean;
  version: number;
  status: Database["public"]["Enums"]["proposal_status"];
  titleEn: string;
  titleAr: string;
  summaryEn: string | null;
  summaryAr: string | null;
  validUntil: string;
  isValidUntilPassed: boolean;
  currency: string;
  pricingBreakdown: Record<string, unknown>;
  totalPrice: number;
  depositRequired: number;
  balanceDue: number;
  itineraryDays: Record<string, unknown>[];
  inclusionsEn: string[];
  inclusionsAr: string[];
  exclusionsEn: string[];
  exclusionsAr: string[];
  termsEn: string | null;
  termsAr: string | null;
  customerNotes: string | null;
  customerFeedback: string | null;
  customerActionAt: string | null;
  inquiry: {
    guestName: string;
    destinations: string[];
    partySize: string;
    timeframe: string;
  };
}

/**
 * Public Guest & Authenticated Customer Proposal Dossier Retrieval.
 * Rate-limited and validated against token expiration.
 * Strictly omits internal staff notes.
 */
export async function getPublicProposalByTokenAction(guestToken: string) {
  try {
    const head = await headers();
    const clientIp = getClientIp(head);
    const limitCheck = proposalAccessLimiter.check(clientIp);

    if (!limitCheck.success) {
      return {
        success: false,
        error: "Too many proposal requests. Please wait a moment and try again.",
      };
    }

    const tokenValidation = tokenSchema.safeParse(guestToken);
    if (!tokenValidation.success) {
      return { success: false, error: "Invalid proposal access link." };
    }

    const admin = createAdminClient();

    const { data: proposal, error: propErr } = await admin
      .from("custom_proposals")
      .select(
        "id, proposal_ref, inquiry_id, customer_id, guest_token, token_expires_at, version, status, title_en, title_ar, summary_en, summary_ar, valid_until, currency, pricing_breakdown, total_price, deposit_required, balance_due, itinerary_days, inclusions_en, inclusions_ar, exclusions_en, exclusions_ar, terms_en, terms_ar, customer_notes, customer_feedback, customer_action_at, created_at, updated_at"
      )
      .eq("guest_token", guestToken)
      .maybeSingle();

    if (propErr || !proposal) {
      return { success: false, error: "Proposal not found or access link is invalid." };
    }

    // Check token expiration (30 days standard)
    const now = new Date();
    const tokenExp = new Date(proposal.token_expires_at);
    const isTokenExpired = tokenExp.getTime() < now.getTime();

    // Check validity date on proposal
    const validUntilDate = new Date(proposal.valid_until);
    // Add end of day buffer in UTC
    validUntilDate.setHours(23, 59, 59, 999);
    const isValidUntilPassed = validUntilDate.getTime() < now.getTime();

    // Fetch related non-sensitive inquiry context
    const { data: inquiry } = await admin
      .from("custom_trip_requests")
      .select("guest_name, destinations, party_size, timeframe")
      .eq("id", proposal.inquiry_id)
      .maybeSingle();

    const result: PublicProposalData = {
      id: proposal.id,
      proposalRef: proposal.proposal_ref,
      guestToken: proposal.guest_token,
      tokenExpiresAt: proposal.token_expires_at,
      isExpired: isTokenExpired,
      version: proposal.version,
      status: proposal.status,
      titleEn: proposal.title_en,
      titleAr: proposal.title_ar,
      summaryEn: proposal.summary_en,
      summaryAr: proposal.summary_ar,
      validUntil: proposal.valid_until,
      isValidUntilPassed,
      currency: proposal.currency || "QAR",
      pricingBreakdown: (proposal.pricing_breakdown as Record<string, unknown>) || {},
      totalPrice: Number(proposal.total_price),
      depositRequired: Number(proposal.deposit_required),
      balanceDue: Number(proposal.balance_due),
      itineraryDays: (proposal.itinerary_days as Record<string, unknown>[]) || [],
      inclusionsEn: proposal.inclusions_en || [],
      inclusionsAr: proposal.inclusions_ar || [],
      exclusionsEn: proposal.exclusions_en || [],
      exclusionsAr: proposal.exclusions_ar || [],
      termsEn: proposal.terms_en,
      termsAr: proposal.terms_ar,
      customerNotes: proposal.customer_notes,
      customerFeedback: proposal.customer_feedback,
      customerActionAt: proposal.customer_action_at,
      inquiry: {
        guestName: inquiry?.guest_name || "Valued Guest",
        destinations: inquiry?.destinations || ["State of Qatar"],
        partySize: inquiry?.party_size || "Private Party",
        timeframe: inquiry?.timeframe || "Bespoke Dates",
      },
    };

    return { success: true, data: result };
  } catch (err) {
    console.error("[Get Public Proposal Error]", err);
    return { success: false, error: "An unexpected error occurred while loading the proposal." };
  }
}

/**
 * Customer accepts proposed custom itinerary.
 * Validates token, records acceptance in audit timeline, and triggers concierge notification.
 */
export async function customerAcceptProposalAction(guestToken: string, notes?: string) {
  try {
    const head = await headers();
    const clientIp = getClientIp(head);
    const limitCheck = proposalAccessLimiter.check(clientIp);
    if (!limitCheck.success) {
      return { success: false, error: "Too many attempts. Please try again shortly." };
    }

    const tokenValidation = tokenSchema.safeParse(guestToken);
    if (!tokenValidation.success) {
      return { success: false, error: "Invalid proposal access link." };
    }

    const admin = createAdminClient();

    const { data: proposal, error: propErr } = await admin
      .from("custom_proposals")
      .select("id, inquiry_id, proposal_ref, title_en, title_ar, total_price, currency, status, token_expires_at, valid_until")
      .eq("guest_token", guestToken)
      .maybeSingle();

    if (propErr || !proposal) {
      return { success: false, error: "Proposal not found." };
    }

    if (new Date(proposal.token_expires_at).getTime() < Date.now()) {
      return { success: false, error: "This proposal link has expired. Please contact our concierge." };
    }

    if (proposal.status === "accepted" || proposal.status === "converted") {
      return { success: true, alreadyAccepted: true };
    }

    const nowIso = new Date().toISOString();

    // 1. Update proposal status
    const { error: updatePropErr } = await admin
      .from("custom_proposals")
      .update({
        status: "accepted",
        customer_action_at: nowIso,
        customer_feedback: notes?.trim() || null,
        updated_at: nowIso,
      })
      .eq("id", proposal.id);

    if (updatePropErr) {
      console.error("[Accept Proposal Error]", updatePropErr);
      return { success: false, error: "Failed to record proposal acceptance." };
    }

    // 2. Update custom trip status
    await admin
      .from("custom_trip_requests")
      .update({
        status: "accepted",
        updated_at: nowIso,
      })
      .eq("id", proposal.inquiry_id);

    // 3. Log to timeline
    await admin.from("custom_trip_timeline").insert({
      inquiry_id: proposal.inquiry_id,
      event_type: "proposal_accepted",
      title_en: "Proposal Accepted by Customer",
      title_ar: "تم اعتماد عرض الرحلة من قبل العميل",
      description_en: notes?.trim() ? `Customer notes: ${notes.trim()}` : "Customer confirmed the itinerary proposal without changes.",
      description_ar: notes?.trim() ? `ملاحظات العميل: ${notes.trim()}` : "أكد العميل اعتماد برنامج الرحلة المقترح.",
      actor_role: "customer",
      metadata: { proposalId: proposal.id, proposalRef: proposal.proposal_ref },
    });

    // 4. Log message
    await admin.from("custom_trip_messages").insert({
      inquiry_id: proposal.inquiry_id,
      sender_type: "customer",
      sender_name: "Customer",
      channel: "portal",
      message: notes?.trim()
        ? `Proposal [${proposal.proposal_ref}] accepted. Special notes: ${notes.trim()}`
        : `Proposal [${proposal.proposal_ref}] accepted with full agreement.`,
      is_internal: false,
    });

    // 5. Send confirmation notification
    const { data: inquiry } = await admin
      .from("custom_trip_requests")
      .select("guest_name, email, preferred_locale, request_ref")
      .eq("id", proposal.inquiry_id)
      .maybeSingle();

    if (inquiry?.email) {
      await sendCustomTripNotification({
        inquiryId: proposal.inquiry_id,
        inquiryRef: inquiry.request_ref,
        customerName: inquiry.guest_name,
        customerEmail: inquiry.email,
        proposalRef: proposal.proposal_ref,
        proposalTitle: proposal.title_en,
        totalPrice: Number(proposal.total_price),
        currency: proposal.currency || "QAR",
        locale: inquiry.preferred_locale as "en" | "ar",
        notificationType: "proposal_accepted",
      });
    }

    return { success: true };
  } catch (err) {
    console.error("[Customer Accept Proposal Unexpected Error]", err);
    return { success: false, error: "An unexpected error occurred while confirming acceptance." };
  }
}

/**
 * Customer declines proposed itinerary.
 */
export async function customerDeclineProposalAction(guestToken: string, reason?: string) {
  try {
    const head = await headers();
    const clientIp = getClientIp(head);
    const limitCheck = proposalAccessLimiter.check(clientIp);
    if (!limitCheck.success) {
      return { success: false, error: "Too many attempts. Please try again shortly." };
    }

    const tokenValidation = tokenSchema.safeParse(guestToken);
    if (!tokenValidation.success) {
      return { success: false, error: "Invalid proposal access link." };
    }

    const admin = createAdminClient();

    const { data: proposal, error: propErr } = await admin
      .from("custom_proposals")
      .select("id, inquiry_id, proposal_ref, title_en, status, token_expires_at")
      .eq("guest_token", guestToken)
      .maybeSingle();

    if (propErr || !proposal) {
      return { success: false, error: "Proposal not found." };
    }

    const nowIso = new Date().toISOString();

    await admin
      .from("custom_proposals")
      .update({
        status: "declined",
        customer_action_at: nowIso,
        customer_feedback: reason?.trim() || null,
        updated_at: nowIso,
      })
      .eq("id", proposal.id);

    await admin
      .from("custom_trip_requests")
      .update({
        status: "lost",
        lost_reason: reason?.trim() || "Customer declined proposal",
        updated_at: nowIso,
      })
      .eq("id", proposal.inquiry_id);

    await admin.from("custom_trip_timeline").insert({
      inquiry_id: proposal.inquiry_id,
      event_type: "proposal_declined",
      title_en: "Proposal Declined by Customer",
      title_ar: "تم الاعتذار عن عرض الرحلة من قبل العميل",
      description_en: reason?.trim() ? `Decline reason: ${reason.trim()}` : "Customer chose not to proceed with this proposal.",
      description_ar: reason?.trim() ? `سبب الاعتذار: ${reason.trim()}` : "اختار العميل عدم المضي قدماً في هذا العرض.",
      actor_role: "customer",
      metadata: { proposalId: proposal.id, proposalRef: proposal.proposal_ref },
    });

    await admin.from("custom_trip_messages").insert({
      inquiry_id: proposal.inquiry_id,
      sender_type: "customer",
      sender_name: "Customer",
      channel: "portal",
      message: `Proposal [${proposal.proposal_ref}] declined. Reason: ${reason?.trim() || "None stated."}`,
      is_internal: false,
    });

    return { success: true };
  } catch (err) {
    console.error("[Customer Decline Proposal Error]", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

/**
 * Customer requests modifications to the itinerary or quotation.
 */
export async function customerRequestProposalRevisionAction(guestToken: string, feedback: string) {
  try {
    const head = await headers();
    const clientIp = getClientIp(head);
    const limitCheck = proposalAccessLimiter.check(clientIp);
    if (!limitCheck.success) {
      return { success: false, error: "Too many attempts. Please try again shortly." };
    }

    const tokenValidation = tokenSchema.safeParse(guestToken);
    if (!tokenValidation.success) {
      return { success: false, error: "Invalid proposal access link." };
    }

    if (!feedback || feedback.trim().length < 3) {
      return { success: false, error: "Please provide a descriptive change request (at least 3 characters)." };
    }

    const admin = createAdminClient();

    const { data: proposal, error: propErr } = await admin
      .from("custom_proposals")
      .select("id, inquiry_id, proposal_ref, title_en, status, token_expires_at")
      .eq("guest_token", guestToken)
      .maybeSingle();

    if (propErr || !proposal) {
      return { success: false, error: "Proposal not found." };
    }

    const nowIso = new Date().toISOString();

    await admin
      .from("custom_proposals")
      .update({
        status: "revision_requested",
        customer_action_at: nowIso,
        customer_feedback: feedback.trim(),
        updated_at: nowIso,
      })
      .eq("id", proposal.id);

    await admin
      .from("custom_trip_requests")
      .update({
        status: "revision_requested",
        updated_at: nowIso,
      })
      .eq("id", proposal.inquiry_id);

    await admin.from("custom_trip_timeline").insert({
      inquiry_id: proposal.inquiry_id,
      event_type: "revision_requested",
      title_en: "Revision Requested by Customer",
      title_ar: "طلب تعديل البرنامج من قبل العميل",
      description_en: feedback.trim(),
      description_ar: feedback.trim(),
      actor_role: "customer",
      metadata: { proposalId: proposal.id, proposalRef: proposal.proposal_ref },
    });

    await admin.from("custom_trip_messages").insert({
      inquiry_id: proposal.inquiry_id,
      sender_type: "customer",
      sender_name: "Customer",
      channel: "portal",
      message: `Revision requested on proposal [${proposal.proposal_ref}]: ${feedback.trim()}`,
      is_internal: false,
    });

    return { success: true };
  } catch (err) {
    console.error("[Customer Request Revision Error]", err);
    return { success: false, error: "An unexpected error occurred while submitting feedback." };
  }
}

/**
 * Retrieves all custom proposals belonging to the authenticated customer.
 */
export async function getCustomerProposalsAction() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: "Authentication required." };
    }

    const admin = createAdminClient();

    // Find inquiries owned by this customer
    const { data: userInquiries } = await admin
      .from("custom_trip_requests")
      .select("id")
      .or(`customer_id.eq.${user.id},email.eq.${user.email || ""}`);

    const inquiryIds = (userInquiries || []).map((i) => i.id);

    let query = admin
      .from("custom_proposals")
      .select(
        "id, proposal_ref, inquiry_id, guest_token, version, status, title_en, title_ar, valid_until, total_price, deposit_required, balance_due, currency, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (inquiryIds.length > 0) {
      query = query.or(`customer_id.eq.${user.id},inquiry_id.in.(${inquiryIds.join(",")})`);
    } else {
      query = query.eq("customer_id", user.id);
    }

    const { data: proposals, error: propErr } = await query;

    if (propErr) {
      console.error("[Get Customer Proposals Error]", propErr);
      return { success: false, error: "Failed to retrieve proposals." };
    }

    return {
      success: true,
      data: (proposals || []).map((p) => ({
        id: p.id,
        proposalRef: p.proposal_ref,
        inquiryId: p.inquiry_id,
        guestToken: p.guest_token,
        version: p.version,
        status: p.status,
        titleEn: p.title_en,
        titleAr: p.title_ar,
        validUntil: p.valid_until,
        totalPrice: Number(p.total_price),
        depositRequired: Number(p.deposit_required),
        balanceDue: Number(p.balance_due),
        currency: p.currency || "QAR",
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
    };
  } catch (err) {
    console.error("[Get Customer Proposals Unexpected Error]", err);
    return { success: false, error: "Failed to load customer proposals." };
  }
}
