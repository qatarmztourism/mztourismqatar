import { MetadataRoute } from "next";
import { en } from "@/translations/en";
import { CURATED_ARTICLES } from "@/lib/data/curated-articles";
import { getBaseUrl } from "@/config/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();

  // Public static marketing and legal pages
  const staticPages = [
    "",
    "/en",
    "/ar",
    "/en/services",
    "/ar/services",
    "/en/about",
    "/ar/about",
    "/en/contact",
    "/ar/contact",
    "/en/faq",
    "/ar/faq",
    "/en/blog",
    "/ar/blog",
    "/en/privacy-policy",
    "/ar/privacy-policy",
    "/en/terms-conditions",
    "/ar/terms-conditions",
    "/en/cancellation-policy",
    "/ar/cancellation-policy",
  ];

  // Active tour and service pages
  const servicePagesEn = en.services.map((s) => `/en/services/${s.id}`);
  const servicePagesAr = en.services.map((s) => `/ar/services/${s.id}`);

  // Dynamic published blog articles only (drafts are never included in sitemap)
  const publishedArticles = CURATED_ARTICLES.filter((a) => a.isPublished);
  const blogPagesEn = publishedArticles.map((a) => `/en/blog/${a.slug}`);
  const blogPagesAr = publishedArticles.map((a) => `/ar/blog/${a.slug}`);

  const allUrls = [
    ...staticPages,
    ...servicePagesEn,
    ...servicePagesAr,
    ...blogPagesEn,
    ...blogPagesAr,
  ];

  return allUrls.map((urlPath) => {
    const isService = urlPath.includes("/services/");
    const isBlog = urlPath.includes("/blog/");
    const isHome = urlPath === "" || urlPath === "/en" || urlPath === "/ar";

    let changeFrequency:
      | "always"
      | "hourly"
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly"
      | "never" = "weekly";
    let priority = 0.7;

    if (isHome) {
      priority = 1.0;
      changeFrequency = "daily";
    } else if (isService) {
      priority = 0.9;
      changeFrequency = "weekly";
    } else if (isBlog) {
      priority = 0.8;
      changeFrequency = "weekly";
    }

    return {
      url: `${baseUrl}${urlPath}`,
      lastModified,
      changeFrequency,
      priority,
    };
  });
}
