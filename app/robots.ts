import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

/**
 * Crawlability infrastructure: provides search engines and AI crawlers
 * with explicit indexing directives and references to the dynamic sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: ["Googlebot", "Bingbot", "OAI-SearchBot"],
        allow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
