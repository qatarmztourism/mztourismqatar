"use server";

import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserAction } from "./auth-actions";
import {
  cmsSiteSettingsSchema,
  cmsHomepageSectionSchema,
  cmsPageSchema,
  cmsFaqSchema,
  cmsTestimonialSchema,
  cmsNavigationSchema,
  sanitizeHtmlContent,
  type CmsSiteSettingsInput,
  type CmsHomepageSectionInput,
  type CmsPageInput,
  type CmsFaqInput,
  type CmsTestimonialInput,
  type CmsNavigationInput,
} from "@/lib/validations/cms-schemas";
import { siteConfig } from "@/config/site-config";
import type { Database, Json } from "@/lib/supabase/database.types";

type CmsSiteSettingsRow = Database["public"]["Tables"]["cms_site_settings"]["Row"];
type CmsHomepageSectionRow = Database["public"]["Tables"]["cms_homepage_sections"]["Row"];
type CmsPageRow = Database["public"]["Tables"]["cms_pages"]["Row"];
type CmsFaqRow = Database["public"]["Tables"]["cms_faqs"]["Row"];
type CmsTestimonialRow = Database["public"]["Tables"]["cms_testimonials"]["Row"];
type CmsNavigationRow = Database["public"]["Tables"]["cms_navigation"]["Row"];
type CmsMediaRow = Database["public"]["Tables"]["cms_media"]["Row"];

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
];
const MAX_MEDIA_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(val?: string | null): boolean {
  if (!val || typeof val !== "string") return false;
  return UUID_REGEX.test(val.trim());
}

// =============================================================================
// RBAC AUTHORIZATION HELPERS
// =============================================================================

export async function assertAdminAccess() {
  const session = await getCurrentUserAction();
  if (!session.success || !session.data || !session.data.isAdmin) {
    throw new Error("Unauthorized: Staff or administrator clearance required.");
  }
  return session.data;
}

export async function assertSuperAdminAccess() {
  const session = await assertAdminAccess();
  if (session.adminRole !== "super_admin") {
    throw new Error("Forbidden: Super Administrator clearance required.");
  }
  return session;
}

// =============================================================================
// SEED & FALLBACK DEFAULTS
// =============================================================================

const DEFAULT_SITE_SETTINGS = {
  id: "00000000-0000-0000-0000-000000000001",
  site_title_en: siteConfig.brand.name + " | Luxury Travel & Bespoke VIP Concierge",
  site_title_ar: siteConfig.brand.nameAr + " | رحلات سياحية فاخرة وخدمات كونسيرج خاصة",
  site_tagline_en: siteConfig.brand.slogan,
  site_tagline_ar: siteConfig.brand.sloganAr,
  site_description_en:
    "Curated private desert expeditions, luxury dhow charters, helicopter skyline tours, and bespoke cultural itineraries across Qatar and the GCC.",
  site_description_ar:
    "رحلات صحراوية خاصة منسقة، يخوت وبانوشات فاخرة، جولات طيران مروحي فوق أفق الدوحة، وتجارب ثقافية مخصصة في قطر والخليج العربي.",
  contact_email: siteConfig.contact.email,
  contact_phone: siteConfig.contact.phone,
  contact_whatsapp: siteConfig.whatsapp.display,
  contact_address_en: siteConfig.contact.addressEn,
  contact_address_ar: siteConfig.contact.addressAr,
  social_instagram: "https://instagram.com/mztourismqatar",
  social_facebook: "https://facebook.com/mztourismqatar",
  social_twitter: "https://twitter.com/mztourismqatar",
  social_linkedin: "https://linkedin.com/company/mztourismqatar",
  seo_og_image: "/images/qatar-desert-hero.jpg",
  seo_canonical_url: "https://mztourismqatar.com",
  footer_about_en:
    "MZ Tourism Qatar crafts peerless Arabian journeys for heads of state, corporate leaders, and discerning international travelers. Licensed Qatar Tourism operator.",
  footer_about_ar:
    "تقدم إم زد للسياحة قطر تجارب سفر استثنائية لكبار الشخصيات ورواد الأعمال والزوار الباحثين عن الرفاهية والخصوصية التامة في دولة قطر.",
  deposit_default_percentage: 30,
  payment_bank_transfer_instructions_en:
    "Please initiate your bank transfer from any Qatar bank (QNB, QIB, CBQ, etc.). Mandatory: Quote your unique Booking Reference in the transfer memo/remarks. Upload your official bank transfer receipt for finance verification.",
  payment_bank_transfer_instructions_ar:
    "يرجى تنفيذ التحويل المصرفي من أي بنك داخل دولة قطر (بنك قطر الوطني، مصرف قطر الإسلامي، التجاري، إلخ). تنبيه إلزامي: يرجى كتابة رمز الحجز في خانة ملاحظات التحويل ورفع الإيصال الرسمي لتدقيقه من قسم المالية.",
  payment_cash_office_instructions_en:
    "Cash settlements are welcomed at our concierge headquarters in West Bay Diplomatic District, Doha. Our finance officer will issue a stamped official voucher upon receipt.",
  payment_cash_office_instructions_ar:
    "نرحب بالسداد النقدي في مقر الكونسيرج بمنطقة الخليج الغربي الدبلوماسية بالدوحة. سيقوم موظف المالية بتسليمكم سند قبض معتمد ومختوم.",
  payment_other_instructions_en:
    "For custom, corporate or third-party payment arrangements, coordinate directly with our operations desk and provide full settlement documentation.",
  payment_other_instructions_ar:
    "لترتيبات الدفع الخاصة أو المؤسسية أو عبر أطراف أخرى، يرجى التنسيق مع إدارة العمليات وتقديم كافة وثائق السداد المعتمدة.",
  updated_at: new Date().toISOString(),
  updated_by: null,
} as unknown as CmsSiteSettingsRow;

const DEFAULT_HOMEPAGE_SECTIONS: CmsHomepageSectionRow[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    section_key: "hero",
    title_en: "Uncompromising Arabian Luxury Across Qatar",
    title_ar: "قمة الفخامة العربية والضيافة الرفيعة في قطر",
    subtitle_en: "Curated Private Expeditions, Superyacht Charters & Bespoke VIP Concierge",
    subtitle_ar: "رحلات خاصة منسقة، استئجار يخوت فاخرة وخدمات كونسيرج لكبار الشخصيات",
    content_en:
      "From the golden dunes of the Inland Sea to sovereign helicopter charters above Doha's glittering skyline, MZ Tourism Qatar orchestrates transcendent journeys with discretion, heritage, and timeless luxury.",
    content_ar:
      "من الكثبان الذهبية في خور العديد إلى جولات الهليكوبتر الملكية فوق أفق الدوحة، تصمم إم زد للسياحة قطر تجارب سفر استثنائية تتسم بالخصوصية والعرقة والأناقة الفائقة.",
    media_url: "/images/qatar-desert-hero.jpg",
    cta_primary_label_en: "Explore Catalog",
    cta_primary_label_ar: "استكشف الباقات",
    cta_primary_url: "/services",
    cta_secondary_label_en: "VIP Concierge Inquiry",
    cta_secondary_label_ar: "طلب استشارة خاصة",
    cta_secondary_url: "#inquiry",
    metadata: {} as Json,
    display_order: 10,
    is_enabled: true,
    updated_at: new Date().toISOString(),
    updated_by: null,
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    section_key: "why_us",
    title_en: "The Standards of MZ Tourism Qatar",
    title_ar: "معايير إم زد للسياحة قطر",
    subtitle_en: "Why Discerning Travellers Choose Our Concierge",
    subtitle_ar: "لماذا يفضل ضيوفنا النخبة خدماتنا المتميزة",
    content_en:
      "Four foundational pillars define every experience: Sovereign Discretion, Curated Fleet Excellence, Deep Heritage Authority, and Unwavering 24/7 Operations Support.",
    content_ar:
      "ترتكز تجاربنا على أربعة أسس راسخة: الخصوصية التامة لكبار الضيوف، أسطول حديث فاره، إرث ثقافي وتراثي أصيل، ودعم عملياتي متواصل على مدار الساعة.",
    media_url: null,
    cta_primary_label_en: "Plan Bespoke Journey",
    cta_primary_label_ar: "صمم رحلتك الخاصة",
    cta_primary_url: "#planner",
    cta_secondary_label_en: null,
    cta_secondary_label_ar: null,
    cta_secondary_url: null,
    metadata: {} as Json,
    display_order: 20,
    is_enabled: true,
    updated_at: new Date().toISOString(),
    updated_by: null,
  },
];

const DEFAULT_PAGES: CmsPageRow[] = [
  {
    id: "20000000-0000-0000-0000-000000000001",
    slug: "about",
    title_en: "About MZ Tourism Qatar",
    title_ar: "عن إم زد للسياحة قطر",
    excerpt_en: "Qatar's premier luxury destination management company and bespoke travel architect.",
    excerpt_ar: "الشركة الرائدة في إدارة الوجهات الفاخرة وتصميم الرحلات الحصرية في دولة قطر.",
    content_en: `<h2>Distinguished Hospitality in the Heart of Arabia</h2>
<p>MZ Tourism Qatar was founded to redefine luxury travel in the State of Qatar. We curate transcendent experiences for royal delegations, corporate executives, discerning international voyagers, and families seeking authentic Arabian warmth paired with global luxury standards.</p>
<h3>Our Guiding Philosophy</h3>
<p>True luxury lies in impeccable attention to detail, complete discretion, and seamless execution. Whether traversing the dramatic sea-meeting dunes of Khor Al Adaid in private executive 4x4s or cruising along the Corniche aboard a handcrafted royal dhow, our guests experience Qatar at its most enchanting.</p>`,
    content_ar: `<h2>ضيافة أصيلة ومتميزة في قلب الخليج</h2>
<p>تأسست إم زد للسياحة قطر لترتقي بمفهوم السياحة الفاخرة في دولة قطر. نقوم بتنسيق وتنفيذ تجارب استثنائية للوفود الرسمية، والمدراء التنفيذيين، والعائلات الباحثة عن كرم الضيافة العربية المقترن بأعلى المعايير العالمية.</p>
<h3>فلسفتنا ونهجنا</h3>
<p>تكمن الفخامة الحقيقية في العناية بأدق التفاصيل، والخصوصية المطلقة، والاحترافية الكاملة في التنفيذ. وسواء كنتم تستكشفون كثبان خور العديد في رحلة سفاري خاصة أو تبحرون على متن بانوش تقليدي فاخر، فإننا نضمن لكم تجربة لا تُنسى في قطر.</p>`,
    hero_image: "/images/qatar-desert-hero.jpg",
    meta_title_en: "About Us | MZ Tourism Qatar",
    meta_title_ar: "من نحن | إم زد للسياحة قطر",
    meta_description_en: "Learn about MZ Tourism Qatar, Qatar's leading bespoke travel concierge and private tour operator.",
    meta_description_ar: "تعرف على إم زد للسياحة قطر، الشركة الرائدة في خدمات الكونسيرج وتنظيم الرحلات الفاخرة في قطر.",
    status: "published",
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
  },
  {
    id: "20000000-0000-0000-0000-000000000002",
    slug: "contact",
    title_en: "Contact Concierge Desk",
    title_ar: "تواصل مع مكتب الاستقبال والكونسيرج",
    excerpt_en: "Direct communication with our luxury operations team in Doha.",
    excerpt_ar: "تواصل مباشر مع فريق إدارة العمليات الفاخرة في الدوحة.",
    content_en: `<h2>Connect with Our VIP Concierge</h2>
<p>Our concierge desks are available 24/7 to coordinate your upcoming visit, custom private itinerary, or VIP transport arrangements in Qatar.</p>
<p><strong>Direct Line:</strong> ${siteConfig.contact.phone}</p>
<p><strong>WhatsApp Concierge:</strong> ${siteConfig.whatsapp.display}</p>
<p><strong>Email:</strong> ${siteConfig.contact.email}</p>
<p><strong>Location:</strong> ${siteConfig.contact.addressEn}</p>`,
    content_ar: `<h2>تواصل مع كونسيرج كبار الشخصيات</h2>
<p>فريقنا جاهز على مدار الساعة لتنسيق زيارتكم القادمة، وتصميم مسارات الرحلات الخاصة، وترتيبات النقل الفاخر في دولة قطر.</p>
<p><strong>الهاتف المباشر:</strong> ${siteConfig.contact.phone}</p>
<p><strong>واتساب الكونسيرج:</strong> ${siteConfig.whatsapp.display}</p>
<p><strong>البريد الإلكتروني:</strong> ${siteConfig.contact.email}</p>
<p><strong>المقر:</strong> ${siteConfig.contact.addressAr}</p>`,
    hero_image: null,
    meta_title_en: "Contact Us | MZ Tourism Qatar",
    meta_title_ar: "اتصل بنا | إم زد للسياحة قطر",
    meta_description_en: "Contact MZ Tourism Qatar for private tour inquiries, VIP vehicle dispatches, and bespoke concierge bookings.",
    meta_description_ar: "اتصل بإم زد للسياحة قطر للاستفسار عن الجولات السياحية الخاصة وخدمات الكونسيرج الحصرية في قطر.",
    status: "published",
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
  },
  {
    id: "20000000-0000-0000-0000-000000000003",
    slug: "privacy-policy",
    title_en: "Privacy & Data Protection Policy",
    title_ar: "سياسة الخصوصية وحماية البيانات",
    excerpt_en: "Our commitment to confidential client handling and data discretion under Qatar regulatory standards.",
    excerpt_ar: "التزامنا بالسرية التامة لبيانات الضيوف وفق الأنظمة واللوائح المعمول بها في دولة قطر.",
    content_en: `<h2>Commitment to Discretion & Confidentiality</h2>
<p>At MZ Tourism Qatar, protecting the privacy and personal details of our discerning guests is paramount. This policy outlines how information is gathered, utilized, and safeguarded.</p>
<h3>1. Information Collected</h3>
<p>We collect essential operational information including passenger names, passport numbers (strictly when required for security permits and aviation clearances), contact preferences, and special dietary or medical notes.</p>
<h3>2. Zero Third-Party Monetization</h3>
<p>We never sell, rent, or commercialize your personal data. Information is strictly shared with certified operational partners (such as licensed yacht captains and private aviation handlers) solely to execute your booked itinerary.</p>`,
    content_ar: `<h2>الالتزام بالسرية والخصوصية التامة</h2>
<p>في إم زد للسياحة قطر، تعد حماية خصوصية وبيانات ضيوفنا الكرام أولوية قصوى. توضح هذه السياسة كيفية جمع البيانات واستخدامها وحمايتها.</p>
<h3>١. البيانات التي نجمعها</h3>
<p>نجمع فقط البيانات التشغيلية الضرورية مثل أسماء المسافرين، وبيانات الجواز (فقط عند طلبها للتصاريح الأمنية وجولات الطيران المروحي)، ووسائل الاتصال المفضلة والمتطلبات الخاصة.</p>
<h3>٢. عدم مشاركة البيانات لأغراض تجارية</h3>
<p>نحن لا نبيع ولا نؤجر بيانات عملائنا على الإطلاق. تقتصر مشاركة البيانات مع الشركاء الميدانيين المعتمدين (مثل قباطنة اليخوت وشركات الطيران الخاص) لغرض تنفيذ الرحلة المحجوزة حصراً.</p>`,
    hero_image: null,
    meta_title_en: "Privacy Policy | MZ Tourism Qatar",
    meta_title_ar: "سياسة الخصوصية | إم زد للسياحة قطر",
    meta_description_en: "Privacy and confidentiality practices of MZ Tourism Qatar.",
    meta_description_ar: "سياسة الخصوصية وسرية البيانات لدى إم زد للسياحة قطر.",
    status: "published",
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
  },
  {
    id: "20000000-0000-0000-0000-000000000004",
    slug: "terms-conditions",
    title_en: "Terms & Conditions of Service",
    title_ar: "الشروط والأحكام العامة للخدمة",
    excerpt_en: "Operating terms governing reservations, bespoke itineraries, and guest services.",
    excerpt_ar: "الشروط والضوابط المنظمة للحجوزات والرحلات المصممة وخدمات الضيوف.",
    content_en: `<h2>General Terms of Service</h2>
<p>These terms govern all reservations, private excursions, chartered journeys, and concierge arrangements provided by MZ Tourism Qatar.</p>
<h3>1. Bookings & Confirmation</h3>
<p>A reservation is confirmed only upon issuance of an official booking voucher and confirmation of required deposits. Viewing an indicative quotation or submitting a request does not constitute a guaranteed reservation.</p>
<h3>2. Safety & Operational Standards</h3>
<p>Our desert safari captains, maritime skippers, and private chauffeurs reserve the right to alter routes or timing due to weather advisories, sea conditions, or official security regulations to ensure guest safety.</p>`,
    content_ar: `<h2>شروط الخدمة العامة</h2>
<p>تنطبق هذه الشروط على جميع الحجوزات والجولات السياحية الخاصة والرحلات المصممة المقدمة من إم زد للسياحة قطر.</p>
<h3>١. الحجز والتأكيد</h3>
<p>يعتبر الحجز مؤكداً فقط بعد إصدار قسيمة الحجز الرسمية واعتماد إيداع مبلغ الدفعة المقدمة. تقديم طلب الاستفسار أو عرض السعر المبدئي لا يمثل حجزاً مؤكداً.</p>
<h3>٢. معايير السلامة والعمليات</h3>
<p>يحتفظ قادة الرحلات الصحراوية وقباطنة اليخوت بحق تعديل المسارات أو المواعيد وفقاً للظروف الجوية أو الحالة البحرية أو التوجيهات الأمنية الرسمية لضمان سلامة الضيوف أولاً.</p>`,
    hero_image: null,
    meta_title_en: "Terms & Conditions | MZ Tourism Qatar",
    meta_title_ar: "الشروط والأحكام | إم زد للسياحة قطر",
    meta_description_en: "Terms and conditions of service for MZ Tourism Qatar.",
    meta_description_ar: "الشروط والأحكام العامة لخدمات إم زد للسياحة قطر.",
    status: "published",
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
  },
  {
    id: "20000000-0000-0000-0000-000000000005",
    slug: "cancellation-policy",
    title_en: "Cancellation & Refund Policy",
    title_ar: "سياسة الإلغاء والاسترداد",
    excerpt_en: "Transparent cancellation timelines and deposit refund conditions.",
    excerpt_ar: "جداول مواعيد الإلغاء الشفافة وضوابط استرداد الدفعات المقدمة.",
    content_en: `<h2>Cancellation & Rescheduling Guidelines</h2>
<p>We recognize that elite travel schedules can change unexpectedly. Our cancellation terms balance flexibility for our guests with operational commitments made to private charters and exclusive venues.</p>
<h3>Standard Itinerary Cancellations</h3>
<ul>
  <li><strong>More than 7 days prior:</strong> 100% refund of deposit or complimentary rescheduling.</li>
  <li><strong>3 to 7 days prior:</strong> 50% refund of deposit, or full credit toward future journey within 12 months.</li>
  <li><strong>Less than 72 hours prior:</strong> Deposit is non-refundable due to vehicle, permit, and vessel reservations.</li>
</ul>`,
    content_ar: `<h2>ضوابط الإلغاء وتعديل المواعيد</h2>
<p>ندرك أن جداول أعمال ضيوفنا الكرام قد تطرأ عليها تغييرات مفاجئة. تهدف سياستنا إلى توفير المرونة اللازمة للضيوف مع الالتزام بتعهداتنا تجاه اليخوت والمواقع الحصرية المحجوزة مسبقاً.</p>
<h3>إلغاء الجولات الاعتيادية</h3>
<ul>
  <li><strong>أكثر من ٧ أيام قبل الموعد:</strong> استرداد كامل لمبلغ الدفعة المقدمة أو تغيير الموعد مجاناً.</li>
  <li><strong>من ٣ إلى ٧ أيام قبل الموعد:</strong> استرداد ٥٠٪ من الدفعة، أو تحويل المبلغ كرصيد لرحلة قادمة خلال ١٢ شهراً.</li>
  <li><strong>أقل من ٧٢ ساعة قبل الموعد:</strong> لا يمكن استرداد الدفعة لالتزامنا بتصاريح المركبات وتجهيز اليخوت.</li>
</ul>`,
    hero_image: null,
    meta_title_en: "Cancellation Policy | MZ Tourism Qatar",
    meta_title_ar: "سياسة الإلغاء | إم زد للسياحة قطر",
    meta_description_en: "Cancellation and refund policies for bookings with MZ Tourism Qatar.",
    meta_description_ar: "سياسة الإلغاء واسترداد مبالغ الحجوزات لدى إم زد للسياحة قطر.",
    status: "published",
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
  },
];

const DEFAULT_FAQS: CmsFaqRow[] = [
  {
    id: "30000000-0000-0000-0000-000000000001",
    category: "bookings",
    question_en: "How are private tours and custom itineraries confirmed?",
    question_ar: "كيف يتم تأكيد الجولات السياحية الخاصة والمسارات المخصصة؟",
    answer_en:
      "All requests submitted via our portal or WhatsApp are assigned a dedicated concierge manager who reviews vehicle allocations, permits, and dates. A formal proposal voucher and deposit request will be shared with you to secure the reservation.",
    answer_ar:
      "يتم تعيين مدير كونسيرج مخصص لكل طلب يقدم عبر المنصة أو الواتساب، لمراجعة المركبات والتصاريح والتواريخ، ثم إرسال قسيمة عرض سعر رسمية لإتمام الدفعة المقدمة وتأكيد الحجز.",
    display_order: 10,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "30000000-0000-0000-0000-000000000002",
    category: "safari",
    question_en: "What safety standards and vehicles are used for the Inland Sea Safari?",
    question_ar: "ما هي معايير السلامة والمركبات المستخدمة في سفاري خور العديد؟",
    answer_en:
      "Our desert safaris operate exclusively with modern, climate-controlled Lexus LX600 and Toyota Land Cruiser V6 twin-turbo vehicles fitted with roll cages, advanced GPS distress beacons, comprehensive passenger insurance, and desert-certified Qatari captains.",
    answer_ar:
      "تُدار رحلاتنا الصحراوية حصرياً بأسطول حديث ومكيف من سيارات لكزس LX600 وتويوتا لاندكروزر V6 المزودة بأنظمة أمان متقدمة، وأجهزة تتبع واستغاثة، مع سائقين معتمدين ومرخصين للقيادة الصحراوية في قطر.",
    display_order: 20,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_NAVIGATION: CmsNavigationRow[] = [
  {
    id: "40000000-0000-0000-0000-000000000001",
    location: "header",
    label_en: "Experiences",
    label_ar: "التجارب السياحية",
    url: "/services",
    display_order: 10,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "40000000-0000-0000-0000-000000000002",
    location: "header",
    label_en: "About",
    label_ar: "من نحن",
    url: "/about",
    display_order: 20,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "40000000-0000-0000-0000-000000000003",
    location: "header",
    label_en: "Travel Advisory",
    label_ar: "الدليل الإرشادي",
    url: "/faq",
    display_order: 30,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "40000000-0000-0000-0000-000000000004",
    location: "header",
    label_en: "Contact",
    label_ar: "اتصل بنا",
    url: "/contact",
    display_order: 40,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "40000000-0000-0000-0000-000000000005",
    location: "footer_legal",
    label_en: "Privacy Policy",
    label_ar: "سياسة الخصوصية",
    url: "/privacy-policy",
    display_order: 10,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "40000000-0000-0000-0000-000000000006",
    location: "footer_legal",
    label_en: "Terms & Conditions",
    label_ar: "الشروط والأحكام",
    url: "/terms-conditions",
    display_order: 20,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "40000000-0000-0000-0000-000000000007",
    location: "footer_legal",
    label_en: "Cancellation Policy",
    label_ar: "سياسة الإلغاء",
    url: "/cancellation-policy",
    display_order: 30,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Fallback in-memory dynamic cache for mock / resilient tests
const memSiteSettings: CmsSiteSettingsRow = { ...DEFAULT_SITE_SETTINGS };
const memSections = new Map<string, CmsHomepageSectionRow>(DEFAULT_HOMEPAGE_SECTIONS.map((s) => [s.id, s]));
const memPages = new Map<string, CmsPageRow>(DEFAULT_PAGES.map((p) => [p.slug, p]));
const memFaqs = new Map<string, CmsFaqRow>(DEFAULT_FAQS.map((f) => [f.id, f]));
const memTestimonials = new Map<string, CmsTestimonialRow>();
const memNavigation = new Map<string, CmsNavigationRow>(DEFAULT_NAVIGATION.map((n) => [n.id, n]));
const memMedia = new Map<string, CmsMediaRow>();

// =============================================================================
// 1. SITE SETTINGS & SEO ACTIONS
// =============================================================================

export async function getAdminSiteSettingsAction(): Promise<{
  success: boolean;
  data: CmsSiteSettingsRow;
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();
    const { data, error } = await admin.from("cms_site_settings").select("*").maybeSingle();

    if (error || !data) {
      return { success: true, data: memSiteSettings };
    }
    return { success: true, data };
  } catch {
    return { success: true, data: memSiteSettings };
  }
}

export async function updateAdminSiteSettingsAction(rawInput: CmsSiteSettingsInput): Promise<{
  success: boolean;
  data?: CmsSiteSettingsRow;
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const parsed = cmsSiteSettingsSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const dbSettingsData = { ...parsed.data } as Record<string, unknown>;
    delete dbSettingsData.id;
    delete dbSettingsData.social_whatsapp;
    const dbPayload = {
      ...dbSettingsData,
      updated_at: new Date().toISOString(),
    };
    const memPayload = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };

    const admin = createAdminClient();
    const settingsId = rawInput.id && isUuid(rawInput.id) ? rawInput.id : "00000000-0000-0000-0000-000000000001";
    try {
      const { data, error } = await admin
        .from("cms_site_settings")
        .upsert({ id: settingsId, ...dbPayload })
        .select("*")
        .single();

      if (!error && data) {
        Object.assign(memSiteSettings, { ...data, social_whatsapp: parsed.data.social_whatsapp });
        return { success: true, data: memSiteSettings };
      }
    } catch {
      // Fallback
    }

    Object.assign(memSiteSettings, memPayload);
    return { success: true, data: memSiteSettings };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to update site settings") };
  }
}

export async function getPublicSiteSettingsAction(): Promise<{
  success: boolean;
  data: CmsSiteSettingsRow;
}> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("cms_site_settings").select("*").maybeSingle();

    if (error || !data) {
      return { success: true, data: memSiteSettings };
    }
    return { success: true, data };
  } catch {
    return { success: true, data: memSiteSettings };
  }
}

// =============================================================================
// 2. HOMEPAGE BUILDER ACTIONS
// =============================================================================

export async function getAdminHomepageSectionsAction(): Promise<{
  success: boolean;
  data: CmsHomepageSectionRow[];
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("cms_homepage_sections")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return {
        success: true,
        data: Array.from(memSections.values()).sort((a, b) => a.display_order - b.display_order),
      };
    }
    return { success: true, data };
  } catch {
    return {
      success: true,
      data: Array.from(memSections.values()).sort((a, b) => a.display_order - b.display_order),
    };
  }
}

export async function saveAdminHomepageSectionAction(rawInput: CmsHomepageSectionInput): Promise<{
  success: boolean;
  data?: CmsHomepageSectionRow;
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const parsed = cmsHomepageSectionSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const val = parsed.data;
    const sectionId = val.id && val.id.trim() !== "" ? val.id : crypto.randomUUID();
    const dbSectionId = isUuid(sectionId) ? sectionId : crypto.randomUUID();

    const record: CmsHomepageSectionRow = {
      id: sectionId,
      section_key: val.section_key,
      title_en: val.title_en || null,
      title_ar: val.title_ar || null,
      subtitle_en: val.subtitle_en || null,
      subtitle_ar: val.subtitle_ar || null,
      content_en: val.content_en ? sanitizeHtmlContent(val.content_en) : null,
      content_ar: val.content_ar ? sanitizeHtmlContent(val.content_ar) : null,
      media_url: val.media_url || null,
      cta_primary_label_en: val.cta_primary_label_en || null,
      cta_primary_label_ar: val.cta_primary_label_ar || null,
      cta_primary_url: val.cta_primary_url || null,
      cta_secondary_label_en: val.cta_secondary_label_en || null,
      cta_secondary_label_ar: val.cta_secondary_label_ar || null,
      cta_secondary_url: val.cta_secondary_url || null,
      metadata: (val.metadata || {}) as Json,
      display_order: val.display_order ?? 0,
      is_enabled: val.is_enabled ?? true,
      updated_at: new Date().toISOString(),
      updated_by: null,
    };

    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("cms_homepage_sections")
        .upsert({ ...record, id: dbSectionId })
        .select("*")
        .single();

      if (!error && data) {
        memSections.set(data.id, data);
        memSections.set(sectionId, data);
        return { success: true, data };
      }
    } catch {
      // Fallback
    }

    memSections.set(sectionId, record);
    return { success: true, data: record };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to save homepage section") };
  }
}

export async function toggleAdminHomepageSectionAction(
  id: string,
  isEnabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminAccess();
    if (memSections.has(id)) {
      const prev = memSections.get(id)!;
      memSections.set(id, { ...prev, is_enabled: isEnabled, updated_at: new Date().toISOString() });
    }
    for (const [k, s] of memSections.entries()) {
      if (s.section_key === id) {
        memSections.set(k, { ...s, is_enabled: isEnabled, updated_at: new Date().toISOString() });
      }
    }

    try {
      const admin = createAdminClient();
      if (isUuid(id)) {
        await admin
          .from("cms_homepage_sections")
          .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
          .eq("id", id);
      } else {
        await admin
          .from("cms_homepage_sections")
          .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
          .eq("section_key", id);
      }
    } catch {
      // Fallback
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to toggle section") };
  }
}

export async function deleteAdminHomepageSectionAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminAccess();
    memSections.delete(id);
    for (const [k, s] of memSections.entries()) {
      if (s.section_key === id) memSections.delete(k);
    }
    try {
      const admin = createAdminClient();
      if (isUuid(id)) {
        await admin.from("cms_homepage_sections").delete().eq("id", id);
      } else {
        await admin.from("cms_homepage_sections").delete().eq("section_key", id);
      }
    } catch {
      // Fallback
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to delete section") };
  }
}

export async function reorderAdminHomepageSectionsAction(
  orderMap: { id: string; display_order: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminAccess();
    for (const item of orderMap) {
      if (memSections.has(item.id)) {
        const prev = memSections.get(item.id)!;
        memSections.set(item.id, { ...prev, display_order: item.display_order });
      }
    }
    try {
      const admin = createAdminClient();
      for (const item of orderMap) {
        if (isUuid(item.id)) {
          await admin
            .from("cms_homepage_sections")
            .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
            .eq("id", item.id);
        }
      }
    } catch {
      // Fallback
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to reorder sections") };
  }
}

export async function getPublicHomepageSectionsAction(): Promise<{
  success: boolean;
  data: CmsHomepageSectionRow[];
}> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("cms_homepage_sections")
      .select("*")
      .eq("is_enabled", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      const fallback = Array.from(memSections.values())
        .filter((s) => s.is_enabled)
        .sort((a, b) => a.display_order - b.display_order);
      return { success: true, data: fallback };
    }
    return { success: true, data };
  } catch {
    const fallback = Array.from(memSections.values())
      .filter((s) => s.is_enabled)
      .sort((a, b) => a.display_order - b.display_order);
    return { success: true, data: fallback };
  }
}

// =============================================================================
// 3. STATIC PAGES MANAGEMENT ACTIONS
// =============================================================================

export async function getAdminPagesAction(): Promise<{
  success: boolean;
  data: CmsPageRow[];
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("cms_pages")
      .select("*")
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
      return { success: true, data: Array.from(memPages.values()) };
    }
    return { success: true, data };
  } catch {
    return { success: true, data: Array.from(memPages.values()) };
  }
}

export async function saveAdminPageAction(rawInput: CmsPageInput): Promise<{
  success: boolean;
  data?: CmsPageRow;
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const parsed = cmsPageSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const val = parsed.data;
    const pageId = val.id && val.id.trim() !== "" ? val.id : crypto.randomUUID();
    const dbPageId = isUuid(pageId) ? pageId : crypto.randomUUID();

    const record: CmsPageRow = {
      id: pageId,
      slug: val.slug.toLowerCase().trim(),
      title_en: val.title_en.trim(),
      title_ar: val.title_ar.trim(),
      excerpt_en: val.excerpt_en || null,
      excerpt_ar: val.excerpt_ar || null,
      content_en: sanitizeHtmlContent(val.content_en),
      content_ar: sanitizeHtmlContent(val.content_ar),
      hero_image: val.hero_image || null,
      meta_title_en: val.meta_title_en || null,
      meta_title_ar: val.meta_title_ar || null,
      meta_description_en: val.meta_description_en || null,
      meta_description_ar: val.meta_description_ar || null,
      status: val.status,
      published_at: val.status === "published" ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
    };

    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("cms_pages")
        .upsert({ ...record, id: dbPageId })
        .select("*")
        .single();

      if (!error && data) {
        memPages.set(data.slug, data);
        return { success: true, data };
      }
    } catch {
      // Fallback
    }

    memPages.set(record.slug, record);
    return { success: true, data: record };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to save page") };
  }
}

export async function toggleAdminPageStatusAction(
  id: string,
  status: "draft" | "published" | "archived"
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminAccess();
    for (const [slug, page] of memPages.entries()) {
      if (page.id === id || slug === id) {
        memPages.set(slug, { ...page, status, updated_at: new Date().toISOString() });
      }
    }
    try {
      const admin = createAdminClient();
      if (isUuid(id)) {
        await admin
          .from("cms_pages")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", id);
      } else {
        await admin
          .from("cms_pages")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("slug", id);
      }
    } catch {
      // Fallback
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to update page status") };
  }
}

export async function deleteAdminPageAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminAccess();
    for (const [slug, page] of memPages.entries()) {
      if (page.id === id || slug === id) memPages.delete(slug);
    }
    try {
      const admin = createAdminClient();
      if (isUuid(id)) {
        await admin.from("cms_pages").delete().eq("id", id);
      } else {
        await admin.from("cms_pages").delete().eq("slug", id);
      }
    } catch {
      // Fallback
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to delete page") };
  }
}

export async function getPublicPageBySlugAction(slug: string): Promise<{
  success: boolean;
  data: CmsPageRow | null;
}> {
  try {
    const cleanSlug = slug.toLowerCase().trim();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("cms_pages")
      .select("*")
      .eq("slug", cleanSlug)
      .eq("status", "published")
      .maybeSingle();

    if (!error && data) {
      return { success: true, data };
    }

    const fallback = memPages.get(cleanSlug);
    if (fallback && fallback.status === "published") {
      return { success: true, data: fallback };
    }

    return { success: true, data: null };
  } catch {
    const fallback = memPages.get(slug.toLowerCase().trim());
    return { success: true, data: fallback && fallback.status === "published" ? fallback : null };
  }
}

// =============================================================================
// 4. FAQ MANAGEMENT ACTIONS
// =============================================================================

export async function getAdminFaqsAction(category?: string): Promise<{
  success: boolean;
  data: CmsFaqRow[];
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();
    let query = admin.from("cms_faqs").select("*").order("display_order", { ascending: true });
    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      let items = Array.from(memFaqs.values()).sort((a, b) => a.display_order - b.display_order);
      if (category && category !== "all") {
        items = items.filter((i) => i.category === category);
      }
      return { success: true, data: items };
    }
    return { success: true, data };
  } catch {
    return {
      success: true,
      data: Array.from(memFaqs.values()).sort((a, b) => a.display_order - b.display_order),
    };
  }
}

export async function saveAdminFaqAction(rawInput: CmsFaqInput): Promise<{
  success: boolean;
  data?: CmsFaqRow;
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const parsed = cmsFaqSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const val = parsed.data;
    const faqId = val.id && val.id.trim() !== "" ? val.id : crypto.randomUUID();
    const dbFaqId = isUuid(faqId) ? faqId : crypto.randomUUID();

    const record: CmsFaqRow = {
      id: faqId,
      category: val.category.toLowerCase().trim(),
      question_en: val.question_en.trim(),
      question_ar: val.question_ar.trim(),
      answer_en: sanitizeHtmlContent(val.answer_en),
      answer_ar: sanitizeHtmlContent(val.answer_ar),
      display_order: val.display_order ?? 0,
      is_published: val.is_published ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("cms_faqs")
        .upsert({ ...record, id: dbFaqId })
        .select("*")
        .single();

      if (!error && data) {
        memFaqs.set(data.id, data);
        memFaqs.set(faqId, data);
        return { success: true, data };
      }
    } catch {
      // Fallback
    }

    memFaqs.set(faqId, record);
    return { success: true, data: record };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to save FAQ") };
  }
}

export async function toggleAdminFaqPublishAction(
  id: string,
  isPublished: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminAccess();
    if (memFaqs.has(id)) {
      const prev = memFaqs.get(id)!;
      memFaqs.set(id, { ...prev, is_published: isPublished });
    }
    try {
      const admin = createAdminClient();
      if (isUuid(id)) {
        await admin
          .from("cms_faqs")
          .update({ is_published: isPublished, updated_at: new Date().toISOString() })
          .eq("id", id);
      }
    } catch {
      // Fallback
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to update FAQ status") };
  }
}

export async function deleteAdminFaqAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminAccess();
    memFaqs.delete(id);
    try {
      const admin = createAdminClient();
      if (isUuid(id)) {
        await admin.from("cms_faqs").delete().eq("id", id);
      }
    } catch {
      // Fallback
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to delete FAQ") };
  }
}

export async function reorderAdminFaqsAction(
  orderMap: { id: string; display_order: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminAccess();
    for (const item of orderMap) {
      if (memFaqs.has(item.id)) {
        const prev = memFaqs.get(item.id)!;
        memFaqs.set(item.id, { ...prev, display_order: item.display_order });
      }
    }
    try {
      const admin = createAdminClient();
      for (const item of orderMap) {
        if (isUuid(item.id)) {
          await admin
            .from("cms_faqs")
            .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
            .eq("id", item.id);
        }
      }
    } catch {
      // Fallback
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to reorder FAQs") };
  }
}

export async function getPublicFaqsAction(category?: string): Promise<{
  success: boolean;
  data: CmsFaqRow[];
}> {
  try {
    const admin = createAdminClient();
    let query = admin
      .from("cms_faqs")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      let items = Array.from(memFaqs.values())
        .filter((f) => f.is_published)
        .sort((a, b) => a.display_order - b.display_order);
      if (category && category !== "all") {
        items = items.filter((i) => i.category === category);
      }
      return { success: true, data: items };
    }
    return { success: true, data };
  } catch {
    const items = Array.from(memFaqs.values())
      .filter((f) => f.is_published)
      .sort((a, b) => a.display_order - b.display_order);
    return { success: true, data: items };
  }
}

// =============================================================================
// 5. TESTIMONIALS MANAGEMENT ACTIONS
// =============================================================================

export async function getAdminTestimonialsAction(): Promise<{
  success: boolean;
  data: CmsTestimonialRow[];
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("cms_testimonials")
      .select("*")
      .order("display_order", { ascending: true });

    if (error || !data) {
      return {
        success: true,
        data: Array.from(memTestimonials.values()).sort((a, b) => a.display_order - b.display_order),
      };
    }
    return { success: true, data };
  } catch {
    return {
      success: true,
      data: Array.from(memTestimonials.values()).sort((a, b) => a.display_order - b.display_order),
    };
  }
}

export async function saveAdminTestimonialAction(rawInput: CmsTestimonialInput): Promise<{
  success: boolean;
  data?: CmsTestimonialRow;
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const parsed = cmsTestimonialSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const val = parsed.data;
    const testId = val.id && val.id.trim() !== "" ? val.id : crypto.randomUUID();
    const dbTestId = isUuid(testId) ? testId : crypto.randomUUID();

    const record: CmsTestimonialRow = {
      id: testId,
      customer_name: val.customer_name.trim(),
      customer_title_en: val.customer_title_en || null,
      customer_title_ar: val.customer_title_ar || null,
      content_en: sanitizeHtmlContent(val.content_en),
      content_ar: sanitizeHtmlContent(val.content_ar),
      rating: Math.max(1, Math.min(5, val.rating || 5)),
      avatar_url: val.avatar_url || null,
      display_order: val.display_order ?? 0,
      is_published: val.is_published ?? false, // Defaults strictly unpublished until approved
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("cms_testimonials")
        .upsert({ ...record, id: dbTestId })
        .select("*")
        .single();

      if (!error && data) {
        memTestimonials.set(data.id, data);
        memTestimonials.set(testId, data);
        return { success: true, data };
      }
    } catch {
      // Fallback
    }

    memTestimonials.set(testId, record);
    return { success: true, data: record };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to save testimonial") };
  }
}

export async function toggleAdminTestimonialPublishAction(
  id: string,
  isPublished: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminAccess();
    if (memTestimonials.has(id)) {
      const prev = memTestimonials.get(id)!;
      memTestimonials.set(id, { ...prev, is_published: isPublished });
    }
    try {
      const admin = createAdminClient();
      if (isUuid(id)) {
        await admin
          .from("cms_testimonials")
          .update({ is_published: isPublished, updated_at: new Date().toISOString() })
          .eq("id", id);
      }
    } catch {
      // Fallback
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to toggle testimonial status") };
  }
}

export async function deleteAdminTestimonialAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminAccess();
    memTestimonials.delete(id);
    try {
      const admin = createAdminClient();
      if (isUuid(id)) {
        await admin.from("cms_testimonials").delete().eq("id", id);
      }
    } catch {
      // Fallback
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to delete testimonial") };
  }
}

export async function getPublicTestimonialsAction(): Promise<{
  success: boolean;
  data: CmsTestimonialRow[];
}> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("cms_testimonials")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true });

    if (error || !data) {
      const fallback = Array.from(memTestimonials.values())
        .filter((t) => t.is_published)
        .sort((a, b) => a.display_order - b.display_order);
      return { success: true, data: fallback };
    }
    return { success: true, data };
  } catch {
    const fallback = Array.from(memTestimonials.values())
      .filter((t) => t.is_published)
      .sort((a, b) => a.display_order - b.display_order);
    return { success: true, data: fallback };
  }
}

// =============================================================================
// 6. WEBSITE NAVIGATION & FOOTER MANAGEMENT
// =============================================================================

export async function getAdminNavigationAction(location?: string): Promise<{
  success: boolean;
  data: CmsNavigationRow[];
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();
    let query = admin.from("cms_navigation").select("*").order("display_order", { ascending: true });
    if (
      location &&
      location !== "all" &&
      ["header", "footer_quick_links", "footer_experiences", "footer_legal"].includes(location)
    ) {
      query = query.eq("location", location as CmsNavigationRow["location"]);
    }
    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      let items = Array.from(memNavigation.values()).sort((a, b) => a.display_order - b.display_order);
      if (location && location !== "all") {
        items = items.filter((n) => n.location === location);
      }
      return { success: true, data: items };
    }
    return { success: true, data };
  } catch {
    return {
      success: true,
      data: Array.from(memNavigation.values()).sort((a, b) => a.display_order - b.display_order),
    };
  }
}

export async function saveAdminNavigationAction(rawInput: CmsNavigationInput): Promise<{
  success: boolean;
  data?: CmsNavigationRow;
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const parsed = cmsNavigationSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const val = parsed.data;
    const navId = val.id && val.id.trim() !== "" ? val.id : crypto.randomUUID();
    const dbNavId = isUuid(navId) ? navId : crypto.randomUUID();

    const record: CmsNavigationRow = {
      id: navId,
      location: val.location,
      label_en: val.label_en.trim(),
      label_ar: val.label_ar.trim(),
      url: val.url.trim(),
      display_order: val.display_order ?? 0,
      is_visible: val.is_visible ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("cms_navigation")
        .upsert({ ...record, id: dbNavId })
        .select("*")
        .single();

      if (!error && data) {
        memNavigation.set(data.id, data);
        memNavigation.set(navId, data);
        return { success: true, data };
      }
    } catch {
      // Fallback
    }

    memNavigation.set(navId, record);
    return { success: true, data: record };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to save navigation link") };
  }
}

export async function toggleAdminNavigationVisibilityAction(
  id: string,
  isVisible: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminAccess();
    if (memNavigation.has(id)) {
      const prev = memNavigation.get(id)!;
      memNavigation.set(id, { ...prev, is_visible: isVisible });
    }
    try {
      const admin = createAdminClient();
      if (isUuid(id)) {
        await admin
          .from("cms_navigation")
          .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
          .eq("id", id);
      }
    } catch {
      // Fallback
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to update navigation visibility") };
  }
}

export async function deleteAdminNavigationAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminAccess();
    memNavigation.delete(id);
    try {
      const admin = createAdminClient();
      if (isUuid(id)) {
        await admin.from("cms_navigation").delete().eq("id", id);
      }
    } catch {
      // Fallback
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to delete navigation link") };
  }
}

export async function reorderAdminNavigationAction(
  orderMap: { id: string; display_order: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminAccess();
    for (const item of orderMap) {
      if (memNavigation.has(item.id)) {
        const prev = memNavigation.get(item.id)!;
        memNavigation.set(item.id, { ...prev, display_order: item.display_order });
      }
    }
    try {
      const admin = createAdminClient();
      for (const item of orderMap) {
        if (isUuid(item.id)) {
          await admin
            .from("cms_navigation")
            .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
            .eq("id", item.id);
        }
      }
    } catch {
      // Fallback
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to reorder navigation items") };
  }
}

export async function getPublicNavigationAction(location?: string): Promise<{
  success: boolean;
  data: CmsNavigationRow[];
}> {
  try {
    const admin = createAdminClient();
    let query = admin
      .from("cms_navigation")
      .select("*")
      .eq("is_visible", true)
      .order("display_order", { ascending: true });

    if (
      location &&
      location !== "all" &&
      ["header", "footer_quick_links", "footer_experiences", "footer_legal"].includes(location)
    ) {
      query = query.eq("location", location as CmsNavigationRow["location"]);
    }
    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      let items = Array.from(memNavigation.values())
        .filter((n) => n.is_visible)
        .sort((a, b) => a.display_order - b.display_order);
      if (location && location !== "all") {
        items = items.filter((n) => n.location === location);
      }
      return { success: true, data: items };
    }
    return { success: true, data };
  } catch {
    let items = Array.from(memNavigation.values())
      .filter((n) => n.is_visible)
      .sort((a, b) => a.display_order - b.display_order);
    if (location && location !== "all") {
      items = items.filter((n) => n.location === location);
    }
    return { success: true, data: items };
  }
}

// =============================================================================
// 7. MEDIA LIBRARY ACTIONS (cms-media Public Bucket)
// =============================================================================

export async function getAdminMediaListAction(category?: string): Promise<{
  success: boolean;
  data: CmsMediaRow[];
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();
    let query = admin.from("cms_media").select("*").order("created_at", { ascending: false });
    if (
      category &&
      category !== "all" &&
      ["hero", "destinations", "experiences", "editorial", "banners", "general"].includes(category)
    ) {
      query = query.eq("category", category as CmsMediaRow["category"]);
    }
    const { data, error } = await query;

    if (error || !data) {
      let items = Array.from(memMedia.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      if (category && category !== "all") {
        items = items.filter((m) => m.category === category);
      }
      return { success: true, data: items };
    }
    return { success: true, data };
  } catch {
    return {
      success: true,
      data: Array.from(memMedia.values()),
    };
  }
}

export async function uploadAdminMediaAction(formData: FormData): Promise<{
  success: boolean;
  data?: CmsMediaRow;
  error?: string;
}> {
  try {
    await assertAdminAccess();
    const file = formData.get("file") as File | null;
    const titleEn = (formData.get("title_en") as string) || "";
    const titleAr = (formData.get("title_ar") as string) || "";
    const altEn = (formData.get("alt_en") as string) || "";
    const altAr = (formData.get("alt_ar") as string) || "";
    const categoryRaw = (formData.get("category") as string) || "general";

    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: "No valid image file uploaded." };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file format (${file.type}). Permitted types: JPG, PNG, WEBP, AVIF, SVG.`,
      };
    }

    if (file.size > MAX_MEDIA_SIZE_BYTES) {
      return {
        success: false,
        error: `File size exceeds 10MB limit (File: ${(file.size / 1024 / 1024).toFixed(2)} MB).`,
      };
    }

    const sanitizedBase = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
    const ext = sanitizedBase.split(".").pop() || "jpg";
    const uniqueKey = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${ext}`;
    const storagePath = `uploads/${uniqueKey}`;

    const admin = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data: uploadRes, error: uploadErr } = await admin.storage
      .from("cms-media")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    let publicUrl = `/images/${uniqueKey}`;
    if (!uploadErr && uploadRes?.path) {
      const { data: urlData } = admin.storage.from("cms-media").getPublicUrl(uploadRes.path);
      if (urlData?.publicUrl) {
        publicUrl = urlData.publicUrl;
      }
    }

    const categoryValid = [
      "hero",
      "destinations",
      "experiences",
      "editorial",
      "banners",
      "general",
    ].includes(categoryRaw)
      ? (categoryRaw as CmsMediaRow["category"])
      : "general";

    const mediaRecord: CmsMediaRow = {
      id: crypto.randomUUID(),
      filename: sanitizedBase,
      storage_path: storagePath,
      public_url: publicUrl,
      mime_type: file.type,
      file_size: file.size,
      title_en: titleEn.trim() || null,
      title_ar: titleAr.trim() || null,
      alt_en: altEn.trim() || null,
      alt_ar: altAr.trim() || null,
      category: categoryValid,
      uploaded_by: null,
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertErr } = await admin
      .from("cms_media")
      .insert(mediaRecord)
      .select("*")
      .single();

    if (insertErr || !inserted) {
      memMedia.set(mediaRecord.id, mediaRecord);
      return { success: true, data: mediaRecord };
    }

    memMedia.set(inserted.id, inserted);
    return { success: true, data: inserted };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to upload media item") };
  }
}

export async function updateAdminMediaMetadataAction(
  id: string,
  metadata: {
    title_en?: string;
    title_ar?: string;
    alt_en?: string;
    alt_ar?: string;
    category?: "hero" | "destinations" | "experiences" | "editorial" | "banners" | "general";
  }
): Promise<{ success: boolean; data?: CmsMediaRow; error?: string }> {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();
    const payload = {
      title_en: metadata.title_en?.trim() || null,
      title_ar: metadata.title_ar?.trim() || null,
      alt_en: metadata.alt_en?.trim() || null,
      alt_ar: metadata.alt_ar?.trim() || null,
      category: metadata.category || "general",
    };

    const { data, error } = await admin
      .from("cms_media")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      if (memMedia.has(id)) {
        const prev = memMedia.get(id)!;
        const updated = { ...prev, ...payload };
        memMedia.set(id, updated);
        return { success: true, data: updated };
      }
      return { success: false, error: "Media item not found" };
    }

    memMedia.set(data.id, data);
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to update media metadata") };
  }
}

export async function deleteAdminMediaAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();

    let storagePath: string | null = null;
    const { data: item } = await admin.from("cms_media").select("storage_path").eq("id", id).maybeSingle();
    if (item?.storage_path) {
      storagePath = item.storage_path;
    } else if (memMedia.has(id)) {
      storagePath = memMedia.get(id)!.storage_path;
    }

    if (storagePath) {
      await admin.storage.from("cms-media").remove([storagePath]);
    }

    await admin.from("cms_media").delete().eq("id", id);
    memMedia.delete(id);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err, "Failed to delete media item") };
  }
}
