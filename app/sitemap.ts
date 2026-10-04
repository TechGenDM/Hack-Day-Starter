import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";
import { REGISTRY_METADATA } from "@/lib/registry";

/**
 * Dynamic XML sitemap generator mapping all canonical public developer resources.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastMod = new Date(REGISTRY_METADATA.lastVerifiedAt);

  return [
    {
      url: SITE_URL,
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/model-registry`,
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/ollama-hardware-guide`,
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/ollama-tool-calling`,
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/how-it-works`,
      lastModified: lastMod,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
