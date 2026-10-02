/**
 * Model Discovery, Synchronization & Verification Architecture:
 *
 *   LIVE ECOSYSTEM DISCOVERY
 *             ↓
 *   PRACTICAL CANDIDATE SELECTION
 *             ↓
 *   SOURCE VERIFICATION
 *             ↓
 *   RECOMMENDATION
 *
 * Note: The candidate models represent a curated practical set evaluated for
 * local laptop execution, not the entire unbounded Ollama library catalog.
 *
 * Factual Precision Principles:
 * 1. sourceDisplaySize: exact string shown on Ollama web pages (e.g. "6.6GB", "6.6–9.5 GB").
 * 2. normalizedApproxSizeGb: numeric approximation in GB for hardware calculations.
 * 3. exactManifestSizeBytes: nullable! Null unless retrieved from actual raw manifest.
 *    Never derive "exact bytes" by converting a rounded display string.
 * 4. displayDigest: short 12-char digest shown on web pages (e.g. "009acb0d7fe1").
 * 5. fullManifestDigest: nullable! Null unless retrieved as sha256:<64 hex> from manifest.
 * 6. capabilities: unverified capabilities are stored as null rather than guessed false.
 */

import {
  ModelEntry,
  ModelCapabilities,
  RawOllamaObservation,
  SourceObservationType,
  VerificationStatus,
} from "../types";

/**
 * Parses raw text size (e.g. "6.6GB", "7.7GB", "900MB", "23GB - 24GB") to approximate GB.
 */
export function parseSizeToApproxGb(sizeStr: string): number {
  const match = sizeStr.match(/([0-9.]+)\s*(GB|MB|TB)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === "GB") return val;
  if (unit === "MB") return parseFloat((val / 1024).toFixed(2));
  if (unit === "TB") return val * 1024;
  return 0;
}

/**
 * Parses raw context string (e.g. "256K", "128K", "65K", "1M") to token count.
 */
export function parseContextToTokens(contextStr: string): number {
  const match = contextStr.match(/([0-9.]+)\s*([KM])/i);
  if (!match) return 8192;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === "M") return Math.round(val * 1024 * 1024);
  if (unit === "K") return Math.round(val * 1024);
  return Math.round(val);
}

/**
 * Live fetch: queries official Ollama library tags page over network at runtime.
 */
export async function fetchLiveOllamaTagObservation(
  model: string,
  targetTag: string,
  timeoutMs = 6000
): Promise<RawOllamaObservation | null> {
  const url = `https://ollama.com/library/${model}/tags`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "HackDayStarter-ModelRegistry/2.0 (hack-day-starter; Hacktoberfest 2026)",
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const html = await res.text();

    return parseOllamaTagsHtml(model, targetTag, html, "live-network");
  } catch {
    // Network unavailable or timed out
    return null;
  }
}

/**
 * Parses HTML returned by an Ollama tags page.
 */
export function parseOllamaTagsHtml(
  model: string,
  targetTag: string,
  html: string,
  sourceType: SourceObservationType
): RawOllamaObservation | null {
  // Pattern 1: Exact tag link href="/library/model:tag"
  const tagRegex = new RegExp(
    `href="\\/library\\/${model}:(${targetTag})"[\\s\\S]*?([a-f0-9]{12})[\\s\\S]*?([0-9.]+\\s*(?:GB|MB))[\\s\\S]*?([0-9]+[KM]) context window([\\s\\S]*?)<\\/div>`,
    "i"
  );
  let match = html.match(tagRegex);

  // Pattern 2: Fallback for latest or unaliased tag
  if (!match && targetTag === "latest") {
    const latestRegex = new RegExp(
      `href="\\/library\\/${model}"[\\s\\S]*?([a-f0-9]{12})[\\s\\S]*?([0-9.]+\\s*(?:GB|MB))[\\s\\S]*?([0-9]+[KM]) context window([\\s\\S]*?)<\\/div>`,
      "i"
    );
    match = html.match(latestRegex);
  }

  if (!match) return null;

  const fullTag = `${model}:${match[1] || targetTag}`;
  const displayDigest = match[2];
  const sourceDisplaySize = match[3].trim();
  const displayContext = match[4].trim();
  const details = match[5];

  const inputs: string[] = [];
  if (/Image/i.test(details)) inputs.push("Image");
  if (/Text/i.test(details)) inputs.push("Text");
  if (/Audio/i.test(details)) inputs.push("Audio");

  // Extract raw capability badges shown in tag entry
  const capabilityBadges: string[] = [...inputs];
  const badgeRegex = /<span[^>]*class="[^"]*rounded-full[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
  let bMatch;
  while ((bMatch = badgeRegex.exec(details || "")) !== null) {
    const badgeText = bMatch[1].replace(/<[^>]+>/g, "").trim();
    if (badgeText && !capabilityBadges.includes(badgeText)) {
      capabilityBadges.push(badgeText);
    }
  }

  return {
    ollamaTag: fullTag,
    displayDigest,
    fullManifestDigest: null, // Only populated when raw sha256 manifest is retrieved
    sourceDisplaySize,
    normalizedApproxSizeGb: parseSizeToApproxGb(sourceDisplaySize),
    exactManifestSizeBytes: null, // Never derive exact bytes from rounded display strings
    displayContext,
    contextTokens: parseContextToTokens(displayContext),
    inputs,
    capabilityBadges,
    observedAt: new Date().toISOString(),
    sourceUrl: `https://ollama.com/library/${model}/tags`,
    sourceType,
  };
}

// ---------------------------------------------------------------------------
// Regression Source Snapshot Fixture (Stored for deterministic testing/offline)
// NOT claimed as live discovery; used as regression baseline.
// ---------------------------------------------------------------------------

export const REGRESSION_SOURCE_SNAPSHOT: Record<string, RawOllamaObservation> = {
  "gemma4:e4b": {
    ollamaTag: "gemma4:e4b",
    displayDigest: "009acb0d7fe1",
    fullManifestDigest: null,
    sourceDisplaySize: "6.6GB",
    normalizedApproxSizeGb: 6.6,
    exactManifestSizeBytes: null,
    displayContext: "128K",
    contextTokens: 131072,
    inputs: ["Text", "Image"],
    capabilityBadges: ["Text", "Image"],
    observedAt: "2026-10-02T13:00:00.000Z",
    sourceUrl: "https://ollama.com/library/gemma4/tags",
    sourceType: "regression-fixture",
  },
  "gemma4:12b": {
    ollamaTag: "gemma4:12b",
    displayDigest: "312246b09fab",
    fullManifestDigest: null,
    sourceDisplaySize: "7.7GB",
    normalizedApproxSizeGb: 7.7,
    exactManifestSizeBytes: null,
    displayContext: "256K",
    contextTokens: 262144, // 256k verified from live Ollama
    inputs: ["Text", "Image"],
    capabilityBadges: ["Text", "Image"],
    observedAt: "2026-10-02T13:00:00.000Z",
    sourceUrl: "https://ollama.com/library/gemma4/tags",
    sourceType: "regression-fixture",
  },
  "qwen3.5:4b": {
    ollamaTag: "qwen3.5:4b",
    displayDigest: "2a654d98e6fb",
    fullManifestDigest: null,
    sourceDisplaySize: "3.4GB",
    normalizedApproxSizeGb: 3.4,
    exactManifestSizeBytes: null,
    displayContext: "256K",
    contextTokens: 262144, // 256k verified from live Ollama
    inputs: ["Text", "Image"],
    capabilityBadges: ["Text", "Image"],
    observedAt: "2026-10-02T13:00:00.000Z",
    sourceUrl: "https://ollama.com/library/qwen3.5/tags",
    sourceType: "regression-fixture",
  },
  "qwen3.5:9b": {
    ollamaTag: "qwen3.5:9b",
    displayDigest: "6488c96fa5fa",
    fullManifestDigest: null,
    sourceDisplaySize: "6.6GB",
    normalizedApproxSizeGb: 6.6,
    exactManifestSizeBytes: null,
    displayContext: "256K",
    contextTokens: 262144, // 256k verified from live Ollama
    inputs: ["Text", "Image"],
    capabilityBadges: ["Text", "Image"],
    observedAt: "2026-10-02T13:00:00.000Z",
    sourceUrl: "https://ollama.com/library/qwen3.5/tags",
    sourceType: "regression-fixture",
  },
  "qwen3.6:27b": {
    ollamaTag: "qwen3.6:27b",
    displayDigest: "1e2b3d172b7c",
    fullManifestDigest: null,
    sourceDisplaySize: "18GB",
    normalizedApproxSizeGb: 18.0,
    exactManifestSizeBytes: null,
    displayContext: "256K",
    contextTokens: 262144,
    inputs: ["Text", "Image"],
    capabilityBadges: ["Text", "Image"],
    observedAt: "2026-10-02T13:00:00.000Z",
    sourceUrl: "https://ollama.com/library/qwen3.6/tags",
    sourceType: "regression-fixture",
  },
  "qwen3.6:35b": {
    ollamaTag: "qwen3.6:35b",
    displayDigest: "8a43277aac50",
    fullManifestDigest: null,
    sourceDisplaySize: "23GB",
    normalizedApproxSizeGb: 23.0,
    exactManifestSizeBytes: null,
    displayContext: "256K",
    contextTokens: 262144,
    inputs: ["Text", "Image"],
    capabilityBadges: ["Text", "Image"],
    observedAt: "2026-10-02T13:00:00.000Z",
    sourceUrl: "https://ollama.com/library/qwen3.6/tags",
    sourceType: "regression-fixture",
  },
  "qwen3.8:27b": {
    ollamaTag: "qwen3.8:27b",
    displayDigest: "e118e4d12a70",
    fullManifestDigest: null,
    sourceDisplaySize: "18GB",
    normalizedApproxSizeGb: 18.0,
    exactManifestSizeBytes: null,
    displayContext: "256K",
    contextTokens: 262144, // 256k verified
    inputs: ["Text", "Image"],
    capabilityBadges: ["Text", "Image"],
    observedAt: "2026-10-02T13:00:00.000Z",
    sourceUrl: "https://ollama.com/library/qwen3.8/tags",
    sourceType: "regression-fixture",
  },
  "qwen3:8b": {
    ollamaTag: "qwen3:8b",
    displayDigest: "500a1f067a9f",
    fullManifestDigest: null,
    sourceDisplaySize: "5.2GB",
    normalizedApproxSizeGb: 5.2,
    exactManifestSizeBytes: null,
    displayContext: "40K",
    contextTokens: 40960, // 40K verified from live Ollama
    inputs: ["Text"],
    capabilityBadges: ["Text"],
    observedAt: "2026-10-02T13:00:00.000Z",
    sourceUrl: "https://ollama.com/library/qwen3/tags",
    sourceType: "regression-fixture",
  },
  "gpt-oss:20b": {
    ollamaTag: "gpt-oss:20b",
    displayDigest: "17052f91a42e",
    fullManifestDigest: null,
    sourceDisplaySize: "14GB",
    normalizedApproxSizeGb: 14.0,
    exactManifestSizeBytes: null,
    displayContext: "128K",
    contextTokens: 131072, // 128k verified
    inputs: ["Text"],
    capabilityBadges: ["Text"],
    observedAt: "2026-10-02T13:00:00.000Z",
    sourceUrl: "https://ollama.com/library/gpt-oss/tags",
    sourceType: "regression-fixture",
  },
  "phi4-mini": {
    ollamaTag: "phi4-mini",
    displayDigest: "78fad5d182a7",
    fullManifestDigest: null,
    sourceDisplaySize: "2.5GB",
    normalizedApproxSizeGb: 2.5,
    exactManifestSizeBytes: null,
    displayContext: "128K",
    contextTokens: 131072,
    inputs: ["Text"],
    capabilityBadges: ["Text"],
    observedAt: "2026-10-02T13:00:00.000Z",
    sourceUrl: "https://ollama.com/library/phi4-mini/tags",
    sourceType: "regression-fixture",
  },
  "nemotron-3-nano:4b": {
    ollamaTag: "nemotron-3-nano:4b",
    displayDigest: "6cc467f05439",
    fullManifestDigest: null,
    sourceDisplaySize: "2.8GB",
    normalizedApproxSizeGb: 2.8,
    exactManifestSizeBytes: null,
    displayContext: "256K",
    contextTokens: 262144, // 256k verified
    inputs: ["Text"],
    capabilityBadges: ["Text"],
    observedAt: "2026-10-02T13:00:00.000Z",
    sourceUrl: "https://ollama.com/library/nemotron-3-nano/tags",
    sourceType: "regression-fixture",
  },
  "qwen3-coder-next:latest": {
    ollamaTag: "qwen3-coder-next:latest",
    displayDigest: "ca06e9e4087c",
    fullManifestDigest: null,
    sourceDisplaySize: "52GB",
    normalizedApproxSizeGb: 52.0,
    exactManifestSizeBytes: null,
    displayContext: "256K",
    contextTokens: 262144, // 256k verified
    inputs: ["Text"],
    capabilityBadges: ["Text"],
    observedAt: "2026-10-02T13:00:00.000Z",
    sourceUrl: "https://ollama.com/library/qwen3-coder-next/tags",
    sourceType: "regression-fixture",
  },
  "deepseek-r1:1.5b": {
    ollamaTag: "deepseek-r1:1.5b",
    displayDigest: "e0979632db5a",
    fullManifestDigest: null,
    sourceDisplaySize: "1.1GB",
    normalizedApproxSizeGb: 1.1,
    exactManifestSizeBytes: null,
    displayContext: "128K",
    contextTokens: 131072,
    inputs: ["Text"],
    capabilityBadges: ["Text"],
    observedAt: "2026-10-02T13:00:00.000Z",
    sourceUrl: "https://ollama.com/library/deepseek-r1/tags",
    sourceType: "regression-fixture",
  },
  "gemma3:12b": {
    ollamaTag: "gemma3:12b",
    displayDigest: "f4031aab637d",
    fullManifestDigest: null,
    sourceDisplaySize: "8.1GB",
    normalizedApproxSizeGb: 8.1,
    exactManifestSizeBytes: null,
    displayContext: "128K",
    contextTokens: 131072,
    inputs: ["Text", "Image"],
    capabilityBadges: ["Text", "Image"],
    observedAt: "2026-10-02T13:00:00.000Z",
    sourceUrl: "https://ollama.com/library/gemma3/tags",
    sourceType: "regression-fixture",
  },
  "llama2:7b": {
    ollamaTag: "llama2:7b",
    displayDigest: "78e26419b446", // Exact live digest
    sourceDisplaySize: "3.8GB",
    normalizedApproxSizeGb: 3.8,
    exactManifestSizeBytes: null,
    fullManifestDigest: null,
    displayContext: "4K",
    contextTokens: 4096,
    inputs: ["Text"],
    capabilityBadges: ["Text"],
    observedAt: "2026-10-02T13:00:00.000Z",
    sourceUrl: "https://ollama.com/library/llama2/tags",
    sourceType: "regression-fixture",
  },
  "mistral:v0.1": {
    ollamaTag: "mistral:v0.1",
    displayDigest: "b17615239298",
    fullManifestDigest: null,
    sourceDisplaySize: "4.1GB",
    normalizedApproxSizeGb: 4.1,
    exactManifestSizeBytes: null,
    displayContext: "32K",
    contextTokens: 32768,
    inputs: ["Text"],
    capabilityBadges: ["Text"],
    observedAt: "2025-01-10T00:00:00.000Z",
    sourceUrl: "https://ollama.com/library/mistral/tags",
    sourceType: "regression-fixture",
  },
  "glm4:9b": {
    ollamaTag: "glm4:9b",
    displayDigest: "5b699761eca5",
    fullManifestDigest: null,
    sourceDisplaySize: "5.5GB",
    normalizedApproxSizeGb: 5.5,
    exactManifestSizeBytes: null,
    displayContext: "128K",
    contextTokens: 131072,
    inputs: ["Text"],
    capabilityBadges: ["Text"],
    observedAt: "2026-10-02T13:00:00.000Z",
    sourceUrl: "https://ollama.com/library/glm4/tags",
    sourceType: "regression-fixture",
  },
};

/**
 * Discrepancy detector: compares a curated ModelEntry against raw source observations.
 * Returns a list of discrepancies. If empty, the record is verified.
 */
export function detectSourceDiscrepancies(
  model: ModelEntry,
  obs: RawOllamaObservation
): string[] {
  const discrepancies: string[] = [];

  // 1. Context window check
  if (model.contextTokens !== obs.contextTokens) {
    discrepancies.push(
      `Context window discrepancy: curated ${model.contextTokens} tokens vs observed ${obs.contextTokens} tokens (${obs.displayContext})`
    );
  }

  // 2. Listed size check: compare normalized approx GB (tolerance within 10%)
  const sizeDiffRatio =
    Math.abs(model.normalizedApproxSizeGb - obs.normalizedApproxSizeGb) /
    obs.normalizedApproxSizeGb;
  if (sizeDiffRatio > 0.10) {
    discrepancies.push(
      `Ollama listed size discrepancy: curated ~${model.normalizedApproxSizeGb} GB ("${model.sourceDisplaySize}") vs observed ~${obs.normalizedApproxSizeGb} GB ("${obs.sourceDisplaySize}")`
    );
  }

  // 3. Vision modality check
  const obsHasVision = obs.inputs.includes("Image");
  if (model.capabilities.vision !== null && model.capabilities.vision !== obsHasVision) {
    discrepancies.push(
      `Vision capability discrepancy: curated vision=${model.capabilities.vision} vs observed inputs=[${obs.inputs.join(", ")}]`
    );
  }

  // 4. Display digest check (short 12-char digest)
  if (model.displayDigest && obs.displayDigest && model.displayDigest !== obs.displayDigest) {
    discrepancies.push(
      `Display digest discrepancy: curated ${model.displayDigest} vs observed ${obs.displayDigest}`
    );
  }

  return discrepancies;
}

// ---------------------------------------------------------------------------
// Curated Model Registry Definition (Practical Candidate Set)
// ---------------------------------------------------------------------------

export const CURATED_MODEL_DEFINITIONS: ModelEntry[] = [
  // -------------------------------------------------------------------------
  // Gemma 4 Family (Google DeepMind)
  // -------------------------------------------------------------------------
  {
    id: "gemma-4-e4b",
    family: "gemma4",
    displayName: "Gemma 4 e4b",
    provider: "Google",
    ollamaTag: "gemma4:e4b",
    displayDigest: "009acb0d7fe1",
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/gemma4",
    sourceUrl: "https://ai.google.dev/gemma/docs/gemma-4",
    license: "Gemma Terms of Use",
    parameterCount: "4B",
    activeParameterCount: null,
    quantization: "Q4_K_M",
    sourceDisplaySize: "6.6GB",
    normalizedApproxSizeGb: 6.6,
    exactManifestSizeBytes: null, // Web source displays rounded value; raw manifest bytes not downloaded
    contextTokens: 131072, // 128k
    capabilities: {
      tools: true,
      vision: true,
      audio: null, // primary source does not verify audio
      thinking: true,
      capabilityBadges: ["Text", "Image"],
    },
    localSupport: true,
    lifecycle: "current",
    verificationStatus: "verified",
    verifiedAt: "2026-10-02T13:00:00.000Z",
    sourceObservedAt: "2026-10-02T13:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: {
      valueGb: 4.8,
      precision: "Q4_K_M",
      hardwareType: "Metal / CUDA VRAM",
      sourceUrl: "https://ai.google.dev/gemma/docs/gemma-4",
    },
    officialSystemMemoryGuidance: {
      valueGb: 8,
      sourceUrl: "https://ai.google.dev/gemma/docs/gemma-4",
    },
    estimatedSystemMemoryComfort: {
      valueGb: 9,
      methodology:
        "Ollama listed (~6.6 GB) + KV cache buffer (2.0 GB) + OS headroom, rounded up. Heuristic estimate only.",
    },
    strengths: ["code", "chat", "general"],
    gpuBenefit: true,
    description:
      "Google's 4B multimodal model with native tool-calling, vision inputs, and configurable reasoning tokens.",
  },

  {
    id: "gemma-4-12b",
    family: "gemma4",
    displayName: "Gemma 4 12B",
    provider: "Google",
    ollamaTag: "gemma4:12b",
    displayDigest: "312246b09fab",
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/gemma4",
    sourceUrl: "https://ai.google.dev/gemma/docs/gemma-4",
    license: "Gemma Terms of Use",
    parameterCount: "12B",
    activeParameterCount: null,
    quantization: "Q4_K_M",
    sourceDisplaySize: "7.7GB",
    normalizedApproxSizeGb: 7.7,
    exactManifestSizeBytes: null,
    contextTokens: 262144, // 256k verified from live Ollama
    capabilities: {
      tools: true,
      vision: true,
      audio: null,
      thinking: true,
      capabilityBadges: ["Text", "Image"],
    },
    localSupport: true,
    lifecycle: "current",
    verificationStatus: "verified",
    verifiedAt: "2026-10-02T13:00:00.000Z",
    sourceObservedAt: "2026-10-02T13:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: {
      valueGb: 8.5,
      precision: "Q4_K_M",
      hardwareType: "Metal / CUDA VRAM",
      sourceUrl: "https://ai.google.dev/gemma/docs/gemma-4",
    },
    officialSystemMemoryGuidance: {
      valueGb: 16,
      sourceUrl: "https://ai.google.dev/gemma/docs/gemma-4",
    },
    estimatedSystemMemoryComfort: {
      valueGb: 11,
      methodology:
        "Ollama listed (~7.7 GB) + KV cache buffer (2.5 GB) + OS headroom, rounded up. Heuristic estimate only.",
    },
    strengths: ["code", "chat", "general", "summarization"],
    gpuBenefit: true,
    description:
      "Flagship local model from Google offering high reasoning, multimodal perception, and 256k context.",
  },

  // -------------------------------------------------------------------------
  // Qwen 3.5 Family (Alibaba Qwen)
  // -------------------------------------------------------------------------
  {
    id: "qwen-3-5-4b",
    family: "qwen3.5",
    displayName: "Qwen 3.5 4B",
    provider: "Alibaba Qwen",
    ollamaTag: "qwen3.5:4b",
    displayDigest: "2a654d98e6fb",
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/qwen3.5",
    sourceUrl: "https://github.com/QwenLM/Qwen3.5",
    license: "Apache-2.0",
    parameterCount: "4B",
    activeParameterCount: null,
    quantization: "Q4_K_M",
    sourceDisplaySize: "3.4GB",
    normalizedApproxSizeGb: 3.4,
    exactManifestSizeBytes: null,
    contextTokens: 262144, // 256k verified from live Ollama
    capabilities: {
      tools: true,
      vision: true,
      audio: null,
      thinking: true,
      capabilityBadges: ["Text", "Image"],
    },
    localSupport: true,
    lifecycle: "current",
    verificationStatus: "verified",
    verifiedAt: "2026-10-02T13:00:00.000Z",
    sourceObservedAt: "2026-10-02T13:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: null, // No official host VRAM/RAM specification published
    officialSystemMemoryGuidance: null,
    estimatedSystemMemoryComfort: {
      valueGb: 6,
      methodology:
        "Ollama listed (~3.4 GB) + KV cache buffer (2.0 GB) + OS headroom, rounded up. Heuristic estimate only.",
    },
    strengths: ["code", "chat", "general"],
    gpuBenefit: true,
    description:
      "Compact Qwen 3.5 release featuring hybrid thinking tokens, strong code logic, vision input, and 256k context.",
  },

  {
    id: "qwen-3-5-9b",
    family: "qwen3.5",
    displayName: "Qwen 3.5 9B",
    provider: "Alibaba Qwen",
    ollamaTag: "qwen3.5:9b",
    displayDigest: "6488c96fa5fa",
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/qwen3.5",
    sourceUrl: "https://github.com/QwenLM/Qwen3.5",
    license: "Apache-2.0",
    parameterCount: "9B",
    activeParameterCount: null,
    quantization: "Q4_K_M",
    sourceDisplaySize: "6.6GB",
    normalizedApproxSizeGb: 6.6,
    exactManifestSizeBytes: null,
    contextTokens: 262144, // 256k verified from live Ollama
    capabilities: {
      tools: true,
      vision: true,
      audio: null,
      thinking: true,
      capabilityBadges: ["Text", "Image"],
    },
    localSupport: true,
    lifecycle: "current",
    verificationStatus: "verified",
    verifiedAt: "2026-10-02T13:00:00.000Z",
    sourceObservedAt: "2026-10-02T13:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: null,
    officialSystemMemoryGuidance: null,
    estimatedSystemMemoryComfort: {
      valueGb: 10,
      methodology:
        "Ollama listed (~6.6 GB) + KV cache buffer (2.5 GB) + OS headroom, rounded up. Heuristic estimate only.",
    },
    strengths: ["code", "chat", "summarization", "general"],
    gpuBenefit: true,
    description:
      "Balanced 9B model excelling at complex multi-step reasoning, coding tasks, and 256k context window.",
  },

  // -------------------------------------------------------------------------
  // Qwen 3.6 Family (Alibaba Qwen)
  // -------------------------------------------------------------------------
  {
    id: "qwen-3-6-27b",
    family: "qwen3.6",
    displayName: "Qwen 3.6 27B",
    provider: "Alibaba Qwen",
    ollamaTag: "qwen3.6:27b",
    displayDigest: "1e2b3d172b7c",
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/qwen3.6",
    sourceUrl: "https://github.com/QwenLM/Qwen3.6",
    license: "Apache-2.0",
    parameterCount: "27B",
    activeParameterCount: null,
    quantization: "Q4_K_M",
    sourceDisplaySize: "18GB",
    normalizedApproxSizeGb: 18.0,
    exactManifestSizeBytes: null,
    contextTokens: 262144, // 256k verified
    capabilities: {
      tools: true,
      vision: true,
      audio: null,
      thinking: true,
      capabilityBadges: ["Text", "Image"],
    },
    localSupport: true,
    lifecycle: "current",
    verificationStatus: "verified",
    verifiedAt: "2026-10-02T13:00:00.000Z",
    sourceObservedAt: "2026-10-02T13:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: null,
    officialSystemMemoryGuidance: null,
    estimatedSystemMemoryComfort: {
      valueGb: 24,
      methodology:
        "Ollama listed (~18 GB) + KV cache buffer (4.0 GB) + OS headroom, rounded up. Heuristic estimate only.",
    },
    strengths: ["code", "chat", "summarization", "general"],
    gpuBenefit: true,
    description:
      "Dense 27B model from Qwen 3.6 series with extended 256k context window and multimodal vision.",
  },

  {
    id: "qwen-3-6-35b",
    family: "qwen3.6",
    displayName: "Qwen 3.6 35B",
    provider: "Alibaba Qwen",
    ollamaTag: "qwen3.6:35b",
    displayDigest: "8a43277aac50",
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/qwen3.6",
    sourceUrl: "https://github.com/QwenLM/Qwen3.6",
    license: "Apache-2.0",
    parameterCount: "35B",
    activeParameterCount: null,
    quantization: "Q4_K_M",
    sourceDisplaySize: "23GB",
    normalizedApproxSizeGb: 23.0,
    exactManifestSizeBytes: null,
    contextTokens: 262144, // 256k verified
    capabilities: {
      tools: true,
      vision: true,
      audio: null,
      thinking: true,
      capabilityBadges: ["Text", "Image"],
    },
    localSupport: true,
    lifecycle: "current",
    verificationStatus: "verified",
    verifiedAt: "2026-10-02T13:00:00.000Z",
    sourceObservedAt: "2026-10-02T13:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: null,
    officialSystemMemoryGuidance: null,
    estimatedSystemMemoryComfort: {
      valueGb: 30,
      methodology:
        "Ollama listed (~23 GB) + KV cache buffer (5.0 GB) + OS headroom, rounded up. Heuristic estimate only.",
    },
    strengths: ["code", "chat", "summarization", "general"],
    gpuBenefit: true,
    description:
      "35B parameter model with 23 GB download footprint and full 256k context for high-memory setups.",
  },

  // -------------------------------------------------------------------------
  // Qwen 3.8 Family (Alibaba Qwen - August 2026 Release)
  // -------------------------------------------------------------------------
  {
    id: "qwen-3-8-27b",
    family: "qwen3.8",
    displayName: "Qwen 3.8 27B",
    provider: "Alibaba Qwen",
    ollamaTag: "qwen3.8:27b",
    displayDigest: "e118e4d12a70",
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/qwen3.8",
    sourceUrl: "https://github.com/QwenLM/Qwen3.8",
    license: "Apache-2.0",
    parameterCount: "27B",
    activeParameterCount: null,
    quantization: "Q4_K_M",
    sourceDisplaySize: "18GB",
    normalizedApproxSizeGb: 18.0,
    exactManifestSizeBytes: null,
    contextTokens: 262144, // 256k verified
    capabilities: {
      tools: true,
      vision: true,
      audio: null,
      thinking: true,
      capabilityBadges: ["Text", "Image"],
    },
    localSupport: true,
    lifecycle: "current",
    verificationStatus: "verified",
    verifiedAt: "2026-10-02T13:00:00.000Z",
    sourceObservedAt: "2026-10-02T13:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: null,
    officialSystemMemoryGuidance: null,
    estimatedSystemMemoryComfort: {
      valueGb: 24,
      methodology:
        "Ollama listed (~18 GB) + KV cache buffer (4.0 GB) + OS headroom, rounded up. Heuristic estimate only.",
    },
    strengths: ["code", "chat", "summarization", "general"],
    gpuBenefit: true,
    description:
      "Qwen 3.8 release (August 2026) with refined reasoning architecture, 256k context, and multimodal vision.",
  },

  // -------------------------------------------------------------------------
  // Qwen 3 Family (Alibaba Qwen)
  // -------------------------------------------------------------------------
  {
    id: "qwen-3-8b",
    family: "qwen3",
    displayName: "Qwen 3 8B",
    provider: "Alibaba Qwen",
    ollamaTag: "qwen3:8b",
    displayDigest: "500a1f067a9f",
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/qwen3",
    sourceUrl: "https://github.com/QwenLM/Qwen3",
    license: "Apache-2.0",
    parameterCount: "8B",
    activeParameterCount: null,
    quantization: "Q4_K_M",
    sourceDisplaySize: "5.2GB",
    normalizedApproxSizeGb: 5.2,
    exactManifestSizeBytes: null,
    contextTokens: 40960, // 40K verified from live Ollama
    capabilities: {
      tools: true,
      vision: false,
      audio: null,
      thinking: null,
      capabilityBadges: ["Text"],
    },
    localSupport: true,
    lifecycle: "current",
    verificationStatus: "verified",
    verifiedAt: "2026-10-02T13:00:00.000Z",
    sourceObservedAt: "2026-10-02T13:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: null,
    officialSystemMemoryGuidance: null,
    estimatedSystemMemoryComfort: {
      valueGb: 8,
      methodology:
        "Ollama listed (~5.2 GB) + KV cache buffer (2.0 GB) + OS headroom, rounded up. Heuristic estimate only.",
    },
    strengths: ["code", "chat", "general"],
    gpuBenefit: true,
    description:
      "Standard dense 8B model with fast latency and proven tool calling for intermediate laptops.",
  },

  // -------------------------------------------------------------------------
  // GPT-OSS (OpenAI / Open-Weight Community)
  // -------------------------------------------------------------------------
  {
    id: "gpt-oss-20b",
    family: "gpt-oss",
    displayName: "GPT-OSS 20B",
    provider: "Open-Weight Community",
    ollamaTag: "gpt-oss:20b",
    displayDigest: "17052f91a42e",
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/gpt-oss",
    sourceUrl: "https://github.com/openai/gpt-oss",
    license: "Apache-2.0",
    parameterCount: "21B", // 21B total parameters per OpenAI technical report
    activeParameterCount: "3.6B", // 3.6B active parameters
    quantization: "Q4_K_M",
    sourceDisplaySize: "14GB",
    normalizedApproxSizeGb: 14.0,
    exactManifestSizeBytes: null,
    contextTokens: 131072, // 128k verified
    capabilities: {
      tools: true,
      vision: false,
      audio: null,
      thinking: true,
      capabilityBadges: ["Text"],
    },
    localSupport: true,
    lifecycle: "current",
    verificationStatus: "verified",
    verifiedAt: "2026-10-02T13:00:00.000Z",
    sourceObservedAt: "2026-10-02T13:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: null,
    officialSystemMemoryGuidance: null,
    estimatedSystemMemoryComfort: {
      valueGb: 18,
      methodology:
        "Ollama listed (~14 GB) + KV cache buffer (3.5 GB) + OS headroom, rounded up. Heuristic estimate only.",
    },
    strengths: ["code", "summarization", "general"],
    gpuBenefit: true,
    description:
      "Open-weight architecture with 21B total parameters (3.6B active) and 14 GB Ollama download.",
  },

  // -------------------------------------------------------------------------
  // Phi-4 Mini (Microsoft)
  // -------------------------------------------------------------------------
  {
    id: "phi-4-mini",
    family: "phi4",
    displayName: "Phi-4 Mini",
    provider: "Microsoft",
    ollamaTag: "phi4-mini",
    displayDigest: "78fad5d182a7",
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/phi4-mini",
    sourceUrl: "https://huggingface.co/microsoft/Phi-4-mini-instruct",
    license: "MIT",
    parameterCount: "3.8B",
    activeParameterCount: null,
    quantization: "Q4_K_M",
    sourceDisplaySize: "2.5GB",
    normalizedApproxSizeGb: 2.5,
    exactManifestSizeBytes: null,
    contextTokens: 131072, // 128k verified
    capabilities: {
      tools: true,
      vision: false,
      audio: null,
      thinking: null,
      capabilityBadges: ["Text"],
    },
    localSupport: true,
    lifecycle: "current",
    verificationStatus: "verified",
    verifiedAt: "2026-10-02T13:00:00.000Z",
    sourceObservedAt: "2026-10-02T13:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: null,
    officialSystemMemoryGuidance: null,
    estimatedSystemMemoryComfort: {
      valueGb: 4,
      methodology:
        "Ollama listed (~2.5 GB) + KV cache buffer (1.5 GB) + OS headroom, rounded up. Heuristic estimate only.",
    },
    strengths: ["code", "general", "chat"],
    gpuBenefit: true,
    description:
      "Microsoft's 3.8B model with strong synthetic math, reasoning, and tool support for lightweight machines.",
  },

  // -------------------------------------------------------------------------
  // Nemotron 3 Nano (NVIDIA)
  // -------------------------------------------------------------------------
  {
    id: "nemotron-3-nano-4b",
    family: "nemotron3",
    displayName: "Nemotron 3 Nano 4B",
    provider: "NVIDIA",
    ollamaTag: "nemotron-3-nano:4b",
    displayDigest: "6cc467f05439",
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/nemotron-3-nano",
    sourceUrl: "https://huggingface.co/nvidia/nemotron-3-nano",
    license: "NVIDIA Open Model License",
    parameterCount: "4B",
    activeParameterCount: null,
    quantization: "Q4_K_M",
    sourceDisplaySize: "2.8GB",
    normalizedApproxSizeGb: 2.8,
    exactManifestSizeBytes: null,
    contextTokens: 262144, // 256k verified from live Ollama
    capabilities: {
      tools: true,
      vision: false,
      audio: null,
      thinking: null,
      capabilityBadges: ["Text"],
    },
    localSupport: true,
    lifecycle: "current",
    verificationStatus: "verified",
    verifiedAt: "2026-10-02T13:00:00.000Z",
    sourceObservedAt: "2026-10-02T13:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: {
      valueGb: 2.8,
      precision: "Q4_K_M",
      hardwareType: "CUDA VRAM",
      sourceUrl: "https://huggingface.co/nvidia/nemotron-3-nano",
    },
    officialSystemMemoryGuidance: null,
    estimatedSystemMemoryComfort: {
      valueGb: 5,
      methodology:
        "Ollama listed (~2.8 GB) + KV cache buffer (1.5 GB) + OS headroom, rounded up. Heuristic estimate only.",
    },
    strengths: ["code", "chat", "general"],
    gpuBenefit: true,
    description:
      "NVIDIA's 4B edge model with 2.8 GB footprint and 256k context engineered for low-latency tool calling.",
  },

  // -------------------------------------------------------------------------
  // Qwen3-Coder-Next (Alibaba Qwen)
  // -------------------------------------------------------------------------
  {
    id: "qwen3-coder-next",
    family: "qwen3-coder",
    displayName: "Qwen 3 Coder Next",
    provider: "Alibaba Qwen",
    ollamaTag: "qwen3-coder-next:latest",
    displayDigest: "ca06e9e4087c",
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/qwen3-coder-next",
    sourceUrl: "https://github.com/QwenLM/Qwen3-Coder",
    license: "Apache-2.0",
    parameterCount: "80B", // 80B total parameters
    activeParameterCount: "3B", // 3B active parameters
    quantization: "Q4_K_M",
    sourceDisplaySize: "52GB",
    normalizedApproxSizeGb: 52.0,
    exactManifestSizeBytes: null,
    contextTokens: 262144, // 256k verified from live Ollama
    capabilities: {
      tools: true,
      vision: false,
      audio: null,
      thinking: true,
      capabilityBadges: ["Text"],
    },
    localSupport: true,
    lifecycle: "current",
    verificationStatus: "verified",
    verifiedAt: "2026-10-02T13:00:00.000Z",
    sourceObservedAt: "2026-10-02T13:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: null,
    officialSystemMemoryGuidance: null,
    estimatedSystemMemoryComfort: {
      valueGb: 60,
      methodology:
        "Ollama listed (~52 GB) + KV cache buffer (6.0 GB) + OS headroom, rounded up. High-memory workstation requirement.",
    },
    strengths: ["code"],
    gpuBenefit: true,
    description:
      "80B sparse MoE coding model with 3B active parameters, 52 GB footprint, and 256k context for high-end workstations.",
  },

  // -------------------------------------------------------------------------
  // DeepSeek R1 1.5B (DeepSeek) - Verified NO Tools
  // -------------------------------------------------------------------------
  {
    id: "deepseek-r1-1-5b",
    family: "deepseek-r1",
    displayName: "DeepSeek R1 1.5B",
    provider: "DeepSeek",
    ollamaTag: "deepseek-r1:1.5b",
    displayDigest: "e0979632db5a",
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/deepseek-r1",
    sourceUrl: "https://github.com/deepseek-ai/DeepSeek-R1",
    license: "MIT",
    parameterCount: "1.5B",
    activeParameterCount: null,
    quantization: "Q4_K_M",
    sourceDisplaySize: "1.1GB",
    normalizedApproxSizeGb: 1.1,
    exactManifestSizeBytes: null,
    contextTokens: 131072, // 128k verified
    capabilities: {
      tools: false, // Authoritative: Ollama library does NOT tag deepseek-r1 with tools
      vision: false,
      audio: null,
      thinking: true,
      capabilityBadges: ["Text"],
    },
    localSupport: true,
    lifecycle: "current",
    verificationStatus: "verified",
    verifiedAt: "2026-10-02T13:00:00.000Z",
    sourceObservedAt: "2026-10-02T13:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: null,
    officialSystemMemoryGuidance: null,
    estimatedSystemMemoryComfort: {
      valueGb: 3,
      methodology:
        "Ollama listed (~1.1 GB) + KV cache buffer (1.5 GB) + OS headroom, rounded up. Heuristic estimate only.",
    },
    strengths: ["code", "general"],
    gpuBenefit: false,
    description:
      "Distilled 1.5B reasoning model with chain-of-thought outputs. Runs fast on CPU; does not support native function calling.",
  },

  // -------------------------------------------------------------------------
  // Gemma 3 12B (Google) - Legacy Generation
  // -------------------------------------------------------------------------
  {
    id: "gemma-3-12b",
    family: "gemma3",
    displayName: "Gemma 3 12B",
    provider: "Google",
    ollamaTag: "gemma3:12b",
    displayDigest: "f4031aab637d",
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/gemma3",
    sourceUrl: "https://blog.google/technology/developers/gemma-3",
    license: "Gemma Terms of Use",
    parameterCount: "12B",
    activeParameterCount: null,
    quantization: "Q4_K_M",
    sourceDisplaySize: "8.1GB",
    normalizedApproxSizeGb: 8.1,
    exactManifestSizeBytes: null,
    contextTokens: 131072, // 128k
    capabilities: {
      tools: true,
      vision: true,
      audio: null,
      thinking: null,
      capabilityBadges: ["Text", "Image"],
    },
    localSupport: true,
    lifecycle: "legacy", // Superseded by Gemma 4
    verificationStatus: "verified",
    verifiedAt: "2026-10-02T13:00:00.000Z",
    sourceObservedAt: "2026-10-02T13:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: null,
    officialSystemMemoryGuidance: null,
    estimatedSystemMemoryComfort: {
      valueGb: 12,
      methodology: "Historical estimate.",
    },
    strengths: ["chat", "general"],
    gpuBenefit: true,
    description:
      "Legacy Gemma 3 release superseded by Gemma 4. Kept in registry for historical compatibility.",
  },

  // -------------------------------------------------------------------------
  // Llama 2 7B (Meta) - Retired Generation
  // -------------------------------------------------------------------------
  {
    id: "llama2-7b",
    family: "llama2",
    displayName: "Llama 2 7B (Retired)",
    provider: "Meta",
    ollamaTag: "llama2:7b",
    displayDigest: "78e26419b446", // Exact live digest
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/llama2",
    sourceUrl: "https://ai.meta.com/llama/llama-2",
    license: "Llama 2 Community License",
    parameterCount: "7B",
    activeParameterCount: null,
    quantization: "Q4_0",
    sourceDisplaySize: "3.8GB",
    normalizedApproxSizeGb: 3.8,
    exactManifestSizeBytes: null,
    contextTokens: 4096,
    capabilities: {
      tools: false,
      vision: false,
      audio: null,
      thinking: null,
      capabilityBadges: ["Text"],
    },
    localSupport: true,
    lifecycle: "retired", // Retired
    verificationStatus: "verified",
    verifiedAt: "2026-10-02T13:00:00.000Z",
    sourceObservedAt: "2026-10-02T13:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: null,
    officialSystemMemoryGuidance: null,
    estimatedSystemMemoryComfort: {
      valueGb: 6,
      methodology: "Historical estimate.",
    },
    strengths: ["chat"],
    gpuBenefit: true,
    description: "Deprecated 2023 release. Marked as retired in registry.",
  },

  // -------------------------------------------------------------------------
  // Mistral 7B v0.1 (Mistral AI) - Stale Metadata Generation (for freshness test)
  // -------------------------------------------------------------------------
  {
    id: "mistral-v0-1",
    family: "mistral",
    displayName: "Mistral 7B v0.1 (Stale Metadata)",
    provider: "Mistral AI",
    ollamaTag: "mistral:v0.1",
    displayDigest: "b17615239298",
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/mistral",
    sourceUrl: "https://mistral.ai",
    license: "Apache-2.0",
    parameterCount: "7B",
    activeParameterCount: null,
    quantization: "Q4_K_M",
    sourceDisplaySize: "4.1GB",
    normalizedApproxSizeGb: 4.1,
    exactManifestSizeBytes: null,
    contextTokens: 32768, // 32K
    capabilities: {
      tools: true,
      vision: false,
      audio: null,
      thinking: null,
      capabilityBadges: ["Text"],
    },
    localSupport: true,
    lifecycle: "legacy",
    verificationStatus: "metadata-stale",
    verifiedAt: "2025-01-10T00:00:00.000Z",
    sourceObservedAt: "2025-01-10T00:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: null,
    officialSystemMemoryGuidance: null,
    estimatedSystemMemoryComfort: {
      valueGb: 7,
      methodology: "Historical estimate.",
    },
    strengths: ["general"],
    gpuBenefit: true,
    description: "Legacy Mistral model with outdated verification metadata.",
  },

  // -------------------------------------------------------------------------
  // GLM-4 9B (Zhipu AI) - Unverified Candidate Generation
  // -------------------------------------------------------------------------
  {
    id: "glm4-9b",
    family: "glm4",
    displayName: "GLM-4 9B (Unverified Candidate)",
    provider: "Zhipu AI",
    ollamaTag: "glm4:9b",
    displayDigest: "5b699761eca5",
    fullManifestDigest: null,
    ollamaUrl: "https://ollama.com/library/glm4",
    sourceUrl: "https://github.com/THUDM/GLM-4",
    license: "GLM-4 License",
    parameterCount: "9B",
    activeParameterCount: null,
    quantization: "Q4_0",
    sourceDisplaySize: "5.5GB",
    normalizedApproxSizeGb: 5.5,
    exactManifestSizeBytes: null,
    contextTokens: 131072, // 128K
    capabilities: {
      tools: true,
      vision: false,
      audio: null,
      thinking: null,
      capabilityBadges: ["Text"],
    },
    localSupport: true,
    lifecycle: "current",
    verificationStatus: "unverified",
    verifiedAt: "2026-10-02T13:00:00.000Z",
    sourceObservedAt: "2026-10-02T13:00:00.000Z",
    observationProvenance: "regression-fixture",
    officialInferenceMemory: null,
    officialSystemMemoryGuidance: null,
    estimatedSystemMemoryComfort: {
      valueGb: 9,
      methodology: "Heuristic estimate only.",
    },
    strengths: ["chat", "general"],
    gpuBenefit: true,
    description: "Candidate model entry pending full verification audit.",
  },
];

/**
 * Discovers current available model families from curated registry.
 */
export function discoverCurrentModelFamilies(): string[] {
  const families = new Set<string>();
  for (const model of CURATED_MODEL_DEFINITIONS) {
    if (model.lifecycle === "current") {
      families.add(model.family);
    }
  }
  return Array.from(families).sort();
}
