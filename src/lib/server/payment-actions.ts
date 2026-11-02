"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdminAccess } from "./cms-actions";
import {
  getQatarPaymentSettings,
  updateQatarPaymentSettings,
  type QatarPaymentSettings,
  type QatarBankTransferConfig,
} from "@/lib/payments/qatar-payment-config";
import {
  getCardGatewayStatus,
  type CardGatewayStatus,
} from "@/lib/payments/card-gateway";
import {
  qatarPaymentSettingsSchema,
  type QatarPaymentSettingsInput,
} from "@/lib/validations/booking-schemas";

export interface PublicPaymentConfigResponse {
  success: boolean;
  bankTransfer: QatarBankTransferConfig;
  cardGateway: CardGatewayStatus;
  bankTransferEnabled: boolean;
  cardPaymentEnabled: boolean;
  officePaymentEnabled: boolean;
  officeAddressEn: string;
  officeAddressAr: string;
  currency: "QAR";
}

export interface AdminPaymentReconciliationItem {
  bookingId: string;
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  serviceId: string;
  departureDate: string | null;
  bookingStatus: string;
  paymentStatus: string;
  depositRequired: number;
  depositPaid: number;
  balanceDue: number;
  currency: string;
  proofId?: string | null;
  proofReviewStatus?: string | null;
  proofPaymentMethod?: string | null;
  proofAmountSubmitted?: number | null;
  proofTransactionRef?: string | null;
  proofUploadedAt?: string | null;
  proofStoragePath?: string | null;
  rejectionReason?: string | null;
}

/**
 * Returns Qatar payment configuration safe for public / guest display.
 */
export async function getQatarPaymentPublicConfigAction(): Promise<PublicPaymentConfigResponse> {
  const settings = getQatarPaymentSettings();
  const cardGateway = getCardGatewayStatus();

  return {
    success: true,
    bankTransfer: settings.bankTransfer,
    cardGateway,
    bankTransferEnabled: settings.bankTransferEnabled,
    cardPaymentEnabled: settings.cardPaymentEnabled,
    officePaymentEnabled: settings.officePaymentEnabled,
    officeAddressEn: settings.officeAddressEn,
    officeAddressAr: settings.officeAddressAr,
    currency: "QAR",
  };
}

/**
 * Administrative action to get full Qatar payment and banking settings.
 */
export async function getAdminPaymentSettingsAction(): Promise<{
  success: boolean;
  settings?: QatarPaymentSettings;
  cardGateway?: CardGatewayStatus;
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const settings = getQatarPaymentSettings();
    const cardGateway = getCardGatewayStatus();

    return {
      success: true,
      settings,
      cardGateway,
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message || "Unauthorized access to payment settings.",
    };
  }
}

/**
 * Administrative action to update Qatar bank coordinates and payment policies.
 */
export async function updateAdminPaymentSettingsAction(
  rawInput: QatarPaymentSettingsInput
): Promise<{
  success: boolean;
  settings?: QatarPaymentSettings;
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const parsed = qatarPaymentSettingsSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const {
      accountHolderName,
      bankName,
      iban,
      accountNumber,
      swiftBic,
      transferReferenceInstructionsEn,
      transferReferenceInstructionsAr,
      depositPercentage,
      paymentTypeDue,
      bankTransferEnabled,
      cardPaymentEnabled,
      officePaymentEnabled,
    } = parsed.data;

    const updated = updateQatarPaymentSettings({
      bankTransfer: {
        isConfigured: Boolean(iban && bankName && accountHolderName),
        accountHolderName: accountHolderName || null,
        bankName: bankName || null,
        iban: iban || null,
        accountNumber: accountNumber || null,
        swiftBic: swiftBic || null,
        currency: "QAR",
        paymentTypeDue,
        depositPercentage,
        transferReferenceInstructionsEn:
          transferReferenceInstructionsEn ||
          "Please initiate your bank transfer from any Qatar bank (QNB, QIB, CBQ, etc.). Mandatory: Quote your unique Booking Reference in the transfer memo/remarks. Upload your official bank transfer receipt below for finance verification.",
        transferReferenceInstructionsAr:
          transferReferenceInstructionsAr ||
          "يرجى تنفيذ التحويل المصرفي من أي بنك داخل دولة قطر (بنك قطر الوطني، مصرف قطر الإسلامي، التجاري، إلخ). تنبيه إلزامي: يرجى كتابة رمز الحجز في خانة ملاحظات التحويل ورفع الإيصال الرسمي بالأسفل لتدقيقه من قسم المالية.",
        unconfiguredNoticeEn:
          "Bank transfer setup pending. Our corporate Qatar bank coordinates are currently being finalized with our financial institution. Please contact our concierge via WhatsApp to receive direct verified payment instructions.",
        unconfiguredNoticeAr:
          "إعداد التحويل البنكي قيد التهيئة. تفاصيل الحساب المصرفي للشركة قيد الاعتماد النهائي مع مصرفنا المحلي. يرجى التواصل مع الكونسيرج عبر واتساب للحصول على تفاصيل السداد المعتمدة.",
      },
      depositDefaultPercentage: depositPercentage,
      paymentTypeDue,
      bankTransferEnabled,
      cardPaymentEnabled,
      officePaymentEnabled,
    });

    return {
      success: true,
      settings: updated,
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message || "Failed to update payment settings.",
    };
  }
}

/**
 * Returns comprehensive payment and deposit reconciliation ledger for authorized admin.
 */
export async function getPaymentReconciliationLedgerAction(): Promise<{
  success: boolean;
  ledger?: AdminPaymentReconciliationItem[];
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();

    // Fetch bookings with deposit proofs
    const { data: bookings, error: bError } = await admin
      .from("bookings")
      .select("id, booking_ref, customer_name, customer_email, customer_phone, service_id, departure_date, booking_status, payment_status, deposit_required, deposit_paid, balance_due, currency, created_at")
      .order("created_at", { ascending: false });

    if (bError) {
      console.error("[Reconciliation Ledger Error]", bError);
      return { success: false, error: "Failed to load bookings for reconciliation." };
    }

    const { data: proofs, error: pError } = await admin
      .from("deposit_proofs")
      .select("id, booking_id, review_status, payment_method, custom_payment_method, amount_submitted, transaction_ref, uploaded_at, storage_path, rejection_reason")
      .order("uploaded_at", { ascending: false });

    if (pError) {
      console.error("[Reconciliation Proofs Error]", pError);
    }

    const safeProofs = proofs || [];
    const proofMap = new Map<string, (typeof safeProofs)[number]>();
    safeProofs.forEach((p) => {
      if (!proofMap.has(p.booking_id)) {
        proofMap.set(p.booking_id, p);
      }
    });

    const ledger: AdminPaymentReconciliationItem[] = (bookings || []).map((b) => {
      const p = proofMap.get(b.id);
      return {
        bookingId: b.id,
        bookingRef: b.booking_ref,
        customerName: b.customer_name,
        customerEmail: b.customer_email,
        customerPhone: b.customer_phone,
        serviceId: b.service_id,
        departureDate: b.departure_date,
        bookingStatus: b.booking_status,
        paymentStatus: b.payment_status,
        depositRequired: Number(b.deposit_required || 0),
        depositPaid: Number(b.deposit_paid || 0),
        balanceDue: Number(b.balance_due || 0),
        currency: b.currency || "QAR",
        proofId: p?.id || null,
        proofReviewStatus: p?.review_status || null,
        proofPaymentMethod: p?.custom_payment_method || p?.payment_method || null,
        proofAmountSubmitted: p ? Number(p.amount_submitted) : null,
        proofTransactionRef: p?.transaction_ref || null,
        proofUploadedAt: p?.uploaded_at || null,
        proofStoragePath: p?.storage_path || null,
        rejectionReason: p?.rejection_reason || null,
      };
    });

    return {
      success: true,
      ledger,
    };
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message || "Failed to load payment reconciliation ledger.",
    };
  }
}
