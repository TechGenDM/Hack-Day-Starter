/**
 * Core TypeScript types for the Hack Day Starter Verified Model Registry & Recommendation Engine.
 *
 * Requirements (Phase 2 Rework - Strict Source Verification):
 * - Never invent, estimate, or infer official model facts.
 * - Explicit distinction between:
 *     1. officialInferenceMemory (hardware-specific VRAM/RAM specs)
 *     2. officialSystemMemoryGuidance (vendor-published system RAM recommendations)
 *     3. estimatedSystemMemoryComfort (clearly labeled empirical heuristic)
 * - Exact artifact identity (ollamaTag, exact bytes, quantization, contextTokens, digest).
 * - Distinguish:
 *     verificationStatus: "verified" | "source-discrepancy" | "unverified" | "metadata-stale"
 *     lifecycle: "current" | "legacy" | "retired"
 * - Separate raw source observations from curated verified metadata.
 * - Distinguish "observed from live source" from "verified against source snapshot".
 * - Extended HardwareProfile with gpuVramGb, appleSiliconGeneration, and requiredCapabilities.
 */

// ---------------------------------------------------------------------------
// Hardware Profile
// ---------------------------------------------------------------------------

export type OperatingSystem = "macos" | "linux" | "windows";

export type GpuType = "apple-silicon" | "nvidia" | "none";

export type AppleSiliconGeneration = "m1" | "m2" | "m3" | "m4" | "m5" | "m6";

export type UseCase = "code" | "chat" | "summarization" | "general";

export interface HardwareProfile {
  /** Total system RAM in GB */
  ramGb: number;

  /** Available free disk space in GB (separate from total drive capacity) */
  freeDiskSpaceGb: number;

  /** Host operating system */
  os: OperatingSystem;

  /** Processor / GPU category */
  gpuType: GpuType;

  /** Discrete GPU VRAM in GB (e.g. for NVIDIA; null for integrated/Apple Silicon unified) */
  gpuVramGb: number | null;

  /** Apple Silicon generation (M1, M2, M3, M4) if running on Apple Silicon */
  appleSiliconGeneration: AppleSiliconGeneration | null;

  /** Primary intended task */
  useCase: UseCase;

  /** Optional mandatory capabilities required by the user */
  requiredCapabilities?: Partial<ModelCapabilities>;
}

// ---------------------------------------------------------------------------
// Model Capabilities (verified from authoritative sources)
// ---------------------------------------------------------------------------

export interface ModelCapabilities {
  /** Model natively supports structured tool / function calling (null if unverified from primary source) */
  tools: boolean | null;
  /** Model natively accepts image inputs (null if unverified from primary source) */
  vision: boolean | null;
  /** Model natively accepts direct audio inputs (null if unverified from primary source) */
  audio: boolean | null;
  /** Model supports native reasoning / chain-of-thought tokens (null if unverified from primary source) */
  thinking: boolean | null;
  /** Raw capability badges exposed directly by Ollama source */
  capabilityBadges?: string[];
}

// ---------------------------------------------------------------------------
// Verification & Lifecycle Status
// ---------------------------------------------------------------------------

/**
 * Verification state of our record against primary sources:
 * - "verified": curated record agrees with primary source observation
 * - "source-discrepancy": curated record disagrees with live source observation
 * - "unverified": facts cannot be confirmed from primary sources
 * - "metadata-stale": verification timestamp exceeds freshness threshold
 */
export type VerificationStatus =
  | "verified"
  | "source-discrepancy"
  | "unverified"
  | "metadata-stale";

/**
 * Model lifecycle in the active Ollama ecosystem:
 * - "current": active, primary recommendation candidate
 * - "legacy": older model generation superseded by a newer family (e.g. Gemma 3)
 * - "retired": deprecated or removed from practical use
 */
export type ModelLifecycle = "current" | "legacy" | "retired";

/**
 * Provenance of source observation:
 * - "live-network": queried in real-time from official Ollama library
 * - "regression-fixture": snapshot used as deterministic regression test fixture
 */
export type SourceObservationType = "live-network" | "regression-fixture";

// ---------------------------------------------------------------------------
// Raw Source Observation (Captured directly from official Ollama pages)
// ---------------------------------------------------------------------------

export interface RawOllamaObservation {
  ollamaTag: string;
  /** Short display digest shown on Ollama web pages (e.g. "009acb0d7fe1") */
  displayDigest: string | null;
  /** Full sha256:<64 hex> manifest digest (null unless retrieved from raw manifest) */
  fullManifestDigest: string | null;
  /** Exact text shown by Ollama (e.g. "6.6GB", "6.6–9.5 GB") */
  sourceDisplaySize: string;
  /** Normalized approximate numeric size in GB */
  normalizedApproxSizeGb: number;
  /** Exact artifact size in bytes (nullable! null unless retrieved from actual manifest) */
  exactManifestSizeBytes: number | null;
  displayContext: string; // e.g. "256K", "128K"
  contextTokens: number;
  inputs: string[]; // e.g. ["Text", "Image"]
  capabilityBadges: string[]; // raw badges exposed by source
  observedAt: string; // ISO 8601 timestamp
  sourceUrl: string;
  sourceType: SourceObservationType;
}

// ---------------------------------------------------------------------------
// Memory Data Models
// ---------------------------------------------------------------------------

export interface OfficialInferenceMemory {
  valueGb: number;
  precision: string; // e.g. "Q4_0", "FP16", "Q4_K_M"
  hardwareType: string; // e.g. "CUDA VRAM", "Metal Unified Memory", "TPU"
  sourceUrl: string;
}

export interface OfficialSystemMemoryGuidance {
  valueGb: number;
  sourceUrl: string;
}

export interface EstimatedSystemMemoryComfort {
  valueGb: number;
  methodology: string;
}

// ---------------------------------------------------------------------------
// Verified Model Registry Entry
// ---------------------------------------------------------------------------

export interface ModelEntry {
  /** Unique stable identifier e.g. "gemma-4-12b" */
  id: string;

  /** Architecture family e.g. "gemma4", "qwen3.5", "qwen3.8", "phi4" */
  family: string;

  /** Clean display name e.g. "Gemma 4 12B" */
  displayName: string;

  /** Model creator or provider e.g. "Google", "Alibaba Qwen" */
  provider: string;

  /** Exact Ollama library tag used for `ollama pull <tag>` */
  ollamaTag: string;

  /** Short display digest shown on Ollama webpage (e.g. "009acb0d7fe1") */
  displayDigest: string | null;

  /** Full sha256:<64 hex> manifest digest (nullable! null unless retrieved from actual manifest) */
  fullManifestDigest: string | null;

  /** Primary source URL on official Ollama library */
  ollamaUrl: string;

  /** Secondary source: official provider model card or documentation */
  sourceUrl: string;

  /** Software / model license */
  license: string;

  /** Total parameter count formatted string e.g. "12B", "3.8B", "21B" */
  parameterCount: string;

  /** Active parameter count for MoE models (e.g. "3.6B" for GPT-OSS 20B) */
  activeParameterCount: string | null;

  /** Quantization format of the Ollama artifact e.g. "Q4_K_M", "Q4_0" */
  quantization: string;

  /** Exact text shown by Ollama (e.g. "6.6GB", "6.6–9.5 GB") */
  sourceDisplaySize: string;

  /** Normalized approximate size in GB (e.g. 6.6) */
  normalizedApproxSizeGb: number;

  /** Exact artifact size in bytes (nullable! null unless retrieved from actual manifest) */
  exactManifestSizeBytes: number | null;

  /** Exact context window length in tokens */
  contextTokens: number;

  /** Authoritatively verified capabilities */
  capabilities: ModelCapabilities;

  /** Whether this model variant runs entirely locally via Ollama */
  localSupport: boolean;

  /** Active ecosystem lifecycle */
  lifecycle: ModelLifecycle;

  /** Verification status of this record */
  verificationStatus: VerificationStatus;

  /** ISO 8601 timestamp when this entry was verified */
  verifiedAt: string;

  /** ISO 8601 timestamp when primary source was observed */
  sourceObservedAt: string;

  /** Provenance of the primary observation */
  observationProvenance: SourceObservationType;

  /** Official inference memory specification (nullable) */
  officialInferenceMemory: OfficialInferenceMemory | null;

  /** Official system memory guidance (nullable) */
  officialSystemMemoryGuidance: OfficialSystemMemoryGuidance | null;

  /** Estimated memory comfort heuristic (clearly labeled as estimate) */
  estimatedSystemMemoryComfort: EstimatedSystemMemoryComfort | null;

  /** Strongest use cases */
  strengths: UseCase[];

  /** Whether the model benefits significantly from GPU acceleration */
  gpuBenefit: boolean;

  /** One-line description */
  description: string;
}

// ---------------------------------------------------------------------------
// Registry Metadata
// ---------------------------------------------------------------------------

export interface RegistryMetadata {
  registryVersion: string;
  lastVerifiedAt: string; // ISO 8601 timestamp
  verifiedDisplayDate: string; // Human-readable date e.g. "October 2, 2026 13:00 UTC"
  sourceLibraryUrl: string;
  observationSource: SourceObservationType;
  totalModels: number;
  verifiedModelsCount: number;
  discrepancyCount: number;
}

// ---------------------------------------------------------------------------
// Recommendation Result
// ---------------------------------------------------------------------------

export type CompatibilityLevel = "excellent" | "good" | "marginal";

export interface Recommendation {
  model: ModelEntry;
  compatibilityLevel: CompatibilityLevel;
  explanation: string;
  formattedArtifactSize: string;
  recommendedDiskBufferGb: number;
  memory: {
    officialInference: OfficialInferenceMemory | null;
    officialSystemGuidance: OfficialSystemMemoryGuidance | null;
    estimatedComfort: EstimatedSystemMemoryComfort | null;
  };
}

// ---------------------------------------------------------------------------
// Starter Project Types (Phase 2 Selection)
// ---------------------------------------------------------------------------

export type StarterType = "chat" | "agent";
