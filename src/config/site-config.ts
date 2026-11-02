/**
 * MZ Tourism Qatar - Central Configuration
 * All client details, WhatsApp numbers, licensing, and contact points are configured here.
 * Notice: Clear placeholders are marked for client confirmation before official launch.
 */

export const siteConfig = {
  brand: {
    name: "MZ Tourism Qatar",
    nameShort: "MZ Tourism",
    nameAr: "إم زد للسياحة قطر",
    nameShortAr: "إم زد للسياحة",
    slogan: "Luxury Tours & Bespoke Arabian Concierge",
    sloganAr: "جولات فاخرة وخدمات الضيافة العربية الراقية",
    location: "Doha, Qatar",
    locationAr: "الدوحة، قطر",
    establishedNote: "Qatar Tourism Specialized Operator",
    establishedNoteAr: "مشغل معتمد لرحلات قطر السياحية الفاخرة",
  },
  whatsapp: {
    // Central WhatsApp phone number used across all inquiry CTAs
    number: "97470386705",
    display: "+974 7038 6705",
    displayWithNote: "+974 7038 6705",
    isPlaceholder: false,
  },
  social: {
    facebook: "",
    instagram: "",
  },
  contact: {
    phone: "+974 7038 6705",
    email: "qatarmztourism@gmail.com",
    location: "Doha, Qatar",
    locationAr: "الدوحة، قطر",
    addressEn: "West Bay Diplomatic District, P.O. Box 0000, Doha, State of Qatar [Placeholder]",
    addressAr: "منطقة الخليج الغربي الدبلوماسية، ص.ب 0000، الدوحة، دولة قطر [عنوان قيد تأكيد العميل]",
    licenseBadgeEn: "Qatar Tourism Licensed Operator [License: Pending Client Confirmation #QT-XXXX]",
    licenseBadgeAr: "مرخص من قطر للسياحة [الترخيص: قيد تأكيد العميل #QT-XXXX]",
    licenseNumber: "QT-XXXX [Pending Client Confirmation]",
    commercialRegistration: "CR-XXXXXX [Pending Client Confirmation]",
  },
  pricingDisclaimer: {
    en: "[Note: Indicative pricing placeholder. Official rate card pending client confirmation]",
    ar: "[ملاحظة: أسعار استرشادية قيد اعتماد العميل الرسمي]",
  },
  reviewDisclaimer: {
    en: "[Note: Guest testimonial placeholder - pending real verified client reviews]",
    ar: "[ملاحظة: نماذج استرشادية لآراء الضيوف - بانتظار المراجعات الموثقة للعميل]",
  },
  bookingPolicy: {
    en: "Important: WhatsApp inquiries send a pre-filled request to our concierge. All itineraries, vehicle dispatches, and dates are confirmed directly with our team upon review. No automated payment is processed online.",
    ar: "تنبيه هام: استفسارات واتساب ترسل طلباً مسبق التنسيق إلى فريق الاستقبال. يتم تأكيد جميع المسارات والمركبات والتواريخ مباشرة بعد المراجعة. لا يتم تنفيذ أي دفع إلكتروني تلقائي.",
  },
  paymentInstructions: {
    // Strictly false: The business owner has not yet configured or confirmed specific corporate bank coordinates
    isConfigured: false,
    unconfiguredNoticeEn:
      "Payment instructions will be provided directly by our concierge team upon itinerary review. Viewing instructions or submitting a deposit receipt does not immediately confirm the reservation; manual staff verification is required.",
    unconfiguredNoticeAr:
      "سيتم تزويدكم بتعليمات الدفع وتفاصيل السداد مباشرة من قبل فريق الكونسيرج بعد مراجعة خطة الرحلة. يرجى العلم بأن الاطلاع على التعليمات أو رفع إيصال التحويل لا يعني التأكيد الفوري للحجز، حيث يتطلب ذلك تدقيقاً ومطابقة من إدارة العمليات.",
    // Future placeholders for when client provides verified banking coordinates
    beneficiaryName: null,
    bankName: null,
    accountNumber: null,
    iban: null,
    swiftBic: null,
    currency: "QAR",
  },
  domain: {
    get baseUrl(): string {
      return getBaseUrl();
    },
    defaultDomain: "mztourismqatar.qa",
  },
};

/**
 * Resolves the application canonical base URL from environment variables,
 * falling back to the intended production domain mztourismqatar.qa without hardcoding it locally.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim().length > 0) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim().length > 0) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim().length > 0) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "https://mztourismqatar.qa";
}

/**
 * Generates an encoded WhatsApp inquiry link with prefilled context
 */
export function getWhatsAppInquiryUrl(message: string, customNumber?: string): string {
  const target = customNumber && customNumber.trim().length > 0 ? customNumber : siteConfig.whatsapp.number;
  const cleanNumber = target.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
