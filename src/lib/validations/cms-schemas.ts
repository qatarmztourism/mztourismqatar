import { z } from "zod";

/**
 * Strips script tags, iframes, and dangerous event handlers from rich HTML strings
 * to protect against Stored Cross-Site Scripting (XSS).
 */
export function sanitizeHtmlContent(dirty: string): string {
  if (!dirty) return "";
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/on\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, "")
    .replace(/javascript:[^"'\s>]+/gi, "");
}

/**
 * 1. Site Settings & SEO Schema
 */
export const cmsSiteSettingsSchema = z.object({
  id: z.string().optional().nullable(),
  site_title_en: z.string().min(2, "English site title is required").max(120),
  site_title_ar: z.string().min(2, "Arabic site title is required").max(120),
  site_tagline_en: z.string().max(200).default(""),
  site_tagline_ar: z.string().max(200).default(""),
  site_description_en: z.string().min(10, "English description must be at least 10 characters").max(400),
  site_description_ar: z.string().min(10, "Arabic description must be at least 10 characters").max(400),
  contact_email: z.string().email("Invalid contact email"),
  contact_phone: z.string().min(6, "Invalid contact phone"),
  contact_whatsapp: z.string().min(8, "Invalid WhatsApp number"),
  contact_address_en: z.string().max(250).default(""),
  contact_address_ar: z.string().max(250).default(""),
  social_instagram: z.string().max(300).default(""),
  social_facebook: z.string().max(300).default(""),
  social_whatsapp: z.string().max(300).default(""),
  social_twitter: z.string().max(300).default(""),
  social_linkedin: z.string().max(300).default(""),
  seo_og_image: z.string().max(500).default(""),
  seo_canonical_url: z.string().max(500).default(""),
  footer_about_en: z.string().max(600).default(""),
  footer_about_ar: z.string().max(600).default(""),
});

export type CmsSiteSettingsInput = z.infer<typeof cmsSiteSettingsSchema>;

/**
 * 2. Homepage Section Builder Schema
 */
export const cmsHomepageSectionSchema = z.object({
  id: z.string().optional().nullable(),
  section_key: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9_-]+$/, "Section key must be lowercase letters, numbers, hyphens or underscores"),
  title_en: z.string().max(200).optional().nullable(),
  title_ar: z.string().max(200).optional().nullable(),
  subtitle_en: z.string().max(200).optional().nullable(),
  subtitle_ar: z.string().max(200).optional().nullable(),
  content_en: z.string().max(3000).optional().nullable(),
  content_ar: z.string().max(3000).optional().nullable(),
  media_url: z.string().max(500).optional().nullable(),
  cta_primary_label_en: z.string().max(80).optional().nullable(),
  cta_primary_label_ar: z.string().max(80).optional().nullable(),
  cta_primary_url: z.string().max(300).optional().nullable(),
  cta_secondary_label_en: z.string().max(80).optional().nullable(),
  cta_secondary_label_ar: z.string().max(80).optional().nullable(),
  cta_secondary_url: z.string().max(300).optional().nullable(),
  metadata: z.record(z.string(), z.any()).default({}),
  display_order: z.number().int().min(0).default(0),
  is_enabled: z.boolean().default(true),
});

export type CmsHomepageSectionInput = z.infer<typeof cmsHomepageSectionSchema>;

/**
 * 3. Static Pages Schema
 */
export const cmsPageSchema = z.object({
  id: z.string().optional().nullable(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase alphanumeric characters and hyphens"),
  title_en: z.string().min(2, "English title is required").max(150),
  title_ar: z.string().min(2, "Arabic title is required").max(150),
  excerpt_en: z.string().max(400).optional().nullable(),
  excerpt_ar: z.string().max(400).optional().nullable(),
  content_en: z.string().min(10, "English content is required"),
  content_ar: z.string().min(10, "Arabic content is required"),
  hero_image: z.string().max(500).optional().nullable(),
  meta_title_en: z.string().max(120).optional().nullable(),
  meta_title_ar: z.string().max(120).optional().nullable(),
  meta_description_en: z.string().max(300).optional().nullable(),
  meta_description_ar: z.string().max(300).optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).default("published"),
});

export type CmsPageInput = z.infer<typeof cmsPageSchema>;

/**
 * 4. FAQ Schema
 */
export const cmsFaqSchema = z.object({
  id: z.string().optional().nullable(),
  category: z.string().min(2).max(50).default("general"),
  question_en: z.string().min(5, "English question must be at least 5 characters").max(300),
  question_ar: z.string().min(5, "Arabic question must be at least 5 characters").max(300),
  answer_en: z.string().min(10, "English answer must be at least 10 characters"),
  answer_ar: z.string().min(10, "Arabic answer must be at least 10 characters"),
  display_order: z.number().int().min(0).default(0),
  is_published: z.boolean().default(true),
});

export type CmsFaqInput = z.infer<typeof cmsFaqSchema>;

/**
 * 5. Testimonial Schema (Authentic, strictly unverified reviews start unpublished)
 */
export const cmsTestimonialSchema = z.object({
  id: z.string().optional().nullable(),
  customer_name: z.string().min(2, "Customer name is required").max(100),
  customer_title_en: z.string().max(120).optional().nullable(),
  customer_title_ar: z.string().max(120).optional().nullable(),
  content_en: z.string().min(10, "English testimonial is required").max(1000),
  content_ar: z.string().min(10, "Arabic testimonial is required").max(1000),
  rating: z.number().int().min(1).max(5).default(5),
  avatar_url: z.string().max(500).optional().nullable(),
  display_order: z.number().int().min(0).default(0),
  is_published: z.boolean().default(false),
});

export type CmsTestimonialInput = z.infer<typeof cmsTestimonialSchema>;

/**
 * 6. Navigation Link Schema
 */
export const cmsNavigationSchema = z.object({
  id: z.string().optional().nullable(),
  location: z.enum(["header", "footer_quick_links", "footer_experiences", "footer_legal"]).default("header"),
  label_en: z.string().min(1, "English label is required").max(80),
  label_ar: z.string().min(1, "Arabic label is required").max(80),
  url: z.string().min(1, "URL destination is required").max(300),
  display_order: z.number().int().min(0).default(0),
  is_visible: z.boolean().default(true),
});

export type CmsNavigationInput = z.infer<typeof cmsNavigationSchema>;

/**
 * 7. Media Library Item Metadata Schema
 */
export const cmsMediaSchema = z.object({
  id: z.string().optional().nullable(),
  filename: z.string().min(1).max(255),
  storage_path: z.string().min(1),
  public_url: z.string().url(),
  mime_type: z.string().min(1),
  file_size: z.number().int().positive(),
  title_en: z.string().max(150).optional().nullable(),
  title_ar: z.string().max(150).optional().nullable(),
  alt_en: z.string().max(200).optional().nullable(),
  alt_ar: z.string().max(200).optional().nullable(),
  category: z.enum(["hero", "destinations", "experiences", "editorial", "banners", "general"]).default("general"),
});

export type CmsMediaInput = z.infer<typeof cmsMediaSchema>;
