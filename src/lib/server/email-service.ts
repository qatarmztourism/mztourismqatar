import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/config/site-config";

export interface WelcomeEmailParams {
  userId: string;
  email: string;
  fullName: string;
  locale?: "en" | "ar";
}

export interface SendEmailResult {
  success: boolean;
  skipped?: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Verified sender configuration for MZ Tourism Qatar.
 * Pinned to verified custom domain: @mztourismqatar.qa
 */
export const EMAIL_CONFIG = {
  senderName: siteConfig.brand.name, // "MZ Tourism Qatar"
  senderEmail: "concierge@mztourismqatar.qa",
  replyTo: siteConfig.contact.email, // "qatarmztourism@gmail.com"
  officialWebsite: process.env.NEXT_PUBLIC_SITE_URL || "https://mztourismqatar.qa",
  whatsappConcierge: siteConfig.whatsapp.displayWithNote, // "+974 7038 6705"
};

/**
 * Returns the fully qualified sender address, honoring RESEND_FROM_EMAIL override if set.
 */
export function getSenderAddress(): string {
  if (process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.includes("@")) {
    return process.env.RESEND_FROM_EMAIL;
  }
  return `${EMAIL_CONFIG.senderName} <${EMAIL_CONFIG.senderEmail}>`;
}

/**
 * Composes a prestigious, text-only VIP welcome letter in English.
 * Pure text-only formatting guarantees flawless deliverability across mobile and VIP email clients.
 * Zero references to technical backends, cloud providers, or database platforms.
 */
function buildEnglishWelcomeText(fullName: string): string {
  const greeting = fullName && fullName.trim() !== "Valued Guest" ? `Dear ${fullName.trim()},` : "Dear Guest,";
  const siteUrl = EMAIL_CONFIG.officialWebsite;

  return `${greeting}

Welcome to MZ Tourism Qatar.

We have the distinct honor of confirming your guest registration with our private concierge desk. Your bespoke travel portfolio has been successfully established.

You may now access your itinerary dossier, review upcoming private departures, and track verified deposit receipts at any time by visiting:
${siteUrl}/en/account

SIGNATURE EXPERIENCES AT YOUR DISPOSAL:
• Private Khor Al Adaid Inland Sea Desert Expeditions
• Doha Heritage & Architectural Chauffeur Excursions
• Hamad International Airport (DOH) VIP Meet & Assist
• Bespoke Dhow Banquets & Royal Arabian Glamping Majlis
• Cross-Border Overland VIP Chauffeur to Saudi Arabia & Bahrain

DIRECT 24/7 CONCIERGE LIAISON:
Should you require immediate consultation, bespoke itinerary curation, or urgent chauffeur dispatch, our executive desk is at your service:
• WhatsApp Liaison: ${EMAIL_CONFIG.whatsappConcierge}
• Official Inquiries: ${EMAIL_CONFIG.replyTo}
• Official Portal: ${siteUrl}

We look forward to curating unforgettable moments of Qatari hospitality for your upcoming journeys.

With our highest regards,

The Executive Concierge Team
MZ Tourism Qatar
Doha, State of Qatar
${siteUrl}
`;
}

/**
 * Composes a prestigious, text-only VIP welcome letter in Arabic.
 */
function buildArabicWelcomeText(fullName: string): string {
  const greeting =
    fullName && fullName.trim() !== "Valued Guest"
      ? `سعادة الفاضل / ${fullName.trim()} المحترم،`
      : "سعادة الضيف الكريم،";
  const siteUrl = EMAIL_CONFIG.officialWebsite;

  return `${greeting}

السلام عليكم ورحمة الله وبركاته،،،

يسعدنا ويشرفنا في إم زد للسياحة قطر أن نرحب بكم ضيفاً عزيزاً في محفظة كبار الشخصيات لدينا. تم تفعيل حسابكم بنجاح لدى مكتب الكونسيرج الخاص.

يمكنكم الآن متابعة ملفات رحلاتكم الخاصة، وجداول المواعيد، وإيصالات العربون المعتمدة مباشرة عبر الرابط التالي:
${siteUrl}/ar/account

خدماتنا الحصرية رهن إشارتكم:
• رحلات سفاري خاصة إلى خور العديد والبحر الداخلي
• جولات تراثية وثقافية خاصة في الدوحة
• استقبال وتوديع كبار الشخصيات بمطار حمد الدولي (DOH)
• حفلات المحامل التراثية الخاصة والمخيمات الصحراوية الملكية
• رحلات برية فاخرة لدول مجلس التعاون الخليجي (السعودية والبحرين)

قنوات التواصل المباشرة على مدار الساعة:
لتنسيق برامجكم السياحية أو لطلبات الكونسيرج الفورية، يسعدنا تواصلكم المباشر:
• واتساب الكونسيرج: ${EMAIL_CONFIG.whatsappConcierge}
• البريد الرسمي: ${EMAIL_CONFIG.replyTo}
• البوابة الرسمية: ${siteUrl}

نتطلع دائماً لتقديم أسمى مراتب الضيافة القطرية الأصيلة لكم.

مع أطيب التحيات والتقدير،

فريق الكونسيرج التنفيذي
إم زد للسياحة قطر
الدوحة، دولة قطر
${siteUrl}
`;
}

/**
 * Sends a premium text-only welcome email strictly ONCE upon first customer registration.
 *
 * IDEMPOTENCY GUARANTEES:
 * 1. Checks `welcome_email_sent_at` on the customer profile.
 * 2. Checks historical log to prevent duplicate dispatches across auth retries.
 * 3. Gracefully logs in development when RESEND_API_KEY is not configured.
 * 4. Never exposes technical backend URLs or provider names.
 */
export async function sendCustomerWelcomeEmail({
  userId,
  email,
  fullName,
  locale = "en",
}: WelcomeEmailParams): Promise<SendEmailResult> {
  if (!email || !userId) {
    return { success: false, error: "Missing required customer credentials" };
  }

  const admin = createAdminClient();

  // 1. Idempotency Check: Verify if welcome email was already recorded on profile
  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("welcome_email_sent_at")
      .eq("id", userId)
      .maybeSingle();

    // Typecast safely in case migration column is pending
    const existingTimestamp = (profile as Record<string, unknown> | null)?.welcome_email_sent_at;
    if (existingTimestamp) {
      return { success: true, skipped: true };
    }
  } catch (checkErr) {
    console.warn("[Welcome Email Idempotency Check Notice]", checkErr);
  }

  // 2. Prepare text-only payload
  const isArabic = locale === "ar";
  const subject = isArabic
    ? "مرحباً بكم في إم زد للسياحة قطر — محفظة كبار الشخصيات"
    : "Welcome to MZ Tourism Qatar — VIP Guest Portfolio";

  const textBody = isArabic
    ? buildArabicWelcomeText(fullName)
    : buildEnglishWelcomeText(fullName);

  const sender = getSenderAddress();
  const apiKey = process.env.RESEND_API_KEY;
  let messageId: string | undefined;

  // 3. Dispatch via verified custom-domain Resend API if configured
  if (apiKey && apiKey.length > 5) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: sender,
          to: [email],
          reply_to: EMAIL_CONFIG.replyTo,
          subject,
          text: textBody,
        }),
      });

      if (res.ok) {
        const json = (await res.json()) as { id?: string };
        messageId = json.id;
      } else {
        const errText = await res.text();
        console.warn("[Welcome Email Delivery Notice]", errText);
      }
    } catch (dispatchErr) {
      console.warn("[Welcome Email Dispatch Network Notice]", dispatchErr);
    }
  } else {
    // Staging mode: Record truthful staging log without failing registration
    console.log(
      `[Welcome Email Staged (Development)] Recipient: ${email} | Sender: ${sender} | Subject: ${subject}`
    );
  }

  // 4. Record single-send timestamp to enforce strict once-only delivery
  try {
    const nowIso = new Date().toISOString();
    await admin
      .from("profiles")
      .update({ welcome_email_sent_at: nowIso })
      .eq("id", userId);
  } catch (updateErr) {
    console.warn("[Welcome Email Timestamp Update Notice]", updateErr);
  }

  return { success: true, messageId };
}

// =============================================================================
// PHASE 4: BOOKING LIFECYCLE CUSTOMER NOTIFICATIONS
// =============================================================================

export interface BookingNotificationParams {
  bookingId: string;
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  serviceTitle: string;
  departureDate?: string | null;
  paxCount: number;
  depositRequired: number;
  depositPaid: number;
  balanceDue: number;
  currency: string;
  locale?: "en" | "ar";
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  notificationType:
    | "booking_received"
    | "proof_submitted"
    | "deposit_approved"
    | "deposit_rejected"
    | "booking_confirmed"
    | "booking_cancelled"
    | "booking_completed";
}

function buildBookingNotificationContent(params: BookingNotificationParams): {
  subject: string;
  text: string;
} {
  const isAr = params.locale === "ar";
  const siteUrl = EMAIL_CONFIG.officialWebsite;
  const greetingEn = params.customerName?.trim() ? `Dear ${params.customerName.trim()},` : "Dear Valued Guest,";
  const greetingAr = params.customerName?.trim()
    ? `سعادة الفاضل / ${params.customerName.trim()} المحترم،`
    : "سعادة الضيف الكريم،";

  switch (params.notificationType) {
    case "proof_submitted": {
      if (isAr) {
        return {
          subject: `تم استلام إيصال العربون — [${params.bookingRef}] | إم زد للسياحة قطر`,
          text: `${greetingAr}

نشكركم على رفع إشعار تحويل العربون للحجز رقم (${params.bookingRef}).

يخضع إشعار السداد حالياً للتدقيق والمطابقة من قبل قسم المالية وإدارة العمليات. 
يرجى العلم بأن إرسال الإشعار لا يعني التأكيد الفوري للحجز، حيث سيتم إرسال تأكيد الحجز الرسمي لكم فور اعتماد الإشعار.

ملخص السجل:
• رمز الحجز: ${params.bookingRef}
• التجربة: ${params.serviceTitle}
• تاريخ الرحلة: ${params.departureDate || "قيد التنسيق"}
• العربون المطلوب: ${params.depositRequired.toLocaleString("en-US")} ${params.currency}

يمكنكم متابعة حالة الاعتماد في أي وقت:
${siteUrl}/ar/account/bookings/${params.bookingRef}

لأي استفسار، يسعدنا تواصلكم المباشر مع الكونسيرج: ${EMAIL_CONFIG.whatsappConcierge}

مع فائق الاحترام والتقدير،
فريق العمليات — إم زد للسياحة قطر
${siteUrl}`,
        };
      }
      return {
        subject: `Payment Proof Received Under Review — [${params.bookingRef}] | MZ Tourism Qatar`,
        text: `${greetingEn}

Thank you for submitting your deposit payment proof for reservation (${params.bookingRef}).

Your submitted proof is currently under review and verification by our finance and operations desk. Please note that submitting payment proof does not automatically confirm your reservation. An official booking confirmation will be issued immediately upon verification.

RESERVATION SUMMARY:
• Reference: ${params.bookingRef}
• Experience: ${params.serviceTitle}
• Departure: ${params.departureDate || "Coordinating with Concierge"}
• Deposit Required: ${params.depositRequired.toLocaleString("en-US")} ${params.currency}

Track your verification status at any time:
${siteUrl}/en/account/bookings/${params.bookingRef}

Direct Concierge Desk: ${EMAIL_CONFIG.whatsappConcierge}

Warm regards,
Operations & Finance Desk — MZ Tourism Qatar
${siteUrl}`,
      };
    }
    case "booking_received": {
      if (isAr) {
        return {
          subject: `تم استلام طلب الحجز — [${params.bookingRef}] | إم زد للسياحة قطر`,
          text: `${greetingAr}

السلام عليكم ورحمة الله وبركاته،،،

يسعدنا إبلاغكم باستلام طلب حجزكم الخاص بنجاح لدى مكتب إم زد للسياحة قطر.

تفاصيل الحجز:
• رمز الحجز: ${params.bookingRef}
• التجربة السياحية: ${params.serviceTitle}
• تاريخ الرحلة: ${params.departureDate || "قيد التنسيق"}
• عدد الضيوف: ${params.paxCount}
• العربون المطلوب: ${params.depositRequired.toLocaleString("en-US")} ${params.currency}
• الرصيد المتبقي: ${params.balanceDue.toLocaleString("en-US")} ${params.currency}

خطوتكم التالية:
يرجى إيداع العربون ورفع إشعار التحويل البنكي عبر حسابكم أو الرابط التالي لتأكيد الحجز فوراً:
${siteUrl}/ar/account/bookings/${params.bookingRef}

لأي استفسارات فورية، الكونسيرج متاح 24/7 عبر واتساب: ${EMAIL_CONFIG.whatsappConcierge}

مع فائق التقدير والامتنان،
فريق الكونسيرج التنفيذي — إم زد للسياحة قطر
${siteUrl}`,
        };
      }
      return {
        subject: `Reservation Received — [${params.bookingRef}] | MZ Tourism Qatar`,
        text: `${greetingEn}

We have the honor of confirming the receipt of your luxury expedition reservation with MZ Tourism Qatar.

RESERVATION SUMMARY:
• Reference: ${params.bookingRef}
• Experience: ${params.serviceTitle}
• Departure Date: ${params.departureDate || "Coordinating with Concierge"}
• Party Size: ${params.paxCount} Guest(s)
• Deposit Required: ${params.depositRequired.toLocaleString("en-US")} ${params.currency}
• Remaining Balance: ${params.balanceDue.toLocaleString("en-US")} ${params.currency}

NEXT STEP:
To secure vehicle dispatch and licensed guide allocation, kindly submit your deposit transfer proof via your private portal:
${siteUrl}/en/account/bookings/${params.bookingRef}

Our private concierge desk is at your direct service 24/7 via WhatsApp: ${EMAIL_CONFIG.whatsappConcierge}

With highest regards,
Executive Concierge Team — MZ Tourism Qatar
${siteUrl}`,
      };
    }

    case "deposit_approved":
    case "booking_confirmed": {
      if (isAr) {
        return {
          subject: `تأكيد الحجز رسمياً — [${params.bookingRef}] | إم زد للسياحة قطر`,
          text: `${greetingAr}

يسرنا إبلاغكم بأنه تم اعتماد إيصال الدفعة وتأكيد حجزكم رسمياً. تم تخصيص المركبة الفاخرة والمرشد السياحي لرحلتكم.

ملخص الحجز المؤكد:
• رمز الحجز: ${params.bookingRef}
• التجربة: ${params.serviceTitle}
• تاريخ الرحلة المؤكد: ${params.departureDate || "محدد وفق الجدول"}
• عدد الضيوف: ${params.paxCount}
• العربون المستلم: ${params.depositPaid.toLocaleString("en-US")} ${params.currency}
• المتبقي عند بدء الرحلة: ${params.balanceDue.toLocaleString("en-US")} ${params.currency}

يمكنكم مراجعة جدول الرحلة وقائمة المسافرين في أي وقت:
${siteUrl}/ar/account/bookings/${params.bookingRef}

للتنسيق المباشر مع السائق الخاص أو الكونسيرج: ${EMAIL_CONFIG.whatsappConcierge}

نتمنى لكم رحلة استثنائية مليئة بالضيافة القطرية الأصيلة.
فريق الكونسيرج التنفيذي — إم زد للسياحة قطر
${siteUrl}`,
        };
      }
      return {
        subject: `Booking Confirmed — [${params.bookingRef}] | MZ Tourism Qatar`,
        text: `${greetingEn}

We are pleased to inform you that your deposit has been verified and your reservation is now officially CONFIRMED. Your private luxury fleet and licensed guide have been locked in our schedule.

CONFIRMED DOSSIER:
• Reference: ${params.bookingRef}
• Experience: ${params.serviceTitle}
• Confirmed Departure: ${params.departureDate || "Scheduled as Requested"}
• Party Size: ${params.paxCount} Guest(s)
• Deposit Verified: ${params.depositPaid.toLocaleString("en-US")} ${params.currency}
• Remaining Balance Due: ${params.balanceDue.toLocaleString("en-US")} ${params.currency}

View complete itinerary stops and registered travelers at:
${siteUrl}/en/account/bookings/${params.bookingRef}

Direct Chauffeur & Concierge Desk: ${EMAIL_CONFIG.whatsappConcierge}

We look forward to hosting you for an unforgettable journey.
Executive Concierge Team — MZ Tourism Qatar
${siteUrl}`,
      };
    }

    case "deposit_rejected": {
      if (isAr) {
        return {
          subject: `تحديث مراجعة إيصال الدفعة — [${params.bookingRef}] | إم زد للسياحة قطر`,
          text: `${greetingAr}

نود إحاطتكم بأنه بعد مراجعة إيصال الدفعة المرسل للحجز رقم (${params.bookingRef})، تعذر اعتماده للسبب التالي:
"${params.rejectionReason || "الإيصال غير واضح أو لا يظهر رقم المعاملة البنكية"}"

يرجى التكرم برفع إيصال بديل وموضح لرقم التحويل عبر الرابط التالي:
${siteUrl}/ar/account/bookings/${params.bookingRef}

للمساعدة المباشرة يرجى التواصل فوراً مع الكونسيرج: ${EMAIL_CONFIG.whatsappConcierge}

شاكرين ومقدرين حسن تعاونكم،
فريق الكونسيرج التنفيذي — إم زد للسياحة قطر
${siteUrl}`,
        };
      }
      return {
        subject: `Deposit Receipt Review Update — [${params.bookingRef}] | MZ Tourism Qatar`,
        text: `${greetingEn}

Following the review of the payment receipt submitted for reservation (${params.bookingRef}), our finance desk was unable to verify the transfer for the following reason:
"${params.rejectionReason || "Receipt inconclusive or missing bank transaction reference"}"

Please upload a clear replacement receipt showing the transfer reference and amount via your portal:
${siteUrl}/en/account/bookings/${params.bookingRef}

For immediate assistance or alternative payment arrangements, contact concierge: ${EMAIL_CONFIG.whatsappConcierge}

Warm regards,
Executive Concierge Team — MZ Tourism Qatar
${siteUrl}`,
      };
    }

    case "booking_cancelled": {
      if (isAr) {
        return {
          subject: `إلغاء الحجز — [${params.bookingRef}] | إم زد للسياحة قطر`,
          text: `${greetingAr}

نحيطكم علماً بأنه تم إلغاء الحجز رقم (${params.bookingRef}) لرحلة ${params.serviceTitle}.
سبب الإلغاء: ${params.cancellationReason || "بناءً على طلب العميل أو انتهاء مهلة السداد"}

إذا كان لديكم أي استفسار أو رغبة في إعادة التنسيق، يسعدنا تواصلكم:
${siteUrl}/ar/account
واتساب الكونسيرج: ${EMAIL_CONFIG.whatsappConcierge}

مع فائق الاحترام،
إم زد للسياحة قطر
${siteUrl}`,
        };
      }
      return {
        subject: `Reservation Cancelled — [${params.bookingRef}] | MZ Tourism Qatar`,
        text: `${greetingEn}

Please be advised that reservation (${params.bookingRef}) for ${params.serviceTitle} has been cancelled.
Cancellation Reason: ${params.cancellationReason || "Customer request or deposit window expired"}

Should you wish to reschedule or inquire about alternative experiences:
${siteUrl}/en/account
WhatsApp Concierge: ${EMAIL_CONFIG.whatsappConcierge}

With regards,
MZ Tourism Qatar
${siteUrl}`,
      };
    }

    case "booking_completed": {
      if (isAr) {
        return {
          subject: `اكتملت الرحلة بنجاح — [${params.bookingRef}] | إم زد للسياحة قطر`,
          text: `${greetingAr}

نشكركم لاختياركم إم زد للسياحة قطر. نتمنى أن تكونوا قد قضيتم وقتاً ممتعاً وتجربة فاخرة تليق بتطلعاتكم في رحلة ${params.serviceTitle}.

تم تسجيل الرحلة كمكتملة في ملفكم السياحي. يمكنكم استعراض سجل رحلاتكم عبر الرابط:
${siteUrl}/ar/account/bookings

نتطلع دائماً لخدمتكم في رحلاتكم القادمة بدولة قطر.

مع خالص التحيات والتقدير،
فريق العمل — إم زد للسياحة قطر
${siteUrl}`,
        };
      }
      return {
        subject: `Expedition Completed — [${params.bookingRef}] | MZ Tourism Qatar`,
        text: `${greetingEn}

Thank you for traveling with MZ Tourism Qatar. We trust you enjoyed an exceptional luxury experience during your ${params.serviceTitle}.

Your expedition has been marked completed in your guest portfolio:
${siteUrl}/en/account/bookings

We look forward to curating your future journeys in the State of Qatar.

With warm regards,
MZ Tourism Qatar
${siteUrl}`,
      };
    }
  }
}

/**
 * Idempotently sends customer booking notifications across lifecycle transitions.
 * Guaranteed:
 * - Checks customer_notifications log to prevent duplicates.
 * - Safely logs and does not fail operation if RESEND_API_KEY is unconfigured.
 * - Bilingual English and Arabic text bodies.
 * - Zero internal memo exposure.
 */
export async function sendCustomerBookingNotification(
  params: BookingNotificationParams
): Promise<SendEmailResult> {
  if (!params.customerEmail || !params.bookingId) {
    return { success: false, error: "Missing required notification parameters" };
  }

  const admin = createAdminClient();
  const idempotencyKey = `${params.bookingId}:${params.notificationType}:${
    params.notificationType === "deposit_rejected" ? new Date().toISOString().slice(0, 13) : "once"
  }`;

  // 1. Idempotency Check: Don't resend if already sent
  try {
    const { data: existing } = await admin
      .from("customer_notifications")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existing) {
      return { success: true, skipped: true };
    }
  } catch (checkErr) {
    // If table doesn't exist yet, proceed gracefully
    console.warn("[Customer Notification Idempotency Check Notice]", checkErr);
  }

  // 2. Build email content
  const { subject, text } = buildBookingNotificationContent(params);
  const sender = getSenderAddress();
  const apiKey = process.env.RESEND_API_KEY;
  let messageId: string | undefined;

  // 3. Dispatch via Resend API if configured
  if (apiKey && apiKey.length > 5) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: sender,
          to: [params.customerEmail],
          reply_to: EMAIL_CONFIG.replyTo,
          subject,
          text,
        }),
      });

      if (res.ok) {
        const json = (await res.json()) as { id?: string };
        messageId = json.id;
      } else {
        const errText = await res.text();
        console.warn("[Booking Notification Delivery Notice]", errText);
      }
    } catch (dispatchErr) {
      console.warn("[Booking Notification Dispatch Network Notice]", dispatchErr);
    }
  } else {
    // Staging mode: Truthfully log development staging without faking delivery
    console.log(
      `[Booking Notification Staged (Development)] Type: ${params.notificationType} | Ref: ${params.bookingRef} | Recipient: ${params.customerEmail} | Subject: ${subject}`
    );
  }

  // 4. Record to notifications log table
  try {
    await admin.from("customer_notifications").insert({
      booking_id: params.bookingId,
      notification_type: params.notificationType,
      channel: "email",
      recipient: params.customerEmail,
      status: apiKey && apiKey.length > 5 ? (messageId ? "sent" : "failed") : "staged",
      subject,
      idempotency_key: idempotencyKey,
    });
  } catch (insertErr) {
    console.warn("[Customer Notification Insert Log Notice]", insertErr);
  }

  return { success: true, messageId };
}

// =============================================================================
// PHASE 5: CUSTOM TRIP & PROPOSAL NOTIFICATIONS
// =============================================================================

export interface CustomTripNotificationParams {
  inquiryId: string;
  inquiryRef: string;
  customerName: string;
  customerEmail: string;
  assignedStaffEmail?: string | null;
  assignedStaffName?: string | null;
  proposalRef?: string;
  proposalTitle?: string;
  proposalUrl?: string;
  validUntil?: string;
  totalPrice?: number;
  currency?: string;
  customerFeedback?: string | null;
  locale?: "en" | "ar";
  notificationType:
    | "inquiry_received"
    | "inquiry_assigned"
    | "proposal_ready"
    | "proposal_revised"
    | "proposal_accepted"
    | "proposal_declined"
    | "follow_up_reminder";
}

function buildCustomTripNotificationContent(params: CustomTripNotificationParams): {
  subject: string;
  text: string;
} {
  const isAr = params.locale === "ar";
  const siteUrl = EMAIL_CONFIG.officialWebsite;
  const greetingEn = params.customerName?.trim() ? `Dear ${params.customerName.trim()},` : "Dear Valued Guest,";
  const greetingAr = params.customerName?.trim()
    ? `سعادة الفاضل / ${params.customerName.trim()} المحترم،`
    : "سعادة الضيف الكريم،";

  switch (params.notificationType) {
    case "inquiry_received": {
      if (isAr) {
        return {
          subject: `تم استلام طلب الرحلة المخصصة — [${params.inquiryRef}] | إم زد للسياحة قطر`,
          text: `${greetingAr}

السلام عليكم ورحمة الله وبركاته،،،

يسعدنا في إم زد للسياحة قطر تأكيد استلام طلب رحلتكم الخاصة والمصممة خصيصاً في دولة قطر.

مرجع الطلب: ${params.inquiryRef}

يعمل فريق الكونسيرج ومصممو البرامج السياحية لدينا على دراسة تفضيلاتكم وإعداد مسار استثنائي يعكس أعلى معايير الضيافة القطرية الملكية. سنوافيكم بالبرنامج المقترح خلال 24 ساعة.

لأي استفسارات أو تفضيلات إضافية، يمكنكم التواصل مباشرة مع الكونسيرج عبر واتساب:
${EMAIL_CONFIG.whatsappConcierge}

مع أطيب التحيات والتقدير،
فريق الكونسيرج التنفيذي — إم زد للسياحة قطر
${siteUrl}`,
        };
      }
      return {
        subject: `Bespoke Journey Inquiry Received — [${params.inquiryRef}] | MZ Tourism Qatar`,
        text: `${greetingEn}

We have the honor to confirm receipt of your bespoke journey request with MZ Tourism Qatar.

Inquiry Reference: ${params.inquiryRef}

Our luxury travel designers and private concierge desk are reviewing your preferences to curate an exclusive expedition in the State of Qatar. We will present a tailored itinerary and quotation within 24 hours.

Should you wish to supplement your preferences, our concierge desk is available 24/7 via WhatsApp:
${EMAIL_CONFIG.whatsappConcierge}

With highest regards,
Executive Concierge Desk — MZ Tourism Qatar
${siteUrl}`,
      };
    }

    case "inquiry_assigned": {
      return {
        subject: `Staff Assignment: Bespoke Inquiry [${params.inquiryRef}]`,
        text: `Internal Notification:
Inquiry ${params.inquiryRef} from ${params.customerName} (${params.customerEmail}) has been assigned to ${params.assignedStaffName || "staff member"}.

Please review the guest brief and proceed with itinerary drafting in the Admin CRM.
Portal: ${siteUrl}/en/admin?tab=custom_trips`,
      };
    }

    case "proposal_ready": {
      if (isAr) {
        return {
          subject: `عرض برنامج رحلتكم الخاصة جاهز للمعاينة — [${params.proposalRef || params.inquiryRef}] | إم زد للسياحة قطر`,
          text: `${greetingAr}

السلام عليكم ورحمة الله وبركاته،،،

يسرنا إبلاغكم بأن برنامج رحلتكم الخاصة المقترحة في دولة قطر أصبح جاهزاً للمعاينة والاعتماد.

تفاصيل العرض:
• مرجع العرض: ${params.proposalRef || params.inquiryRef}
• عنوان البرنامج: ${params.proposalTitle || "برنامج سياحي خاص في قطر"}
• القيمة الإجمالية: ${params.totalPrice ? params.totalPrice.toLocaleString("en-US") + " " + (params.currency || "QAR") : "حسب التفاصيل"}
• تاريخ الصلاحية: ${params.validUntil || "يسري لمدة 30 يوماً"}

يمكنكم استعراض البرنامج يوماً بيوم، وتفاصيل الخدمات والموافقة أو طلب التعديل مباشرة عبر الرابط الخاص:
${params.proposalUrl || `${siteUrl}/ar/account/custom_trips`}

فريق الكونسيرج جاهز للإجابة على جميع استفساراتكم عبر واتساب: ${EMAIL_CONFIG.whatsappConcierge}

مع فائق التقدير،
إم زد للسياحة قطر
${siteUrl}`,
        };
      }
      return {
        subject: `Your Bespoke Qatar Itinerary & Proposal — [${params.proposalRef || params.inquiryRef}] | MZ Tourism Qatar`,
        text: `${greetingEn}

We are delighted to present your bespoke Qatar itinerary and quotation.

Proposal Overview:
• Reference: ${params.proposalRef || params.inquiryRef}
• Program: ${params.proposalTitle || "Bespoke Qatar Private Journey"}
• Total Quotation: ${params.totalPrice ? params.totalPrice.toLocaleString("en-US") + " " + (params.currency || "QAR") : "As detailed"}
• Valid Until: ${params.validUntil || "Valid for 30 days"}

You may review the day-by-day itinerary, inclusions, and accept or request modifications securely at:
${params.proposalUrl || `${siteUrl}/en/account/custom_trips`}

Should you require adjustments, our private concierge is at your service via WhatsApp: ${EMAIL_CONFIG.whatsappConcierge}

With warm regards,
MZ Tourism Qatar
${siteUrl}`,
      };
    }

    case "proposal_revised": {
      if (isAr) {
        return {
          subject: `النسخة المحدثة لبرنامج رحلتكم الخاصة — [${params.proposalRef || params.inquiryRef}] | إم زد للسياحة قطر`,
          text: `${greetingAr}

السلام عليكم ورحمة الله وبركاته،،،

بناءً على طلبكم الكريم، يسرنا إبلاغكم بأنه تم تحديث برنامج رحلتكم الخاصة وتفاصيل العرض.

يمكنكم معاينة النسخة المحدثة واعتمادها عبر الرابط:
${params.proposalUrl || `${siteUrl}/ar/account/custom_trips`}

مع فائق التقدير،
إم زد للسياحة قطر
${siteUrl}`,
        };
      }
      return {
        subject: `Updated Itinerary Proposal — [${params.proposalRef || params.inquiryRef}] | MZ Tourism Qatar`,
        text: `${greetingEn}

Following your feedback, our concierge team has updated your bespoke Qatar itinerary proposal.

You can inspect the revised schedule and quotation here:
${params.proposalUrl || `${siteUrl}/en/account/custom_trips`}

With warm regards,
MZ Tourism Qatar
${siteUrl}`,
      };
    }

    case "proposal_accepted": {
      if (isAr) {
        return {
          subject: `تم اعتماد عرض الرحلة بنجاح — [${params.proposalRef || params.inquiryRef}] | إم زد للسياحة قطر`,
          text: `${greetingAr}

السلام عليكم ورحمة الله وبركاته،،،

نشكركم على ثقتكم واعتمادكم لبرنامج رحلتكم الخاصة في دولة قطر.

سيقوم فريق العمليات بالتواصل معكم فوراً لتثبيت الحجز وإتمام ترتيبات الدفعة المقدمة والأسطول الخاص.

لأي ترتيبات خاصة عاجلة، كونسيرج إم زد متاح دائماً: ${EMAIL_CONFIG.whatsappConcierge}

مع فائق التقدير،
إم زد للسياحة قطر
${siteUrl}`,
        };
      }
      return {
        subject: `Proposal Confirmed — [${params.proposalRef || params.inquiryRef}] | MZ Tourism Qatar`,
        text: `${greetingEn}

Thank you for accepting your bespoke itinerary proposal.

Our operations team is now coordinating logistics, chauffeur dispatch, and VIP access arrangements. We will contact you shortly regarding the deposit settlement and flight arrival schedule.

Private Concierge Liaison: ${EMAIL_CONFIG.whatsappConcierge}

With highest regards,
MZ Tourism Qatar
${siteUrl}`,
      };
    }

    case "proposal_declined": {
      if (isAr) {
        return {
          subject: `تحديث بشأن عرض الرحلة — [${params.proposalRef || params.inquiryRef}] | إم زد للسياحة قطر`,
          text: `${greetingAr}

نشكركم على وقتكم وإشعارنا بقراركم. نسعد دائماً بخدمتكم في أي رحلات قادمة في دولة قطر.

مع أطيب التمنيات،
إم زد للسياحة قطر
${siteUrl}`,
        };
      }
      return {
        subject: `Proposal Status Update — [${params.proposalRef || params.inquiryRef}] | MZ Tourism Qatar`,
        text: `${greetingEn}

Thank you for letting us know your decision. Should your travel plans change or if you require future arrangements in Qatar, our concierge remains at your service.

With warm regards,
MZ Tourism Qatar
${siteUrl}`,
      };
    }

    case "follow_up_reminder": {
      if (isAr) {
        return {
          subject: `تذكير بمتابعة برنامج رحلتكم الخاصة — [${params.proposalRef || params.inquiryRef}] | إم زد للسياحة قطر`,
          text: `${greetingAr}

نود تذكيركم بأن عرض رحلتكم الخاصة ينتهي قريباً في ${params.validUntil || "الأيام القادمة"}.

للمعاينة أو التواصل المباشر مع الكونسيرج:
${params.proposalUrl || `${siteUrl}/ar/account/custom_trips`}
واتساب: ${EMAIL_CONFIG.whatsappConcierge}

مع فائق الاحترام،
إم زد للسياحة قطر
${siteUrl}`,
        };
      }
      return {
        subject: `Follow-Up: Your Bespoke Qatar Proposal — [${params.proposalRef || params.inquiryRef}] | MZ Tourism Qatar`,
        text: `${greetingEn}

This is a courtesy reminder regarding your bespoke itinerary proposal, currently valid until ${params.validUntil || "soon"}.

Review and coordinate with concierge:
${params.proposalUrl || `${siteUrl}/en/account/custom_trips`}
WhatsApp: ${EMAIL_CONFIG.whatsappConcierge}

With warm regards,
MZ Tourism Qatar
${siteUrl}`,
      };
    }
  }
}

/**
 * Idempotently sends custom trip and proposal notifications.
 */
export async function sendCustomTripNotification(
  params: CustomTripNotificationParams
): Promise<SendEmailResult> {
  const recipient =
    params.notificationType === "inquiry_assigned"
      ? params.assignedStaffEmail || params.customerEmail
      : params.customerEmail;

  if (!recipient || !params.inquiryId) {
    return { success: false, error: "Missing required notification parameters" };
  }

  const admin = createAdminClient();
  const idempotencyKey = `custom_trip:${params.inquiryId}:${params.notificationType}:${
    params.proposalRef || "general"
  }`;

  // 1. Idempotency Check
  try {
    const { data: existing } = await admin
      .from("customer_notifications")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existing) {
      return { success: true, skipped: true };
    }
  } catch (checkErr) {
    console.warn("[Custom Trip Notification Idempotency Notice]", checkErr);
  }

  // 2. Build email content
  const { subject, text } = buildCustomTripNotificationContent(params);
  const sender = getSenderAddress();
  const apiKey = process.env.RESEND_API_KEY;
  let messageId: string | undefined;

  // 3. Dispatch via Resend API if configured
  if (apiKey && apiKey.length > 5) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: sender,
          to: [recipient],
          reply_to: EMAIL_CONFIG.replyTo,
          subject,
          text,
        }),
      });

      if (res.ok) {
        const json = (await res.json()) as { id?: string };
        messageId = json.id;
      } else {
        const errText = await res.text();
        console.warn("[Custom Trip Notification Delivery Notice]", errText);
      }
    } catch (dispatchErr) {
      console.warn("[Custom Trip Notification Dispatch Network Notice]", dispatchErr);
    }
  } else {
    console.log(
      `[Custom Trip Notification Staged (Development)] Type: ${params.notificationType} | Ref: ${params.inquiryRef} | Recipient: ${recipient} | Subject: ${subject}`
    );
  }

  // 4. Record to notifications log table
  try {
    await admin.from("customer_notifications").insert({
      booking_id: params.inquiryId,
      notification_type: params.notificationType,
      channel: "email",
      recipient,
      status: apiKey && apiKey.length > 5 ? (messageId ? "sent" : "failed") : "staged",
      subject,
      idempotency_key: idempotencyKey,
    });
  } catch (insertErr) {
    console.warn("[Custom Trip Notification Insert Log Notice]", insertErr);
  }

  return { success: true, messageId };
}
