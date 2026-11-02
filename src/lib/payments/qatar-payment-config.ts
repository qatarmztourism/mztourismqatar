/**
 * MZ Tourism Qatar — Qatar Payment & Banking Configuration
 *
 * Implements Qatar bank transfer coordinates, deposit policy, payment method toggles,
 * and gateway configuration.
 *
 * CRITICAL REQUIREMENT:
 * Never display placeholder bank details as real verified details.
 * When verified coordinates are not configured, `isConfigured` is false and the UI displays
 * "Bank transfer setup pending" with a direct concierge contact CTA.
 */

export interface QatarBankTransferConfig {
  isConfigured: boolean;
  accountHolderName: string | null;
  bankName: string | null;
  iban: string | null;
  accountNumber: string | null;
  swiftBic: string | null;
  currency: "QAR";
  paymentTypeDue: "deposit" | "full";
  depositPercentage: number;
  transferReferenceInstructionsEn: string;
  transferReferenceInstructionsAr: string;
  unconfiguredNoticeEn: string;
  unconfiguredNoticeAr: string;
}

export interface QatarPaymentSettings {
  bankTransfer: QatarBankTransferConfig;
  bankTransferEnabled: boolean;
  cardPaymentEnabled: boolean;
  officePaymentEnabled: boolean;
  officeAddressEn: string;
  officeAddressAr: string;
  depositDefaultPercentage: number;
  paymentTypeDue: "deposit" | "full";
}

// In-memory runtime state that can be configured by administrators
let runtimeQatarPaymentSettings: QatarPaymentSettings = {
  bankTransfer: {
    isConfigured: Boolean(process.env.QATAR_BANK_IBAN && process.env.QATAR_BANK_NAME),
    accountHolderName: process.env.QATAR_BANK_ACCOUNT_HOLDER || null,
    bankName: process.env.QATAR_BANK_NAME || null,
    iban: process.env.QATAR_BANK_IBAN || null,
    accountNumber: process.env.QATAR_BANK_ACCOUNT_NUMBER || null,
    swiftBic: process.env.QATAR_BANK_SWIFT || null,
    currency: "QAR",
    paymentTypeDue: (process.env.QATAR_PAYMENT_TYPE_DUE as "deposit" | "full") || "deposit",
    depositPercentage: 30,
    transferReferenceInstructionsEn:
      "Please initiate your bank transfer from any Qatar bank (QNB, QIB, CBQ, etc.). Mandatory: Quote your unique Booking Reference in the transfer memo/remarks. Upload your official bank transfer receipt below for finance verification.",
    transferReferenceInstructionsAr:
      "يرجى تنفيذ التحويل المصرفي من أي بنك داخل دولة قطر (بنك قطر الوطني، مصرف قطر الإسلامي، التجاري، إلخ). تنبيه إلزامي: يرجى كتابة رمز الحجز في خانة ملاحظات التحويل ورفع الإيصال الرسمي بالأسفل لتدقيقه من قسم المالية.",
    unconfiguredNoticeEn:
      "Bank transfer setup pending. Our corporate Qatar bank coordinates are currently being finalized with our financial institution. Please contact our concierge via WhatsApp to receive direct verified payment instructions or arrange office settlement.",
    unconfiguredNoticeAr:
      "إعداد التحويل البنكي قيد التهيئة. تفاصيل الحساب المصرفي للشركة قيد الاعتماد النهائي مع مصرفنا المحلي. يرجى التواصل مع الكونسيرج عبر واتساب للحصول على تفاصيل السداد المعتمدة أو ترتيب السداد في مكتبنا.",
  },
  bankTransferEnabled: true,
  cardPaymentEnabled: false, // Default false until merchant credentials are fully configured
  officePaymentEnabled: true,
  officeAddressEn: "West Bay Diplomatic District, Doha, State of Qatar",
  officeAddressAr: "منطقة الخليج الغربي الدبلوماسية، الدوحة، دولة قطر",
  depositDefaultPercentage: 30,
  paymentTypeDue: "deposit",
};

/**
 * Retrieves the current Qatar payment settings.
 */
export function getQatarPaymentSettings(): QatarPaymentSettings {
  // Re-evaluate isConfigured based on IBAN and bank name
  const isConfigured = Boolean(
    runtimeQatarPaymentSettings.bankTransfer.iban &&
      runtimeQatarPaymentSettings.bankTransfer.bankName &&
      runtimeQatarPaymentSettings.bankTransfer.accountHolderName
  );

  return {
    ...runtimeQatarPaymentSettings,
    bankTransfer: {
      ...runtimeQatarPaymentSettings.bankTransfer,
      isConfigured,
    },
  };
}

/**
 * Updates Qatar payment settings at runtime (used by admin portal).
 */
export function updateQatarPaymentSettings(
  partial: Partial<QatarPaymentSettings>
): QatarPaymentSettings {
  runtimeQatarPaymentSettings = {
    ...runtimeQatarPaymentSettings,
    ...partial,
    bankTransfer: {
      ...runtimeQatarPaymentSettings.bankTransfer,
      ...(partial.bankTransfer || {}),
    },
  };

  // Keep deposit default percentage in sync
  if (partial.depositDefaultPercentage !== undefined) {
    runtimeQatarPaymentSettings.bankTransfer.depositPercentage = partial.depositDefaultPercentage;
  }
  if (partial.paymentTypeDue !== undefined) {
    runtimeQatarPaymentSettings.bankTransfer.paymentTypeDue = partial.paymentTypeDue;
  }

  return getQatarPaymentSettings();
}
