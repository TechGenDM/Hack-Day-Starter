/**
 * Verified Model Registry for Hack Day Starter.
 *
 * Requirements (Phase 2 Rework):
 * - Built from the authoritative Ollama discovery & sync layer (`lib/sources/ollama.ts`).
 * - Contains exact artifact metadata (bytes, tags, quantization, contextTokens, digests).
 * - Distinguishes lifecycle ('current', 'legacy', 'retired') and verificationStatus ('verified', 'source-discrepancy', 'unverified', 'metadata-stale').
 * - Distinguishes 'observed from live source' vs 'verified against source snapshot'.
 * - Single source of truth for catalog version and verification date.
 */

import { CURATED_MODEL_DEFINITIONS } from "./sources/ollama";
import { ModelEntry, RegistryMetadata } from "./types";

export const VERIFIED_MODEL_REGISTRY: ModelEntry[] = CURATED_MODEL_DEFINITIONS;

export const REGISTRY_METADATA: RegistryMetadata = {
  registryVersion: "2026.10.02.3",
  lastVerifiedAt: "2026-10-02T13:00:00.000Z",
  verifiedDisplayDate: "October 2, 2026 13:00 UTC",
  sourceLibraryUrl: "https://ollama.com/library",
  observationSource: "regression-fixture",
  totalModels: VERIFIED_MODEL_REGISTRY.length,
  verifiedModelsCount: VERIFIED_MODEL_REGISTRY.filter(
    (m) => m.verificationStatus === "verified"
  ).length,
  discrepancyCount: VERIFIED_MODEL_REGISTRY.filter(
    (m) => m.verificationStatus === "source-discrepancy"
  ).length,
};

/**
 * Returns only models eligible for active local recommendations.
 * Criteria:
 * - localSupport === true
 * - verificationStatus === "verified"
 * - lifecycle !== "retired"
 */
export function getEligibleLocalModels(): ModelEntry[] {
  return VERIFIED_MODEL_REGISTRY.filter(
    (m) =>
      m.localSupport &&
      m.verificationStatus === "verified" &&
      m.lifecycle !== "retired"
  );
}
