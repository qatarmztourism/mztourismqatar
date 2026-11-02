import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SingleArticleView from "@/components/SingleArticleView";
import { getDictionary } from "@/translations";
import {
  getPublicArticleBySlugAction,
  getRelatedArticlesAction,
} from "@/lib/server/blog-actions";
import { siteConfig } from "@/config/site-config";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const res = await getPublicArticleBySlugAction(slug, "ar");

  if (!res.success || !res.data) {
    return {
      title: `المقال غير متوفر | ${siteConfig.brand.nameAr}`,
      description: "دليل السفر المطلوب غير متوفر حالياً.",
    };
  }

  const article = res.data;

  return {
    title: `${article.title} | ${siteConfig.brand.nameAr}`,
    description: article.excerpt,
    alternates: {
      canonical: `https://mztourismqatar.qa/ar/blog/${article.slug}`,
      languages: {
        en: `https://mztourismqatar.qa/en/blog/${article.slug}`,
        ar: `https://mztourismqatar.qa/ar/blog/${article.slug}`,
        "x-default": `https://mztourismqatar.qa/en/blog/${article.slug}`,
      },
    },
    openGraph: {
      title: `${article.title} | ${siteConfig.brand.nameAr}`,
      description: article.excerpt,
      url: `https://mztourismqatar.qa/ar/blog/${article.slug}`,
      siteName: siteConfig.brand.nameAr,
      locale: "ar_QA",
      type: "article",
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
    },
  };
}

export default async function SingleArticlePageAr({ params }: PageProps) {
  const { slug } = await params;
  const dict = getDictionary("ar");

  const res = await getPublicArticleBySlugAction(slug, "ar");
  if (!res.success || !res.data) {
    notFound();
  }

  const article = res.data;
  const relatedRes = await getRelatedArticlesAction(
    article.slug,
    article.category,
    "ar",
    3
  );
  const relatedArticles = relatedRes.success && relatedRes.data ? relatedRes.data : [];

  return (
    <SingleArticleView
      article={article}
      relatedArticles={relatedArticles}
      locale="ar"
      dict={dict}
    />
  );
}
