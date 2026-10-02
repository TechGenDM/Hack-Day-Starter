/**
 * Memory calculation utilities for Hack Day Starter.
 *
 * Design guidelines:
 * - We NEVER present our heuristic calculations as official manufacturer requirements.
 * - When `officialMemoryGuidance` is provided by the model author, we use it directly
 *   and cite the authoritative source.
 * - When no official guidance is published, we compute an "Estimated memory comfort"
 *   based on artifact size plus standard runtime overhead (KV cache, context buffer,
 *   and OS headroom).
 */

import { ModelEntry } from "./types";

export interface MemoryInfo {
  /** Value in GB */
  valueGb: number;
  /** Whether this value originates from an official vendor specification */
  isOfficial: boolean;
  /** Formatted user-facing badge label */
  displayLabel: string;
  /** Formatted descriptive sentence */
  descriptionText: string;
  /** Source attribution URL/note if official */
  source: string | null;
}

/**
 * Calculates a transparent, conservative memory comfort estimate in GB.
 *
 * Formula:
 * - Base: Model artifact download size (approximates Q4/Q8 quantized weight size).
 * - Context & KV cache buffer: ~1.5 GB for small models (< 4 GB), ~2.5 GB for medium models (4-10 GB),
 *   ~4.0 GB for larger models (> 10 GB).
 * - Rounded up to integer GB for developer clarity.
 */
export function calculateEstimatedMemoryComfort(model: ModelEntry): number {
  const baseSize = model.artifactSizeGb;
  let buffer = 1.5;

  if (baseSize >= 10) {
    buffer = 4.0;
  } else if (baseSize >= 4) {
    buffer = 2.5;
  }

  return Math.ceil(baseSize + buffer);
}

/**
 * Returns complete, transparent memory information for a model entry.
 */
export function getModelMemoryInfo(model: ModelEntry): MemoryInfo {
  if (model.officialMemoryGuidance !== null) {
    return {
      valueGb: model.officialMemoryGuidance,
      isOfficial: true,
      displayLabel: `Official memory guidance: ${model.officialMemoryGuidance} GB`,
      descriptionText: `Official manufacturer guidance (${model.memoryGuidanceSource || "vendor documentation"}) recommends at least ${model.officialMemoryGuidance} GB RAM.`,
      source: model.memoryGuidanceSource,
    };
  }

  const estimated = calculateEstimatedMemoryComfort(model);
  return {
    valueGb: estimated,
    isOfficial: false,
    displayLabel: `Estimated memory comfort: ${estimated} GB`,
    descriptionText: `Estimated memory comfort: ~${estimated} GB (estimated from ${model.artifactSizeGb} GB artifact + runtime overhead; not an official manufacturer requirement).`,
    source: null,
  };
}
