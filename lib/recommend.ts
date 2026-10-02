/**
 * Deterministic recommendation engine for Hack Day Starter.
 *
 * Phase 2 enhancements:
 * - Powered by the Verified Model Registry (`lib/registry.ts`).
 * - Strictly filters by `localSupport === true` and `verificationStatus === "verified"`.
 * - Strictly filters by `freeDiskSpaceGb` (ensuring sufficient room for model artifact).
 * - Distinguishes between official memory guidance and estimated memory comfort.
 * - Scores models based on hardware fit, use case, tool capabilities, model capacity, and disk headroom.
 * - Generates clear, non-hyperbolic explanations with no false performance guarantees.
 */

import { VERIFIED_MODEL_REGISTRY } from "./registry";
import {
  calculateEstimatedMemoryComfort,
  getModelMemoryInfo,
} from "./memory-calculator";
import {
  CompatibilityLevel,
  HardwareProfile,
  ModelEntry,
  Recommendation,
} from "./types";

/** Maximum recommendations returned to the user */
const MAX_RESULTS = 3;

/** Minimum free disk buffer required above artifact size (GB) */
const DISK_SAFETY_BUFFER_GB = 1.0;

// ---------------------------------------------------------------------------
// Phase 1: Hard filter — can this model physically be downloaded and run?
// ---------------------------------------------------------------------------

export function canModelRun(
  model: ModelEntry,
  profile: HardwareProfile
): { eligible: boolean; reason?: string } {
  // 1. Must be locally runnable and currently verified
  if (!model.localSupport) {
    return { eligible: false, reason: "Requires cloud environment" };
  }
  if (model.verificationStatus !== "verified") {
    return { eligible: false, reason: "Catalog entry is stale or unverified" };
  }

  // 2. Free disk space filter
  const requiredDisk = model.artifactSizeGb + DISK_SAFETY_BUFFER_GB;
  if (profile.freeDiskSpaceGb < requiredDisk) {
    return {
      eligible: false,
      reason: `Insufficient free disk space (${profile.freeDiskSpaceGb} GB available, ~${requiredDisk.toFixed(1)} GB required)`,
    };
  }

  // 3. Minimum RAM requirement
  // If official guidance exists, allow if system has at least 75% of guidance (covers unified memory / slight deficits)
  // If no official guidance, require at least the artifact size + 1.5 GB runtime floor.
  const minViableRam =
    model.officialMemoryGuidance !== null
      ? Math.floor(model.officialMemoryGuidance * 0.75)
      : Math.ceil(model.artifactSizeGb + 1.5);

  if (profile.ramGb < minViableRam) {
    return {
      eligible: false,
      reason: `Insufficient RAM (${profile.ramGb} GB available, ~${minViableRam} GB minimum viable)`,
    };
  }

  return { eligible: true };
}

// ---------------------------------------------------------------------------
// Phase 2: Scoring — how well does the model fit the developer's scenario?
// ---------------------------------------------------------------------------

export function scoreModel(
  model: ModelEntry,
  profile: HardwareProfile
): number {
  let score = 0;

  // --- 1. Use-case relevance (0 or 40 pts) ---
  if (model.strengths.includes(profile.useCase)) {
    score += 40;
  }

  // --- 2. Memory headroom & comfort (0–30 pts) ---
  const memoryInfo = getModelMemoryInfo(model);
  const headroom = profile.ramGb - memoryInfo.valueGb;

  if (headroom >= 0) {
    // Normalise: 0 GB headroom → 10 pts, ≥16 GB headroom → 30 pts
    score += 10 + Math.min(20, (headroom / 16) * 20);
  } else {
    // Under recommended comfort: score between 0 and 8 pts based on deficit
    score += Math.max(0, 8 + headroom * 2);
  }

  // --- 3. Model capacity bonus (0–15 pts) ---
  // When system has ample hardware (16+ GB RAM) with healthy headroom (>= 2 GB),
  // reward capable 8B–12B models for superior reasoning and coding logic.
  // On constrained machines (<= 8 GB), avoid boosting heavy models so lighter,
  // responsive models that leave memory for the OS and browser rank first.
  if (profile.ramGb >= 16 && headroom >= 2) {
    const paramNum = parseFloat(model.parameterCount);
    if (!isNaN(paramNum)) {
      score += Math.min(15, (paramNum / 12) * 15);
    }
  }

  // --- 4. GPU acceleration bonus (0 or 20 pts) ---
  if (model.gpuBenefit && profile.gpu !== "none") {
    score += 20;
  }

  // --- 5. Apple Silicon unified memory bonus (0 or 10 pts) ---
  if (profile.gpu === "apple-silicon" && profile.os === "macos") {
    score += 10;
  }

  // --- 6. Tool-calling capability bonus (0 or 10 pts) ---
  // Models with function calling are more versatile for hack day projects
  if (model.capabilities.tools) {
    score += 10;
  }

  // --- 7. Disk space comfort bonus (0 or 5 pts) ---
  // Reward models that leave plenty of free disk space for caches & node_modules
  if (profile.freeDiskSpaceGb >= model.artifactSizeGb * 2.5) {
    score += 5;
  }

  return score;
}

// ---------------------------------------------------------------------------
// Phase 3: Classify compatibility level
// ---------------------------------------------------------------------------

export function classifyCompatibility(
  model: ModelEntry,
  profile: HardwareProfile
): CompatibilityLevel {
  const memoryInfo = getModelMemoryInfo(model);
  const headroom = profile.ramGb - memoryInfo.valueGb;

  if (headroom >= 4 && (profile.gpu !== "none" || profile.ramGb >= 16)) {
    return "excellent";
  }
  if (headroom >= 0) {
    return "good";
  }
  return "marginal";
}

// ---------------------------------------------------------------------------
// Phase 4: Generate transparent, honest explanation
// ---------------------------------------------------------------------------

export function buildExplanation(
  model: ModelEntry,
  profile: HardwareProfile,
  compatibility: CompatibilityLevel
): string {
  const parts: string[] = [];

  // Hardware context
  const hwDescription =
    profile.gpu === "apple-silicon" && profile.os === "macos"
      ? `Mac with ${profile.ramGb} GB unified memory`
      : profile.gpu === "nvidia"
      ? `system with ${profile.ramGb} GB RAM and NVIDIA GPU acceleration`
      : `system with ${profile.ramGb} GB RAM (CPU-only)`;

  parts.push(
    `Recommended because your ${hwDescription} fits the ~${model.artifactSizeGb} GB Ollama artifact`
  );

  // Free disk space context
  const diskRemaining = profile.freeDiskSpaceGb - model.artifactSizeGb;
  parts.push(
    `leaves ~${diskRemaining.toFixed(0)} GB free disk space`
  );

  // Use case & capability context
  const hasTools = model.capabilities.tools;
  if (model.strengths.includes(profile.useCase)) {
    if (hasTools) {
      parts.push(
        `supports your selected ${profile.useCase} use case with native tool-calling`
      );
    } else {
      parts.push(`specialised for your ${profile.useCase} use case`);
    }
  } else {
    parts.push(`capable general model that runs within your constraints`);
  }

  // Marginal fit disclaimer
  if (compatibility === "marginal") {
    parts.push(`tight memory headroom — consider closing background applications`);
  }

  return `${parts.join(", ")}.`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function recommendModels(
  profile: HardwareProfile,
  catalog: ModelEntry[] = VERIFIED_MODEL_REGISTRY
): Recommendation[] {
  // 1. Filter out physically incompatible models
  const eligible = catalog.filter((m) => canModelRun(m, profile).eligible);

  // 2. Score and sort descending
  const scored = eligible
    .map((model) => ({ model, score: scoreModel(model, profile) }))
    .sort((a, b) => b.score - a.score);

  // 3. Return top N with rich explanations and memory guidance
  return scored.slice(0, MAX_RESULTS).map(({ model }) => {
    const compatibility = classifyCompatibility(model, profile);
    const memoryInfo = getModelMemoryInfo(model);

    return {
      model,
      compatibilityLevel: compatibility,
      explanation: buildExplanation(model, profile, compatibility),
      estimatedMemoryComfort: calculateEstimatedMemoryComfort(model),
      memoryGuidanceType: memoryInfo.isOfficial ? "official" : "estimated",
    };
  });
}
