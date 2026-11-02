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
  const res = await getPublicArticleBySlugAction(slug, "en");

  if (!res.success || !res.data) {
    return {
      title: `Article Not Found | ${siteConfig.brand.name}`,
      description: "The requested travel guide could not be found.",
    };
  }

  const article = res.data;

  return {
    title: `${article.title} | ${siteConfig.brand.name}`,
    description: article.excerpt,
    alternates: {
      canonical: `https://mztourismqatar.qa/en/blog/${article.slug}`,
      languages: {
        en: `https://mztourismqatar.qa/en/blog/${article.slug}`,
        ar: `https://mztourismqatar.qa/ar/blog/${article.slug}`,
        "x-default": `https://mztourismqatar.qa/en/blog/${article.slug}`,
      },
    },
    openGraph: {
      title: `${article.title} | ${siteConfig.brand.name}`,
      description: article.excerpt,
      url: `https://mztourismqatar.qa/en/blog/${article.slug}`,
      siteName: siteConfig.brand.name,
      locale: "en_US",
      type: "article",
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
    },
  };
}

export default async function SingleArticlePageEn({ params }: PageProps) {
  const { slug } = await params;
  const dict = getDictionary("en");

  const res = await getPublicArticleBySlugAction(slug, "en");
  if (!res.success || !res.data) {
    notFound();
  }

  const article = res.data;
  const relatedRes = await getRelatedArticlesAction(
    article.slug,
    article.category,
    "en",
    3
  );
  const relatedArticles = relatedRes.success && relatedRes.data ? relatedRes.data : [];

  return (
    <SingleArticleView
      article={article}
      relatedArticles={relatedArticles}
      locale="en"
      dict={dict}
    />
  );
}
