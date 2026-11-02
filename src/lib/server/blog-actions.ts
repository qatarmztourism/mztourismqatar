"use server";

import { z } from "zod";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserAction } from "./auth-actions";
import { Locale } from "@/translations";
import {
  type ArticleCategory,
  type ArticleItem,
  type AdminArticleItem,
  type GetArticlesOptions,
  CURATED_ARTICLES,
} from "@/lib/data/curated-articles";

export type { ArticleCategory, ArticleItem, AdminArticleItem, GetArticlesOptions };

/**
 * Ensures caller has verified administrator clearance.
 */
async function assertAdminAccess() {
  const session = await getCurrentUserAction();
  if (!session.success || !session.data || !session.data.isAdmin) {
    throw new Error("Unauthorized: Staff or administrator clearance required.");
  }
  return session.data;
}

// =============================================================================
// PUBLIC BLOG ACTIONS
// =============================================================================

/**
 * Retrieves all published articles in the requested locale.
 * Only returns articles where is_published = true.
 */
export async function getPublicArticlesAction(
  locale: Locale = "en",
  options?: GetArticlesOptions
) {
  try {
    const supabase = await createServerSupabase();

    let query = supabase
      .from("articles")
      .select(
        "id, slug, title_en, title_ar, excerpt_en, excerpt_ar, content_en, content_ar, category, cover_image, author_name, reading_time_minutes, is_published, published_at, created_at, updated_at"
      )
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (options?.category && options.category !== "all") {
      query = query.eq("category", options.category);
    }

    const { data: dbArticles, error } = await query;

    // Use DB data if available, fallback gracefully to curated articles
    let rawList: AdminArticleItem[] = [];

    if (!error && dbArticles && dbArticles.length > 0) {
      rawList = dbArticles.map((a) => ({
        id: a.id,
        slug: a.slug,
        titleEn: a.title_en,
        titleAr: a.title_ar,
        excerptEn: a.excerpt_en,
        excerptAr: a.excerpt_ar,
        contentEn: a.content_en,
        contentAr: a.content_ar,
        category: a.category as ArticleCategory,
        coverImage: a.cover_image || null,
        authorName: a.author_name || "MZ Concierge Editorial",
        readingTimeMinutes: Number(a.reading_time_minutes) || 5,
        isPublished: Boolean(a.is_published),
        publishedAt: a.published_at || null,
        createdAt: a.created_at || new Date().toISOString(),
        updatedAt: a.updated_at || new Date().toISOString(),
      }));
    } else {
      rawList = CURATED_ARTICLES.filter((a) => a.isPublished);
      if (options?.category && options.category !== "all") {
        rawList = rawList.filter((a) => a.category === options.category);
      }
    }

    // Apply search filter if provided
    if (options?.search && options.search.trim().length > 0) {
      const q = options.search.trim().toLowerCase();
      rawList = rawList.filter((a) => {
        const title = locale === "ar" ? a.titleAr : a.titleEn;
        const excerpt = locale === "ar" ? a.excerptAr : a.excerptEn;
        return (
          title.toLowerCase().includes(q) || excerpt.toLowerCase().includes(q)
        );
      });
    }

    const formatted: ArticleItem[] = rawList.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: locale === "ar" ? a.titleAr : a.titleEn,
      excerpt: locale === "ar" ? a.excerptAr : a.excerptEn,
      content: locale === "ar" ? a.contentAr : a.contentEn,
      category: a.category,
      coverImage: a.coverImage,
      authorName: a.authorName,
      readingTimeMinutes: a.readingTimeMinutes,
      isPublished: a.isPublished,
      publishedAt: a.publishedAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    return { success: true, data: formatted };
  } catch (err) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("[Get Public Articles Unexpected Error]", err);
    // Safe graceful fallback
    const fallback = CURATED_ARTICLES.filter((a) => a.isPublished).map((a) => ({
      id: a.id,
      slug: a.slug,
      title: locale === "ar" ? a.titleAr : a.titleEn,
      excerpt: locale === "ar" ? a.excerptAr : a.excerptEn,
      content: locale === "ar" ? a.contentAr : a.contentEn,
      category: a.category,
      coverImage: a.coverImage,
      authorName: a.authorName,
      readingTimeMinutes: a.readingTimeMinutes,
      isPublished: a.isPublished,
      publishedAt: a.publishedAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
    return { success: true, data: fallback };
  }
}

/**
 * Retrieves a single published article by its slug in the requested locale.
 * Enforces is_published = true.
 */
export async function getPublicArticleBySlugAction(slug: string, locale: Locale = "en") {
  try {
    const supabase = await createServerSupabase();

    const { data: dbArticle, error } = await supabase
      .from("articles")
      .select(
        "id, slug, title_en, title_ar, excerpt_en, excerpt_ar, content_en, content_ar, category, cover_image, author_name, reading_time_minutes, is_published, published_at, created_at, updated_at"
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    let raw: AdminArticleItem | null = null;

    if (!error && dbArticle) {
      raw = {
        id: dbArticle.id,
        slug: dbArticle.slug,
        titleEn: dbArticle.title_en,
        titleAr: dbArticle.title_ar,
        excerptEn: dbArticle.excerpt_en,
        excerptAr: dbArticle.excerpt_ar,
        contentEn: dbArticle.content_en,
        contentAr: dbArticle.content_ar,
        category: dbArticle.category as ArticleCategory,
        coverImage: dbArticle.cover_image || null,
        authorName: dbArticle.author_name || "MZ Concierge Editorial",
        readingTimeMinutes: Number(dbArticle.reading_time_minutes) || 5,
        isPublished: Boolean(dbArticle.is_published),
        publishedAt: dbArticle.published_at || null,
        createdAt: dbArticle.created_at || new Date().toISOString(),
        updatedAt: dbArticle.updated_at || new Date().toISOString(),
      };
    } else {
      const match = CURATED_ARTICLES.find((a) => a.slug === slug && a.isPublished);
      if (match) raw = match;
    }

    if (!raw) {
      return { success: false, error: "Article not found." };
    }

    const formatted: ArticleItem = {
      id: raw.id,
      slug: raw.slug,
      title: locale === "ar" ? raw.titleAr : raw.titleEn,
      excerpt: locale === "ar" ? raw.excerptAr : raw.excerptEn,
      content: locale === "ar" ? raw.contentAr : raw.contentEn,
      category: raw.category,
      coverImage: raw.coverImage,
      authorName: raw.authorName,
      readingTimeMinutes: raw.readingTimeMinutes,
      isPublished: raw.isPublished,
      publishedAt: raw.publishedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };

    return { success: true, data: formatted };
  } catch (err) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("[Get Article By Slug Unexpected Error]", err);
    return { success: false, error: "Unable to retrieve article." };
  }
}

/**
 * Retrieves related published articles for recommendations.
 */
export async function getRelatedArticlesAction(
  currentSlug: string,
  category: string,
  locale: Locale = "en",
  limit = 3
) {
  try {
    const res = await getPublicArticlesAction(locale);
    if (!res.success || !res.data) return { success: true, data: [] };

    const candidates = res.data.filter((a) => a.slug !== currentSlug);
    const sameCategory = candidates.filter((a) => a.category === category);
    const otherCategory = candidates.filter((a) => a.category !== category);

    const related = [...sameCategory, ...otherCategory].slice(0, limit);
    return { success: true, data: related };
  } catch {
    return { success: true, data: [] };
  }
}

// =============================================================================
// ADMIN BLOG MANAGEMENT (PROTECTED)
// =============================================================================

export async function getAdminArticlesAction() {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();

    const { data: dbArticles, error } = await admin
      .from("articles")
      .select(
        "id, slug, title_en, title_ar, excerpt_en, excerpt_ar, content_en, content_ar, category, cover_image, author_name, reading_time_minutes, is_published, published_at, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (!error && dbArticles && dbArticles.length > 0) {
      const mapped: AdminArticleItem[] = dbArticles.map((a) => ({
        id: a.id,
        slug: a.slug,
        titleEn: a.title_en,
        titleAr: a.title_ar,
        excerptEn: a.excerpt_en,
        excerptAr: a.excerpt_ar,
        contentEn: a.content_en,
        contentAr: a.content_ar,
        category: a.category as ArticleCategory,
        coverImage: a.cover_image || null,
        authorName: a.author_name || "MZ Concierge Editorial",
        readingTimeMinutes: Number(a.reading_time_minutes) || 5,
        isPublished: Boolean(a.is_published),
        publishedAt: a.published_at || null,
        createdAt: a.created_at || new Date().toISOString(),
        updatedAt: a.updated_at || new Date().toISOString(),
      }));
      return { success: true, data: mapped };
    }

    return { success: true, data: CURATED_ARTICLES };
  } catch (err) {
    console.error("[Get Admin Articles Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

const articleInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  titleEn: z.string().trim().min(3, "English title must be at least 3 characters").max(200),
  titleAr: z.string().trim().min(3, "Arabic title must be at least 3 characters").max(200),
  excerptEn: z.string().trim().min(10, "English excerpt must be at least 10 characters").max(500),
  excerptAr: z.string().trim().min(10, "Arabic excerpt must be at least 10 characters").max(500),
  contentEn: z.string().trim().min(30, "English content must be at least 30 characters"),
  contentAr: z.string().trim().min(30, "Arabic content must be at least 30 characters"),
  category: z.enum([
    "desert_expeditions",
    "culture_heritage",
    "vip_transfers",
    "luxury_stays",
    "travel_advisory",
  ]),
  coverImage: z.string().trim().url("Invalid image URL").optional().nullable(),
  readingTimeMinutes: z.number().int().min(1).max(60).default(5),
  isPublished: z.boolean().default(false),
});

export async function createAdminArticleAction(rawInput: unknown) {
  try {
    await assertAdminAccess();
    const validation = articleInputSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: "Validation failed. Please correct the highlighted errors.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const input = validation.data;
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("articles")
      .insert({
        slug: input.slug,
        title_en: input.titleEn,
        title_ar: input.titleAr,
        excerpt_en: input.excerptEn,
        excerpt_ar: input.excerptAr,
        content_en: input.contentEn,
        content_ar: input.contentAr,
        category: input.category,
        cover_image: input.coverImage || null,
        reading_time_minutes: input.readingTimeMinutes,
        is_published: input.isPublished,
        published_at: input.isPublished ? new Date().toISOString() : null,
      })
      .select("id, slug, title_en, is_published")
      .single();

    if (error) {
      console.error("[Create Article Error]", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[Create Admin Article Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

export async function toggleArticlePublishAction(articleId: string, isPublished: boolean) {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();

    const { error } = await admin
      .from("articles")
      .update({
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", articleId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
