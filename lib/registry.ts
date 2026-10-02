/**
 * Verified Model Registry for Hack Day Starter.
 *
 * Requirements (Phase 2):
 * - Primary source: Official Ollama library page (ollamaTag, artifact size, context window, capabilities).
 * - Secondary source: Official provider model card or documentation.
 * - Current as of October 2, 2026.
 * - Only models with `localSupport: true` and `verificationStatus: "verified"` may be recommended.
 * - Stale models (e.g. Gemma 3) are marked `stale` and excluded from recommendations.
 * - Official memory guidance is only stored when published by the vendor (e.g. Google Gemma 4 model card).
 *   Otherwise, it is stored as `null` and estimated at runtime.
 */

import { ModelEntry, RegistryMetadata } from "./types";

export const REGISTRY_METADATA: RegistryMetadata = {
  version: "2026.10.02",
  verifiedDate: "2026-10-02",
  verifiedDisplayDate: "October 2, 2026",
  sourceUrl: "https://ollama.com/library",
};

export const VERIFIED_MODEL_REGISTRY: ModelEntry[] = [
  // -------------------------------------------------------------------------
  // Gemma 4 Family (Google) - Verified October 2, 2026
  // -------------------------------------------------------------------------
  {
    id: "gemma-4-e4b",
    family: "gemma4",
    displayName: "Gemma 4 e4b",
    provider: "Google",
    ollamaTag: "gemma4:e4b",
    ollamaUrl: "https://ollama.com/library/gemma4",
    sourceUrl: "https://ai.google.dev/gemma/docs/gemma-4",
    license: "Gemma Terms of Use",
    parameterCount: "4B",
    artifactSizeGb: 2.8,
    contextWindow: 131072,
    capabilities: {
      tools: true,
      vision: true,
      audio: false,
      thinking: false,
    },
    localSupport: true,
    officialMemoryGuidance: 8,
    memoryGuidanceSource: "Google Gemma 4 Technical Report & Model Card",
    verifiedAt: "2026-10-02T00:00:00.000Z",
    verificationStatus: "verified",
    strengths: ["code", "chat", "general"],
    gpuBenefit: true,
    description:
      "Google's efficient 4B multimodal model with native tool-calling and 128k context.",
  },
  {
    id: "gemma-4-12b",
    family: "gemma4",
    displayName: "Gemma 4 12B",
    provider: "Google",
    ollamaTag: "gemma4:12b",
    ollamaUrl: "https://ollama.com/library/gemma4",
    sourceUrl: "https://ai.google.dev/gemma/docs/gemma-4",
    license: "Gemma Terms of Use",
    parameterCount: "12B",
    artifactSizeGb: 7.8,
    contextWindow: 131072,
    capabilities: {
      tools: true,
      vision: true,
      audio: false,
      thinking: false,
    },
    localSupport: true,
    officialMemoryGuidance: 16,
    memoryGuidanceSource: "Google Gemma 4 Technical Report & Model Card",
    verifiedAt: "2026-10-02T00:00:00.000Z",
    verificationStatus: "verified",
    strengths: ["code", "chat", "general", "summarization"],
    gpuBenefit: true,
    description:
      "Flagship local model from Google with high reasoning, vision understanding, and tool execution.",
  },

  // -------------------------------------------------------------------------
  // Qwen 3.5 Family (Alibaba Qwen) - Verified October 2, 2026
  // -------------------------------------------------------------------------
  {
    id: "qwen-3-5-4b",
    family: "qwen3.5",
    displayName: "Qwen 3.5 4B",
    provider: "Alibaba Qwen",
    ollamaTag: "qwen3.5:4b",
    ollamaUrl: "https://ollama.com/library/qwen3.5",
    sourceUrl: "https://github.com/QwenLM/Qwen3.5",
    license: "Apache-2.0",
    parameterCount: "4B",
    artifactSizeGb: 2.6,
    contextWindow: 65536,
    capabilities: {
      tools: true,
      vision: false,
      audio: false,
      thinking: true,
    },
    localSupport: true,
    officialMemoryGuidance: null, // No official minimum-RAM specification published
    memoryGuidanceSource: null,
    verifiedAt: "2026-10-02T00:00:00.000Z",
    verificationStatus: "verified",
    strengths: ["code", "chat", "general"],
    gpuBenefit: true,
    description:
      "Compact Qwen 3.5 release featuring hybrid thinking tokens, strong code logic, and tool usage.",
  },
  {
    id: "qwen-3-5-9b",
    family: "qwen3.5",
    displayName: "Qwen 3.5 9B",
    provider: "Alibaba Qwen",
    ollamaTag: "qwen3.5:9b",
    ollamaUrl: "https://ollama.com/library/qwen3.5",
    sourceUrl: "https://github.com/QwenLM/Qwen3.5",
    license: "Apache-2.0",
    parameterCount: "9B",
    artifactSizeGb: 5.6,
    contextWindow: 131072,
    capabilities: {
      tools: true,
      vision: false,
      audio: false,
      thinking: true,
    },
    localSupport: true,
    officialMemoryGuidance: null,
    memoryGuidanceSource: null,
    verifiedAt: "2026-10-02T00:00:00.000Z",
    verificationStatus: "verified",
    strengths: ["code", "chat", "summarization", "general"],
    gpuBenefit: true,
    description:
      "Balanced 9B model excelling at complex multi-step reasoning, coding tasks, and agents.",
  },

  // -------------------------------------------------------------------------
  // Qwen 3 Family (Alibaba Qwen) - Verified October 2, 2026
  // -------------------------------------------------------------------------
  {
    id: "qwen-3-8b",
    family: "qwen3",
    displayName: "Qwen 3 8B",
    provider: "Alibaba Qwen",
    ollamaTag: "qwen3:8b",
    ollamaUrl: "https://ollama.com/library/qwen3",
    sourceUrl: "https://github.com/QwenLM/Qwen3",
    license: "Apache-2.0",
    parameterCount: "8B",
    artifactSizeGb: 4.9,
    contextWindow: 32768,
    capabilities: {
      tools: true,
      vision: false,
      audio: false,
      thinking: false,
    },
    localSupport: true,
    officialMemoryGuidance: null,
    memoryGuidanceSource: null,
    verifiedAt: "2026-10-02T00:00:00.000Z",
    verificationStatus: "verified",
    strengths: ["code", "chat", "general"],
    gpuBenefit: true,
    description:
      "Reliable 8B general purpose model with low latency and stable structured JSON output.",
  },

  // -------------------------------------------------------------------------
  // GPT-OSS (OpenAI / Open-Weight Community) - Verified October 2, 2026
  // -------------------------------------------------------------------------
  {
    id: "gpt-oss-20b",
    family: "gpt-oss",
    displayName: "GPT-OSS 20B",
    provider: "Open-Weight Community",
    ollamaTag: "gpt-oss:20b",
    ollamaUrl: "https://ollama.com/library/gpt-oss",
    sourceUrl: "https://github.com/openai/gpt-oss",
    license: "Apache-2.0",
    parameterCount: "20B",
    activeParameterCount: "4B",
    artifactSizeGb: 11.5,
    contextWindow: 65536,
    capabilities: {
      tools: true,
      vision: false,
      audio: false,
      thinking: true,
    },
    localSupport: true,
    officialMemoryGuidance: null,
    memoryGuidanceSource: null,
    verifiedAt: "2026-10-02T00:00:00.000Z",
    verificationStatus: "verified",
    strengths: ["code", "summarization", "general"],
    gpuBenefit: true,
    description:
      "High-parameter sparse MoE model with 4B active parameters; requires 16+ GB RAM and SSD space.",
  },

  // -------------------------------------------------------------------------
  // Phi-4 Mini (Microsoft) - Verified October 2, 2026
  // -------------------------------------------------------------------------
  {
    id: "phi-4-mini",
    family: "phi4",
    displayName: "Phi-4 Mini",
    provider: "Microsoft",
    ollamaTag: "phi4-mini",
    ollamaUrl: "https://ollama.com/library/phi4-mini",
    sourceUrl: "https://huggingface.co/microsoft/Phi-4-mini-instruct",
    license: "MIT",
    parameterCount: "3.8B",
    artifactSizeGb: 2.4,
    contextWindow: 131072,
    capabilities: {
      tools: true,
      vision: false,
      audio: false,
      thinking: false,
    },
    localSupport: true,
    officialMemoryGuidance: null,
    memoryGuidanceSource: null,
    verifiedAt: "2026-10-02T00:00:00.000Z",
    verificationStatus: "verified",
    strengths: ["code", "general", "chat"],
    gpuBenefit: true,
    description:
      "Microsoft's compact 3.8B model with strong synthetic math, reasoning, and tool support.",
  },

  // -------------------------------------------------------------------------
  // Qwen 2.5 Coder 1.5B (Alibaba Qwen) - Ultra-light local code helper
  // NOTE: tools: false (crucial for verifying models without native tool-calling)
  // -------------------------------------------------------------------------
  {
    id: "qwen-2-5-coder-1-5b",
    family: "qwen2.5-coder",
    displayName: "Qwen 2.5 Coder 1.5B",
    provider: "Alibaba Qwen",
    ollamaTag: "qwen2.5-coder:1.5b",
    ollamaUrl: "https://ollama.com/library/qwen2.5-coder",
    sourceUrl: "https://github.com/QwenLM/Qwen2.5-Coder",
    license: "Apache-2.0",
    parameterCount: "1.5B",
    artifactSizeGb: 1.0,
    contextWindow: 32768,
    capabilities: {
      tools: false, // Intentionally false: lightweight code completion without function calling
      vision: false,
      audio: false,
      thinking: false,
    },
    localSupport: true,
    officialMemoryGuidance: null,
    memoryGuidanceSource: null,
    verifiedAt: "2026-10-02T00:00:00.000Z",
    verificationStatus: "verified",
    strengths: ["code"],
    gpuBenefit: false,
    description:
      "Ultra-compact coding model. Ideal for older hardware or quick CPU-only completions without tool overhead.",
  },

  // -------------------------------------------------------------------------
  // Gemma 3 12B - Stale record kept for registry audit & historical tracking
  // Marked 'stale' so recommendation engine excludes it in favor of Gemma 4.
  // -------------------------------------------------------------------------
  {
    id: "gemma-3-12b",
    family: "gemma3",
    displayName: "Gemma 3 12B (Deprecated / Stale)",
    provider: "Google",
    ollamaTag: "gemma3:12b",
    ollamaUrl: "https://ollama.com/library/gemma3",
    sourceUrl: "https://blog.google/technology/developers/gemma-3",
    license: "Gemma Terms of Use",
    parameterCount: "12B",
    artifactSizeGb: 8.1,
    contextWindow: 8192,
    capabilities: {
      tools: false,
      vision: false,
      audio: false,
      thinking: false,
    },
    localSupport: true,
    officialMemoryGuidance: null,
    memoryGuidanceSource: null,
    verifiedAt: "2025-02-15T00:00:00.000Z",
    verificationStatus: "stale", // Marked stale
    strengths: ["chat", "general"],
    gpuBenefit: true,
    description:
      "Legacy Gemma 3 release superseded by Gemma 4. Kept in registry for deprecation validation.",
  },
];
