/**
 * Core TypeScript types for the Hack Day Starter Verified Model Registry & Recommendation Engine.
 *
 * Requirements (Phase 2 Rework):
 * - Never invent, estimate, or infer official model facts.
 * - Explicit distinction between:
 *     1. officialInferenceMemory (hardware-specific VRAM/RAM specs)
 *     2. officialSystemMemoryGuidance (vendor-published system RAM recommendations)
 *     3. estimatedSystemMemoryComfort (clearly labeled empirical heuristic)
 * - Exact artifact identity (ollamaTag, exact bytes, quantization, contextTokens, digest).
 * - Verified capabilities (tools, vision, audio, thinking) from authoritative sources.
 * - Model lifecycle ('current' | 'legacy' | 'retired') and verificationStatus ('verified' | 'metadata-stale' | 'unavailable').
 * - Extended HardwareProfile with gpuVramGb, appleSiliconGeneration, and requiredCapabilities.
 */

// ---------------------------------------------------------------------------
// Hardware Profile
// ---------------------------------------------------------------------------

export type OperatingSystem = "macos" | "linux" | "windows";

export type GpuType = "apple-silicon" | "nvidia" | "none";

export type AppleSiliconGeneration = "m1" | "m2" | "m3" | "m4";

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
  /** Model natively supports structured tool / function calling */
  tools: boolean;
  /** Model natively accepts image inputs */
  vision: boolean;
  /** Model natively accepts direct audio inputs */
  audio: boolean;
  /** Model supports native reasoning / chain-of-thought tokens */
  thinking: boolean;
}

// ---------------------------------------------------------------------------
// Verification & Lifecycle Status
// ---------------------------------------------------------------------------

/**
 * Verification state of our record against primary sources.
 * - "verified": verified against current primary source
 * - "metadata-stale": verification timestamp is older than freshness threshold
 * - "unavailable": cannot be fetched or verified from primary source
 */
export type VerificationStatus = "verified" | "metadata-stale" | "unavailable";

/**
 * Model lifecycle in the active Ollama ecosystem.
 * - "current": active, primary recommendation candidate
 * - "legacy": older model generation superseded by a newer family (e.g. Gemma 3)
 * - "retired": deprecated or removed from practical use
 */
export type ModelLifecycle = "current" | "legacy" | "retired";

// ---------------------------------------------------------------------------
// Memory Data Models
// ---------------------------------------------------------------------------

/**
 * Official inference memory specification published by vendor/provider.
 * Example: "Approx. Q4_0 inference memory: 4.5 GB on CUDA"
 */
export interface OfficialInferenceMemory {
  valueGb: number;
  precision: string; // e.g. "Q4_0", "FP16", "Q4_K_M"
  hardwareType: string; // e.g. "CUDA VRAM", "Metal Unified Memory", "TPU"
  sourceUrl: string;
}

/**
 * Official system memory guidance published by model author.
 * Example: Google Gemma 4 model card stating 16 GB unified memory.
 */
export interface OfficialSystemMemoryGuidance {
  valueGb: number;
  sourceUrl: string;
}

/**
 * Clearly labeled empirical heuristic estimate when no official guidance is published.
 * Must include the methodology explanation.
 */
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

  /** Architecture family e.g. "gemma4", "qwen3.5", "phi4" */
  family: string;

  /** Clean display name e.g. "Gemma 4 12B" */
  displayName: string;

  /** Model creator or provider e.g. "Google", "Alibaba Qwen" */
  provider: string;

  /** Exact Ollama library tag used for `ollama pull <tag>` */
  ollamaTag: string;

  /** Exact Ollama manifest digest if available */
  ollamaDigest: string | null;

  /** Primary source URL on official Ollama library */
  ollamaUrl: string;

  /** Secondary source: official provider model card or documentation */
  sourceUrl: string;

  /** Software / model license */
  license: string;

  /** Total parameter count formatted string e.g. "12B", "3.8B", "20B" */
  parameterCount: string;

  /** Active parameter count for MoE models (e.g. "4B" for 20B MoE) */
  activeParameterCount: string | null;

  /** Quantization format of the Ollama artifact e.g. "Q4_K_M", "Q4_0" */
  quantization: string;

  /** Exact artifact size in bytes */
  artifactSizeBytes: number;

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

  /** ISO 8601 timestamp when this entry was authoritatively verified */
  verifiedAt: string;

  /** ISO 8601 timestamp when primary source was observed */
  sourceObservedAt: string;

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
  verifiedDisplayDate: string; // Human-readable date e.g. "October 2, 2026 18:00 UTC"
  sourceLibraryUrl: string;
  totalModels: number;
  verifiedModelsCount: number;
}

// ---------------------------------------------------------------------------
// Recommendation Result
// ---------------------------------------------------------------------------

export type CompatibilityLevel = "excellent" | "good" | "marginal";

export interface Recommendation {
  model: ModelEntry;
  compatibilityLevel: CompatibilityLevel;
  explanation: string;
  /** Formatted download size e.g. "7.8 GB" */
  formattedArtifactSize: string;
  /** Recommended free disk buffer heuristic (GB) */
  recommendedDiskBufferGb: number;
  /** Memory data breakdown for UI transparency */
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
