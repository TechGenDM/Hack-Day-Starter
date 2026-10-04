/**
 * Centralized site configuration for canonical URLs, metadata, and crawlability infrastructure.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://hack-day-starter.vercel.app");

export const GITHUB_REPO_URL = "https://github.com/TechGenDM/hack-day-starter";

export const SITE_METADATA = {
  name: "Hack Day Starter",
  title: "Hack Day Starter — Hardware-Aware Local AI Recommender for Ollama",
  description:
    "Match your machine's RAM, GPU/VRAM, and OS against verified open-weight models. Deterministic local recommendations and instant TypeScript starter generation for Ollama.",
  keywords: [
    "local AI",
    "local LLM",
    "Ollama",
    "AI hardware requirements",
    "Ollama models",
    "tool calling",
    "AI agents",
    "TypeScript AI starter",
    "Apple silicon local AI",
    "NVIDIA VRAM LLM",
  ],
};
