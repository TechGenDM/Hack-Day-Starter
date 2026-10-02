/**
 * Registry Validation Utility.
 *
 * Ensures model records are internally consistent, compliant with the source hierarchy,
 * and detects stale entries exceeding freshness thresholds.
 */

import { ModelEntry, VerificationStatus } from "./types";
import { VERIFIED_MODEL_REGISTRY, REGISTRY_METADATA } from "./registry";

export interface ValidationIssue {
  modelId: string;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface RegistryValidationReport {
  isValid: boolean;
  totalModels: number;
  verifiedCount: number;
  staleCount: number;
  unverifiedCount: number;
  issues: ValidationIssue[];
  catalogDate: string;
}

/**
 * Validates the model registry.
 *
 * Checks:
 * 1. Required fields are non-empty.
 * 2. Official memory guidance has an authoritative source citation.
 * 3. Freshness: entries verified more than maxAgeDays prior to asOfDate are flagged as stale.
 * 4. Verification status matches the freshness and source criteria.
 */
export function validateModelRegistry(
  models: ModelEntry[] = VERIFIED_MODEL_REGISTRY,
  options?: {
    asOfDate?: Date;
    maxAgeDays?: number;
  }
): RegistryValidationReport {
  const asOf = options?.asOfDate ?? new Date("2026-10-02T00:00:00.000Z");
  const maxAgeDays = options?.maxAgeDays ?? 180; // 6 months threshold
  const issues: ValidationIssue[] = [];

  let verifiedCount = 0;
  let staleCount = 0;
  let unverifiedCount = 0;

  for (const model of models) {
    if (model.verificationStatus === "verified") verifiedCount++;
    else if (model.verificationStatus === "stale") staleCount++;
    else unverifiedCount++;

    // 1. Mandatory tags and identifiers
    if (!model.id || !model.ollamaTag) {
      issues.push({
        modelId: model.id || "unknown",
        field: "id/ollamaTag",
        message: "Model must have a non-empty id and ollamaTag.",
        severity: "error",
      });
    }

    // 2. Artifact size must be positive
    if (typeof model.artifactSizeGb !== "number" || model.artifactSizeGb <= 0) {
      issues.push({
        modelId: model.id,
        field: "artifactSizeGb",
        message: "Model artifactSizeGb must be a positive number.",
        severity: "error",
      });
    }

    // 3. Memory guidance integrity
    if (model.officialMemoryGuidance !== null) {
      if (model.officialMemoryGuidance <= 0) {
        issues.push({
          modelId: model.id,
          field: "officialMemoryGuidance",
          message: "Official memory guidance must be positive if specified.",
          severity: "error",
        });
      }
      if (!model.memoryGuidanceSource) {
        issues.push({
          modelId: model.id,
          field: "memoryGuidanceSource",
          message:
            "Official memory guidance must reference an authoritative source citation.",
          severity: "error",
        });
      }
    }

    // 4. Source URLs
    if (!model.ollamaUrl?.startsWith("http")) {
      issues.push({
        modelId: model.id,
        field: "ollamaUrl",
        message: "Model must provide a valid official Ollama URL.",
        severity: "error",
      });
    }

    // 5. Freshness check
    const verifiedDate = new Date(model.verifiedAt);
    if (isNaN(verifiedDate.getTime())) {
      issues.push({
        modelId: model.id,
        field: "verifiedAt",
        message: "Invalid ISO timestamp in verifiedAt.",
        severity: "error",
      });
    } else {
      const ageInDays =
        (asOf.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (ageInDays > maxAgeDays && model.verificationStatus === "verified") {
        issues.push({
          modelId: model.id,
          field: "verifiedAt",
          message: `Model entry is ${Math.floor(
            ageInDays
          )} days old and may be stale. Re-verification required.`,
          severity: "warning",
        });
      }
    }
  }

  const hasErrors = issues.some((i) => i.severity === "error");

  return {
    isValid: !hasErrors,
    totalModels: models.length,
    verifiedCount,
    staleCount,
    unverifiedCount,
    issues,
    catalogDate: REGISTRY_METADATA.verifiedDisplayDate,
  };
}
