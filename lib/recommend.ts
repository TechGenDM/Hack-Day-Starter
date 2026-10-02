/**
 * Deterministic Recommendation Engine for Hack Day Starter.
 *
 * Phase 2 Rework Rules:
 * 1. Hard Filters:
 *    - localSupport === true
 *    - lifecycle !== 'retired'
 *    - verificationStatus === 'verified'
 *    - freeDiskSpaceGb >= artifactSizeGb + safetyMarginGb
 *    - ramGb >= minimum viable threshold
 *    - meets any requiredCapabilities specified by the user
 * 2. Deterministic Scoring:
 *    - Use-case relevance (+40)
 *    - Memory headroom & comfort (0–30)
 *    - Model capacity (0–15) using activeParameterCount for MoE, applied ONLY when hardware supports it
 *    - GPU acceleration bonus (+20) + VRAM fit bonus (+5 if fits in discrete VRAM)
 *    - Apple Silicon unified memory bonus (+10)
 *    - Tool capability bonus (+10)
 *    - Free disk comfort buffer bonus (+5)
 * 3. Transparent, non-hyperbolic explanation generation.
 */

import { getEligibleLocalModels } from "./registry";
import {
  getModelMemoryReport,
  getModelApproxSizeGb,
  formatModelDisplaySize,
} from "./memory-calculator";
import {
  CompatibilityLevel,
  HardwareProfile,
  ModelEntry,
  Recommendation,
} from "./types";

/** Maximum recommendations returned to the user */
const MAX_RESULTS = 3;

/** Recommended free disk buffer heuristic (GB) */
export const RECOMMENDED_DISK_BUFFER_GB = 1.5;

// ---------------------------------------------------------------------------
// Phase 1: Hard Filter — Can this model physically run on this hardware?
// ---------------------------------------------------------------------------

export function canModelRun(
  model: ModelEntry,
  profile: HardwareProfile
): { eligible: boolean; reason?: string } {
  // 1. Availability & Lifecycle
  if (!model.localSupport) {
    return { eligible: false, reason: "Requires remote or cloud execution" };
  }
  if (model.lifecycle === "retired") {
    return { eligible: false, reason: "Model generation is retired" };
  }
  if (model.verificationStatus !== "verified") {
    return { eligible: false, reason: "Model metadata is stale or unverified" };
  }

  // 2. Storage Check (Artifact Size + Heuristic Safety Buffer)
  const artifactSizeGb = getModelApproxSizeGb(model);
  const requiredDiskGb = artifactSizeGb + RECOMMENDED_DISK_BUFFER_GB;
  if (profile.freeDiskSpaceGb < requiredDiskGb) {
    return {
      eligible: false,
      reason: `Insufficient free disk space (${profile.freeDiskSpaceGb} GB free, ~${requiredDiskGb.toFixed(1)} GB required)`,
    };
  }

  // 3. User Required Capabilities Check
  if (profile.requiredCapabilities) {
    for (const [key, reqVal] of Object.entries(profile.requiredCapabilities)) {
      if (reqVal === true && model.capabilities[key as keyof typeof model.capabilities] !== true) {
        return {
          eligible: false,
          reason: `Model lacks required capability: ${key}`,
        };
      }
    }
  }

  // 4. Memory Check
  const memoryReport = getModelMemoryReport(model);
  const minViableRam = memoryReport.hasOfficialSystemGuidance
    ? Math.floor(memoryReport.officialSystemGuidanceGb! * 0.75)
    : Math.ceil(artifactSizeGb + 1.2);

  if (profile.ramGb < minViableRam) {
    return {
      eligible: false,
      reason: `Insufficient system RAM (${profile.ramGb} GB available, ~${minViableRam} GB minimum viable)`,
    };
  }

  return { eligible: true };
}

// ---------------------------------------------------------------------------
// Phase 2: Scoring — Transparent deterministic ranking
// ---------------------------------------------------------------------------

export function scoreModel(
  model: ModelEntry,
  profile: HardwareProfile
): number {
  let score = 0;
  const artifactSizeGb = getModelApproxSizeGb(model);
  const memoryReport = getModelMemoryReport(model);

  // --- 1. Use-case Relevance (0 or 40 pts) ---
  if (model.strengths.includes(profile.useCase)) {
    score += 40;
  }

  // --- 2. Memory Headroom & Comfort (0–30 pts) ---
  const headroom = profile.ramGb - memoryReport.recommendationBaselineGb;
  if (headroom >= 0) {
    // 0 GB headroom → 10 pts, >= 16 GB headroom → 30 pts
    score += 10 + Math.min(20, (headroom / 16) * 20);
  } else {
    // Deficit: 0 to 8 pts
    score += Math.max(0, 8 + headroom * 2);
  }

  // --- 3. Model Capacity Bonus (0–15 pts) ---
  // Parameter count alone must NOT be treated as capability because MoE models
  // have large total parameter counts but fewer active parameters.
  // We use activeParameterCount when present (e.g. 3.6B active for GPT-OSS 20B).
  // Furthermore, capacity bonus ONLY applies when hardware has >= 16 GB RAM and ample headroom.
  if (profile.ramGb >= 16 && headroom >= 2) {
    const effectiveParamsStr = model.activeParameterCount ?? model.parameterCount;
    const effectiveParamNum = parseFloat(effectiveParamsStr);
    if (!isNaN(effectiveParamNum)) {
      // Scale up to 15 pts for up to 12B active parameters
      score += Math.min(15, (effectiveParamNum / 12) * 15);
    }
  }

  // --- 4. GPU & VRAM Bonus (0 to 25 pts) ---
  if (model.gpuBenefit) {
    if (profile.gpuType === "nvidia") {
      score += 20;
      // Bonus if model fits directly in discrete GPU VRAM
      if (profile.gpuVramGb !== null && profile.gpuVramGb >= artifactSizeGb + 0.8) {
        score += 5;
      }
    } else if (profile.gpuType === "apple-silicon" && profile.os === "macos") {
      // Apple Silicon unified memory acceleration via Metal
      score += 30; // 20 GPU + 10 Apple Silicon bonus
    }
  }

  // --- 5. Tool-calling Capability Bonus (0 or 10 pts) ---
  if (model.capabilities.tools === true) {
    score += 10;
  }

  // --- 6. Free Disk Headroom Bonus (0 or 5 pts) ---
  if (profile.freeDiskSpaceGb >= artifactSizeGb * 2.5) {
    score += 5;
  }

  return score;
}

// ---------------------------------------------------------------------------
// Phase 3: Classification
// ---------------------------------------------------------------------------

export function classifyCompatibility(
  model: ModelEntry,
  profile: HardwareProfile
): CompatibilityLevel {
  const memoryReport = getModelMemoryReport(model);
  const headroom = profile.ramGb - memoryReport.recommendationBaselineGb;

  if (headroom >= 4 && (profile.gpuType !== "none" || profile.ramGb >= 16)) {
    return "excellent";
  }
  if (headroom >= 0) {
    return "good";
  }
  return "marginal";
}

// ---------------------------------------------------------------------------
// Phase 4: Explanation Generation
// ---------------------------------------------------------------------------

export function buildExplanation(
  model: ModelEntry,
  profile: HardwareProfile,
  compatibility: CompatibilityLevel
): string {
  const parts: string[] = [];
  const artifactSizeGb = getModelApproxSizeGb(model);
  const formattedSize = formatModelDisplaySize(model);

  // Hardware context
  const hwDescription =
    profile.gpuType === "apple-silicon" && profile.os === "macos"
      ? `Mac with ${profile.ramGb} GB unified memory`
      : profile.gpuType === "nvidia"
      ? `system with ${profile.ramGb} GB RAM and NVIDIA GPU`
      : `system with ${profile.ramGb} GB RAM (CPU-only)`;

  parts.push(
    `Recommended because your ${hwDescription} fits the ${formattedSize}`
  );

  // Free disk space context
  const diskRemaining = profile.freeDiskSpaceGb - artifactSizeGb;
  parts.push(
    `leaves ~${diskRemaining.toFixed(0)} GB free disk space (after recommended ${RECOMMENDED_DISK_BUFFER_GB} GB safety buffer)`
  );

  // Use case & capability context
  if (model.strengths.includes(profile.useCase)) {
    if (model.capabilities.tools === true) {
      parts.push(
        `supports your selected ${profile.useCase} use case with verified tool calling`
      );
    } else {
      parts.push(`specialised for your ${profile.useCase} use case`);
    }
  } else {
    parts.push(`general-purpose model meeting your hardware constraints`);
  }

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
  catalog: ModelEntry[] = getEligibleLocalModels()
): Recommendation[] {
  // 1. Filter out ineligible models
  const eligible = catalog.filter((m) => canModelRun(m, profile).eligible);

  // 2. Score and sort descending
  const scored = eligible
    .map((model) => ({ model, score: scoreModel(model, profile) }))
    .sort((a, b) => b.score - a.score);

  // 3. Return top N with comprehensive metadata
  return scored.slice(0, MAX_RESULTS).map(({ model }) => {
    const compatibility = classifyCompatibility(model, profile);

    return {
      model,
      compatibilityLevel: compatibility,
      explanation: buildExplanation(model, profile, compatibility),
      formattedArtifactSize: formatModelDisplaySize(model),
      recommendedDiskBufferGb: RECOMMENDED_DISK_BUFFER_GB,
      memory: {
        officialInference: model.officialInferenceMemory,
        officialSystemGuidance: model.officialSystemMemoryGuidance,
        estimatedComfort: model.estimatedSystemMemoryComfort,
      },
    };
  });
}
