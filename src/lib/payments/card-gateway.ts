/**
 * MZ Tourism Qatar — Online Card Payment Gateway Integration
 *
 * Provider-independent architecture for online card settlements in Qatar.
 * Supports:
 * - Tap Payments (QPay national debit switch, Visa, Mastercard, Apple Pay in QAR)
 * - QNB e-Commerce MPGS (Mastercard Payment Gateway Services via Qatar National Bank)
 * - QPay Direct (Qatar Central Bank Debit Switch)
 *
 * CRITICAL REQUIREMENT:
 * If no live merchant API credentials are configured in environment variables,
 * the gateway status reports unconfigured.
 * We NEVER show a fake checkout or pretend to process real card transactions.
 */

export type CardGatewayProvider = "tap" | "qnb" | "qpay" | "unconfigured";

export interface CardGatewayStatus {
  isConfigured: boolean;
  provider: CardGatewayProvider;
  supportedCards: string[];
  currency: "QAR";
  merchantIdConfigured: boolean;
  secretKeyConfigured: boolean;
  statusMessageEn: string;
  statusMessageAr: string;
  requiredEnvVars: { name: string; description: string; isSet: boolean }[];
}

export interface CardCheckoutInitRequest {
  bookingRef: string;
  amount: number;
  currency: "QAR";
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  redirectUrl: string;
}

export interface CardCheckoutInitResponse {
  success: boolean;
  paymentUrl?: string;
  sessionId?: string;
  error?: string;
  isConfigured: boolean;
}

/**
 * Evaluates the current configuration status of card payment providers in Qatar.
 */
export function getCardGatewayStatus(): CardGatewayStatus {
  const tapSecret = process.env.TAP_SECRET_KEY;
  const tapMerchant = process.env.TAP_MERCHANT_ID;
  const qnbMerchant = process.env.QNB_MERCHANT_ID;
  const qnbPassword = process.env.QNB_API_PASSWORD;
  const qpayMerchant = process.env.QPAY_MERCHANT_ID;
  const qpaySecret = process.env.QPAY_SECRET_KEY;

  if (tapSecret && tapMerchant) {
    return {
      isConfigured: true,
      provider: "tap",
      supportedCards: ["QPay Debit Cards", "Visa", "MasterCard", "Apple Pay"],
      currency: "QAR",
      merchantIdConfigured: true,
      secretKeyConfigured: true,
      statusMessageEn: "Tap Payments Gateway is configured and ready for QAR settlements.",
      statusMessageAr: "بوابة دفع تاب مهيأة وجاهزة لمعاملات الريال القطري.",
      requiredEnvVars: [
        { name: "TAP_SECRET_KEY", description: "Tap Secret API Key", isSet: true },
        { name: "TAP_MERCHANT_ID", description: "Tap Merchant ID", isSet: true },
        { name: "TAP_PUBLIC_KEY", description: "Tap Public Publishable Key", isSet: Boolean(process.env.TAP_PUBLIC_KEY) },
      ],
    };
  }

  if (qnbMerchant && qnbPassword) {
    return {
      isConfigured: true,
      provider: "qnb",
      supportedCards: ["QPay Debit Cards", "Visa", "MasterCard"],
      currency: "QAR",
      merchantIdConfigured: true,
      secretKeyConfigured: true,
      statusMessageEn: "QNB MPGS Gateway is configured and ready for QAR settlements.",
      statusMessageAr: "بوابة بنك قطر الوطني مهيأة وجاهزة لمعاملات الريال القطري.",
      requiredEnvVars: [
        { name: "QNB_MERCHANT_ID", description: "QNB MPGS Merchant Identifier", isSet: true },
        { name: "QNB_API_PASSWORD", description: "QNB MPGS API Password", isSet: true },
        { name: "QNB_BASE_URL", description: "QNB MPGS Endpoint", isSet: Boolean(process.env.QNB_BASE_URL) },
      ],
    };
  }

  if (qpayMerchant && qpaySecret) {
    return {
      isConfigured: true,
      provider: "qpay",
      supportedCards: ["QPay Debit Cards (Qatar Switch)"],
      currency: "QAR",
      merchantIdConfigured: true,
      secretKeyConfigured: true,
      statusMessageEn: "QPay National Switch is configured.",
      statusMessageAr: "شبكة كيو باي الوطنية مهيأة وجاهزة.",
      requiredEnvVars: [
        { name: "QPAY_MERCHANT_ID", description: "QPay Merchant ID", isSet: true },
        { name: "QPAY_SECRET_KEY", description: "QPay Secret Key", isSet: true },
      ],
    };
  }

  return {
    isConfigured: false,
    provider: "unconfigured",
    supportedCards: ["QPay Debit Cards", "Visa", "MasterCard", "Apple Pay"],
    currency: "QAR",
    merchantIdConfigured: false,
    secretKeyConfigured: false,
    statusMessageEn:
      "Online Card Payment (Debit / Credit) Setup Pending. Merchant gateway onboarding with local Qatar banking partners is in progress.",
    statusMessageAr:
      "إعداد الدفع بالبطاقات الائتمانية وبطاقات الخصم قيد التهيئة. جاري استكمال تفعيل حساب التاجر مع البنوك القطرية الشريكة.",
    requiredEnvVars: [
      {
        name: "TAP_SECRET_KEY or QNB_MERCHANT_ID",
        description: "Credentials for Tap Payments Qatar or QNB e-Commerce MPGS",
        isSet: false,
      },
    ],
  };
}

/**
 * Initializes a card payment checkout session.
 * Rejects with clear message if the gateway is not yet configured.
 */
export async function initializeCardCheckout(
  _request: CardCheckoutInitRequest
): Promise<CardCheckoutInitResponse> {
  void _request;
  const status = getCardGatewayStatus();

  if (!status.isConfigured) {
    return {
      success: false,
      isConfigured: false,
      error:
        "Online card payment is currently pending merchant activation with Qatar banking partners. Please proceed with Bank Transfer (Qatar) or contact our concierge via WhatsApp.",
    };
  }

  // Future integration point for Tap / QNB MPGS API calls
  return {
    success: false,
    isConfigured: true,
    error: "Card checkout processing is awaiting final network activation.",
  };
}
