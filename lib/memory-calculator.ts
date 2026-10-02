/**
 * Memory calculation & formatting utilities for Hack Day Starter.
 *
 * Core Principles:
 * 1. Never convert GPU/TPU memory into an "official RAM requirement".
 * 2. Explicitly separate:
 *    - officialInferenceMemory (VRAM/RAM hardware specifications)
 *    - officialSystemMemoryGuidance (vendor-published system RAM recommendations)
 *    - estimatedSystemMemoryComfort (clearly labeled empirical heuristic)
 * 3. Never present empirical heuristics as official manufacturer mandates.
 */

import { ModelEntry } from "./types";

export interface MemoryReport {
  hasOfficialSystemGuidance: boolean;
  officialSystemGuidanceGb: number | null;
  officialSystemSource: string | null;

  hasOfficialInferenceSpec: boolean;
  officialInferenceGb: number | null;
  officialInferencePrecision: string | null;
  officialInferenceHardware: string | null;
  officialInferenceSource: string | null;

  estimatedComfortGb: number;
  estimatedMethodology: string;

  /** Primary memory baseline used for recommendation gating */
  recommendationBaselineGb: number;
  baselineType: "official-system" | "estimated-comfort";
}

/**
 * Formats a model's size adhering strictly to factual precision:
 * - "Manifest size: X GB" when exactManifestSizeBytes is known
 * - "Ollama listed: <text>" when relying on official Ollama listed size/range
 */
export function formatModelDisplaySize(model: ModelEntry): string {
  if (model.exactManifestSizeBytes !== null && model.exactManifestSizeBytes > 0) {
    return `Manifest size: ${(model.exactManifestSizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  return `Ollama listed: ${model.sourceDisplaySize}`;
}

/**
 * Returns the best available numeric approximate size in GB for hardware gating calculations.
 */
export function getModelApproxSizeGb(model: ModelEntry): number {
  if (model.exactManifestSizeBytes !== null && model.exactManifestSizeBytes > 0) {
    return model.exactManifestSizeBytes / (1024 * 1024 * 1024);
  }
  return model.normalizedApproxSizeGb;
}

/**
 * Formats raw integer bytes into a standard human-readable GB string.
 * Example: 8376182579 bytes → "7.80 GB"
 */
export function formatBytesToGb(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(2)} GB`;
}

/**
 * Returns formatted memory report cleanly distinguishing verified facts from heuristics.
 */
export function getModelMemoryReport(model: ModelEntry): MemoryReport {
  const hasOfficialSystem = model.officialSystemMemoryGuidance !== null;
  const hasOfficialInference = model.officialInferenceMemory !== null;

  const approxSizeGb = getModelApproxSizeGb(model);

  // Calculate or retrieve estimated comfort
  const estimatedComfortGb =
    model.estimatedSystemMemoryComfort?.valueGb ??
    Math.ceil(approxSizeGb + (approxSizeGb > 10 ? 4 : 2.5));

  const estimatedMethodology =
    model.estimatedSystemMemoryComfort?.methodology ??
    "Estimated heuristic: Artifact size + KV cache buffer + OS headroom.";

  // Baseline for recommendation gating:
  // If vendor publishes official system guidance, use it. Otherwise, use estimated comfort.
  const recommendationBaselineGb = hasOfficialSystem
    ? model.officialSystemMemoryGuidance!.valueGb
    : estimatedComfortGb;

  const baselineType: "official-system" | "estimated-comfort" = hasOfficialSystem
    ? "official-system"
    : "estimated-comfort";

  return {
    hasOfficialSystemGuidance: hasOfficialSystem,
    officialSystemGuidanceGb: model.officialSystemMemoryGuidance?.valueGb ?? null,
    officialSystemSource: model.officialSystemMemoryGuidance?.sourceUrl ?? null,

    hasOfficialInferenceSpec: hasOfficialInference,
    officialInferenceGb: model.officialInferenceMemory?.valueGb ?? null,
    officialInferencePrecision: model.officialInferenceMemory?.precision ?? null,
    officialInferenceHardware: model.officialInferenceMemory?.hardwareType ?? null,
    officialInferenceSource: model.officialInferenceMemory?.sourceUrl ?? null,

    estimatedComfortGb,
    estimatedMethodology,

    recommendationBaselineGb,
    baselineType,
  };
}
