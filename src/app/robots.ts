import { MetadataRoute } from "next";
import { getBaseUrl } from "@/config/site-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/admin/",
        "/account",
        "/account/",
        "/login",
        "/signup",
        "/en/account",
        "/en/account/",
        "/ar/account",
        "/ar/account/",
        "/en/auth",
        "/ar/auth",
        "/en/login",
        "/ar/login",
        "/en/signup",
        "/ar/signup",
        "/en/admin",
        "/en/admin/",
        "/ar/admin",
        "/ar/admin/",
        "/booking/",
        "/en/booking/",
        "/ar/booking/",
        "/proposals/",
        "/en/proposals/",
        "/ar/proposals/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
